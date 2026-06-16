"""
Проверка истечения подписок, сброс на Basic и отправка уведомлений.

АРХИТЕКТУРА — НЕ МЕНЯТЬ БЕЗ ПОНИМАНИЯ:
  1. Сначала ВСЕ изменения в БД (понижения тарифов, уведомления) + commit
  2. Потом отправка писем батчами — так тарифы сбросятся даже если SMTP упадёт

SMTP батчи: по 10 писем, пауза 1 сек между батчами — настроено намеренно,
  чтобы не получить блокировку от Gmail за спам.

Grace period: после истечения subscription_end_at пользователь ещё в тарифе
  до истечения grace_period_end_at (обычно +3 дня). Только после этого → Basic.

72-часовой пробный период: определяется по отсутствию оплаченных заказов
  (orders WHERE status='paid'). Таким пользователям уходит другое письмо.
"""
import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone
import psycopg2


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Content-Type': 'application/json',
}


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema():
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


def send_emails_bulk(emails: list, batch_size: int = 10) -> int:
    """
    Отправляет письма батчами. emails = [(to, subject, html, text), ...]
    ВАЖНО: batch_size=10 и пауза 1 сек между батчами — НЕ МЕНЯТЬ.
    Gmail блокирует при слишком быстрой массовой отправке.
    """
    import time
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    if not smtp_user or not smtp_password or not emails:
        return 0
    sent = 0
    batches = [emails[i:i + batch_size] for i in range(0, len(emails), batch_size)]
    for batch_num, batch in enumerate(batches):
        try:
            with smtplib.SMTP('smtp.gmail.com', 587, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                for to_email, subject, html, text in batch:
                    try:
                        msg = MIMEMultipart('alternative')
                        msg['Subject'] = subject
                        msg['From'] = smtp_user
                        msg['To'] = to_email
                        msg.attach(MIMEText(text, 'plain', 'utf-8'))
                        msg.attach(MIMEText(html, 'html', 'utf-8'))
                        server.sendmail(smtp_user, to_email, msg.as_string())
                        sent += 1
                    except Exception:
                        pass
        except Exception:
            pass
        if batch_num < len(batches) - 1:
            time.sleep(1)
    return sent


def create_notification(cur, S, user_id: str, title: str, body: str, ntype: str = 'warning'):
    cur.execute(
        f"INSERT INTO {S}notifications (user_id, type, title, body) VALUES (%s, %s, %s, %s)",
        (user_id, ntype, title, body)
    )


def build_email_html(subject: str, headline: str, body_text: str, cta_url: str, cta_label: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<body style="background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:16px;padding:32px;">
    <h2 style="color:#fff;margin:0 0 8px;">{headline}</h2>
    <p style="color:#9ca3af;margin:0 0 24px;font-size:14px;">{body_text}</p>
    <a href="{cta_url}"
       style="display:block;background:#2563eb;color:#fff;text-align:center;padding:14px 24px;
              border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:16px;">
      {cta_label}
    </a>
    <p style="color:#4b5563;font-size:12px;text-align:center;margin:0;">
      Кабинет-24 · kabinet-24.ru
    </p>
  </div>
</body>
</html>"""


def handler(event: dict, context) -> dict:
    """Проверяет подписки пользователей и отправляет уведомления/сбрасывает тариф."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    S = get_schema()
    conn = get_connection()
    cur = conn.cursor()
    now = datetime.now(timezone.utc)
    site_url = "https://kabinet-24.ru/dashboard"

    results = {
        'notified_4d': 0,
        'notified_2d': 0,
        'notified_1d': 0,
        'notified_expired': 0,
        'downgraded': 0,
        'object_expiring_soon': 0,
        'object_auto_unpublished': 0,
    }

    # Очередь писем — накапливаем, отправляем в конце одним соединением
    email_queue = []

    # ───── 1. Получаем всех активных подписчиков ─────────────────────────────
    cur.execute(f"""
        SELECT id, email, name, subscription_end_at, grace_period_end_at
        FROM {S}users
        WHERE status = 'broker'
          AND subscription_end_at IS NOT NULL
          AND is_superadmin = false
    """)
    users = cur.fetchall()

    for user_id, email, name, sub_end, grace_end in users:
        if not sub_end:
            continue

        if sub_end.tzinfo is None:
            sub_end = sub_end.replace(tzinfo=timezone.utc)
        if grace_end and grace_end.tzinfo is None:
            grace_end = grace_end.replace(tzinfo=timezone.utc)

        days_left = (sub_end - now).days
        end_str = sub_end.strftime('%d.%m.%Y')

        # --- Grace period истёк — сброс на Basic ---
        if grace_end and now > grace_end:
            cur.execute(f"""
                UPDATE {S}users
                SET status = 'basic', plan = 'basic',
                    subscription_end_at = NULL, grace_period_end_at = NULL,
                    updated_at = NOW()
                WHERE id = %s
            """, (str(user_id),))

            try:
                cur.execute(f"""
                    SELECT 1 FROM {S}org_memberships
                    WHERE user_id = %s AND status = 'active' LIMIT 1
                """, (str(user_id),))
                in_org = cur.fetchone() is not None
            except Exception:
                conn.rollback()
                in_org = False

            if not in_org:
                try:
                    cur.execute(f"""
                        WITH ranked AS (
                            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
                            FROM {S}objects
                            WHERE user_id = %s AND published = TRUE AND status = 'Активен'
                        )
                        UPDATE {S}objects o
                        SET expires_at = CASE
                                WHEN r.rn <= 3 THEN NOW() + INTERVAL '30 days'
                                ELSE NOW() + INTERVAL '3 days'
                            END,
                            requires_payment = CASE
                                WHEN r.rn <= 3 THEN FALSE
                                ELSE TRUE
                            END,
                            auto_unpublished = FALSE,
                            expiry_notified_at = NULL
                        FROM ranked r
                        WHERE o.id = r.id
                    """, (str(user_id),))
                except Exception:
                    conn.rollback()

            cur.execute(f"""
                SELECT COUNT(*) FROM {S}orders
                WHERE user_id = %s AND status = 'paid'
            """, (str(user_id),))
            paid_count = cur.fetchone()[0]
            is_welcome = (paid_count == 0)

            create_notification(cur, S, str(user_id),
                'Доступ к тарифу «Клуб» завершён',
                'Период действия тарифа «Клуб» завершён. Аккаунт переведён на тариф Базовый. Спасибо, что были с нами!',
                'warning')
            email_queue.append((email,
                'Доступ к тарифу «Клуб» завершён — Кабинет-24',
                build_email_html(
                    'Доступ завершён',
                    'Доступ к тарифу «Клуб» завершён',
                    'Период действия тарифа «Клуб» завершён. Ваш аккаунт переведён на тариф Базовый. Спасибо, что были с нами в Кабинете-24!',
                    site_url, 'Перейти в личный кабинет'
                ),
                f'Доступ к тарифу Клуб завершён. Аккаунт переведён на Базовый. {site_url}'
            ))
            results['downgraded'] += 1
            continue

        # --- В день окончания ---
        if days_left == 0 and now <= (grace_end or now):
            cur.execute(f"""
                SELECT COUNT(*) FROM {S}orders
                WHERE user_id = %s AND status = 'paid'
            """, (str(user_id),))
            is_welcome = (cur.fetchone()[0] == 0)

            create_notification(cur, S, str(user_id),
                'Доступ к тарифу «Клуб» истекает сегодня',
                f'Сегодня {end_str} — последний день действия тарифа «Клуб». После окончания аккаунт будет переведён на тариф Базовый.',
                'warning')
            email_queue.append((email,
                'Доступ к тарифу «Клуб» истекает сегодня — Кабинет-24',
                build_email_html(
                    'Доступ истекает сегодня',
                    'Доступ к тарифу «Клуб» истекает сегодня',
                    f'Сегодня {end_str} — последний день действия тарифа «Клуб». После окончания ваш аккаунт будет автоматически переведён на тариф Базовый.',
                    site_url, 'Перейти в личный кабинет'
                ),
                f'Доступ к тарифу Клуб истекает сегодня {end_str}. {site_url}'
            ))
            results['notified_expired'] += 1

        # --- Подписка уже истекла (grace period идёт) ---
        elif days_left < 0 and now <= (grace_end or now):
            grace_days = (grace_end - now).days if grace_end else 0
            create_notification(cur, S, str(user_id),
                'Доступ к тарифу «Клуб» истёк',
                f'Период действия тарифа «Клуб» завершился {end_str}. Через {grace_days} дн. аккаунт будет переведён на тариф Базовый.',
                'warning')
            email_queue.append((email,
                f'Доступ к тарифу «Клуб» истёк — Кабинет-24',
                build_email_html(
                    'Доступ истёк',
                    'Доступ к тарифу «Клуб» завершён',
                    f'Период действия тарифа «Клуб» завершился {end_str}. Через {grace_days} дн. ваш аккаунт будет автоматически переведён на тариф Базовый.',
                    site_url, 'Перейти в личный кабинет'
                ),
                f'Доступ к тарифу Клуб истёк {end_str}. Аккаунт будет переведён на Базовый через {grace_days} дн. {site_url}'
            ))
            results['notified_expired'] += 1

        elif days_left == 1:
            create_notification(cur, S, str(user_id),
                'Доступ к тарифу «Клуб» истекает завтра',
                f'Завтра {end_str} — последний день действия тарифа «Клуб». После этого аккаунт будет переведён на тариф Базовый.',
                'warning')
            email_queue.append((email,
                'Доступ к тарифу «Клуб» истекает завтра — Кабинет-24',
                build_email_html(
                    'Доступ истекает завтра',
                    'Доступ к тарифу «Клуб» истекает завтра',
                    f'Завтра {end_str} — последний день действия тарифа «Клуб». После окончания ваш аккаунт будет переведён на тариф Базовый.',
                    site_url, 'Перейти в личный кабинет'
                ),
                f'Доступ к тарифу Клуб истекает завтра {end_str}. {site_url}'
            ))
            results['notified_1d'] += 1

        elif days_left == 2:
            create_notification(cur, S, str(user_id),
                'Доступ к тарифу «Клуб» истекает через 2 дня',
                f'Тариф «Клуб» действует до {end_str}. Через 2 дня аккаунт будет переведён на тариф Базовый.',
                'warning')
            email_queue.append((email,
                'Доступ к тарифу «Клуб» истекает через 2 дня — Кабинет-24',
                build_email_html(
                    'Доступ истекает через 2 дня',
                    'Доступ к тарифу «Клуб» истекает через 2 дня',
                    f'Тариф «Клуб» действует до {end_str}. Через 2 дня ваш аккаунт будет автоматически переведён на тариф Базовый.',
                    site_url, 'Перейти в личный кабинет'
                ),
                f'Доступ к тарифу Клуб истекает {end_str} (через 2 дня). {site_url}'
            ))
            results['notified_2d'] += 1

        elif days_left == 3:
            create_notification(cur, S, str(user_id),
                'Доступ к тарифу «Клуб» истекает через 3 дня',
                f'Тариф «Клуб» действует до {end_str}. Осталось 3 дня.',
                'warning')
            email_queue.append((email,
                'Доступ к тарифу «Клуб» истекает через 3 дня — Кабинет-24',
                build_email_html(
                    'Доступ истекает через 3 дня',
                    'Доступ к тарифу «Клуб» истекает через 3 дня',
                    f'Тариф «Клуб» действует до {end_str}. Через 3 дня ваш аккаунт будет автоматически переведён на тариф Базовый.',
                    site_url, 'Перейти в личный кабинет'
                ),
                f'Доступ к тарифу Клуб истекает {end_str} (через 3 дня). {site_url}'
            ))
            results['notified_2d'] += 1

        elif days_left == 4:
            create_notification(cur, S, str(user_id),
                'Доступ к тарифу «Клуб» истекает через 4 дня',
                f'Тариф «Клуб» действует до {end_str}.',
                'info')
            email_queue.append((email,
                'Напоминание: доступ к тарифу «Клуб» — Кабинет-24',
                build_email_html(
                    'Напоминание о тарифе',
                    'Доступ к тарифу «Клуб» истекает через 4 дня',
                    f'Тариф «Клуб» действует до {end_str}. Через 4 дня ваш аккаунт будет переведён на тариф Базовый.',
                    site_url, 'Перейти в личный кабинет'
                ),
                f'Доступ к тарифу Клуб истекает {end_str}. {site_url}'
            ))
            results['notified_4d'] += 1

        elif days_left == 5:
            create_notification(cur, S, str(user_id),
                'Доступ к тарифу «Клуб» истекает через 5 дней',
                f'Тариф «Клуб» действует до {end_str}.',
                'info')
            email_queue.append((email,
                'Напоминание: доступ к тарифу «Клуб» — Кабинет-24',
                build_email_html(
                    'Напоминание о тарифе',
                    'Доступ к тарифу «Клуб» истекает через 5 дней',
                    f'Тариф «Клуб» действует до {end_str}. Через 5 дней ваш аккаунт будет переведён на тариф Базовый.',
                    site_url, 'Перейти в личный кабинет'
                ),
                f'Доступ к тарифу Клуб истекает {end_str} (через 5 дней). {site_url}'
            ))
            results['notified_4d'] += 1

    # ───── 2. Суперадмин: уведомления + автопродление ────────────────────────
    try:
        from datetime import timedelta
        cur.execute(f"""
            SELECT id, email, name, subscription_end_at, grace_period_end_at
            FROM {S}users
            WHERE is_superadmin = true
              AND subscription_end_at IS NOT NULL
        """)
        admins = cur.fetchall()
        for adm_id, adm_email, adm_name, adm_end, adm_grace in admins:
            if not adm_end:
                continue
            if adm_end.tzinfo is None:
                adm_end = adm_end.replace(tzinfo=timezone.utc)
            adm_days_left = (adm_end - now).days
            adm_end_str = adm_end.strftime('%d.%m.%Y')

            if adm_days_left == 5:
                create_notification(cur, S, str(adm_id),
                    '[Система] Подписка истекает через 5 дней',
                    f'Подписка до {adm_end_str}. Автопродление сработает в день окончания.', 'info')
                email_queue.append((adm_email,
                    '[Кабинет-24] Подписка истекает через 5 дней',
                    build_email_html('Подписка через 5 дней', 'Подписка истекает через 5 дней',
                        f'Подписка Клуб действует до {adm_end_str}. В день окончания произойдёт автопродление на 1 месяц.',
                        site_url, 'Открыть дашборд'),
                    f'Подписка до {adm_end_str}. Автопродление в день окончания.'
                ))

            elif adm_days_left == 3:
                create_notification(cur, S, str(adm_id),
                    '[Система] Подписка истекает через 3 дня',
                    f'Подписка до {adm_end_str}. Автопродление сработает в день окончания.', 'warning')
                email_queue.append((adm_email,
                    '[Кабинет-24] Подписка истекает через 3 дня',
                    build_email_html('Подписка через 3 дня', 'Подписка истекает через 3 дня',
                        f'Подписка Клуб действует до {adm_end_str}. В день окончания произойдёт автопродление на 1 месяц.',
                        site_url, 'Открыть дашборд'),
                    f'Подписка до {adm_end_str}. Автопродление в день окончания.'
                ))

            elif adm_days_left == 0:
                new_end   = adm_end + timedelta(days=30)
                new_grace = new_end + timedelta(days=3)
                cur.execute(f"""
                    UPDATE {S}users
                    SET subscription_end_at  = %s,
                        grace_period_end_at  = %s,
                        plan   = 'pro',
                        status = 'broker',
                        updated_at = NOW()
                    WHERE id = %s
                """, (new_end.isoformat(), new_grace.isoformat(), str(adm_id)))
                new_end_str = new_end.strftime('%d.%m.%Y')
                create_notification(cur, S, str(adm_id),
                    '[Система] Подписка автоматически продлена',
                    f'Подписка продлена до {new_end_str}. Система работает корректно.', 'info')
                email_queue.append((adm_email,
                    '[Кабинет-24] Подписка автоматически продлена',
                    build_email_html('Автопродление', 'Подписка автоматически продлена',
                        f'Подписка Клуб продлена до {new_end_str}. Это подтверждает корректную работу системы уведомлений.',
                        site_url, 'Открыть дашборд'),
                    f'Подписка продлена до {new_end_str}. Система работает корректно.'
                ))
                results['downgraded'] -= 1
    except Exception:
        conn.rollback()

    # ───── 3. Объявления: уведомления за 3 дня ───────────────────────────────
    try:
        cur.execute(f"""
            SELECT o.id, o.title, o.user_id, u.email, u.name
            FROM {S}objects o
            JOIN {S}users u ON u.id = o.user_id
            WHERE o.expires_at IS NOT NULL
              AND o.published = TRUE
              AND o.auto_unpublished = FALSE
              AND o.expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
              AND (o.expiry_notified_at IS NULL OR o.expiry_notified_at < NOW() - INTERVAL '7 days')
        """)
        for obj_id, title, owner_id, owner_email, owner_name in cur.fetchall():
            create_notification(cur, S, str(owner_id),
                'Объявление истекает через 3 дня',
                f'«{title or "Без названия"}» — продлите, чтобы оно осталось в каталоге.',
                'warning')
            if owner_email:
                email_queue.append((owner_email,
                    'Объявление истекает через 3 дня — Кабинет-24',
                    build_email_html(
                        'Объявление истекает через 3 дня',
                        'Скоро объявление будет снято',
                        f'Ваше объявление «{title or "Без названия"}» истекает через 3 дня. Продлите его в личном кабинете, чтобы оно осталось активным.',
                        site_url, 'Перейти в кабинет'
                    ),
                    f'Объявление "{title}" истекает через 3 дня. Продлите: {site_url}'
                ))
            cur.execute(
                f"UPDATE {S}objects SET expiry_notified_at = NOW() WHERE id = %s",
                (str(obj_id),),
            )
            results['object_expiring_soon'] += 1
    except Exception:
        conn.rollback()

    # ───── 4. Автоснятие истёкших объявлений ─────────────────────────────────
    try:
        cur.execute(f"""
            UPDATE {S}objects
            SET auto_unpublished = TRUE, published = FALSE
            WHERE expires_at IS NOT NULL
              AND expires_at < NOW()
              AND auto_unpublished = FALSE
              AND status NOT IN ('Продан', 'Сдан')
            RETURNING id, user_id, title
        """)
        for obj_id, owner_id, title in cur.fetchall():
            create_notification(cur, S, str(owner_id),
                'Объявление снято с публикации',
                f'«{title or "Без названия"}» больше не отображается в каталоге. Продлите его, чтобы вернуть в работу.',
                'warning')
            results['object_auto_unpublished'] += 1
    except Exception:
        conn.rollback()

    # ───── 5. Коммитим все изменения в БД ────────────────────────────────────
    conn.commit()
    cur.close()
    conn.close()

    # ───── 6. Отправляем все письма одним SMTP-соединением ───────────────────
    send_emails_bulk(email_queue)

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'ok': True, 'results': results})
    }