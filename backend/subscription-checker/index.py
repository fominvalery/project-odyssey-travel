"""Проверка истечения подписок, сброс на Basic и отправка уведомлений."""
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


def send_emails_bulk(emails: list) -> int:
    """Отправляет все письма одним SMTP-соединением. emails = [(to, subject, html, text), ...]"""
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    if not smtp_user or not smtp_password or not emails:
        return 0
    sent = 0
    try:
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=5) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            for to_email, subject, html, text in emails:
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

            if is_welcome:
                create_notification(cur, S, str(user_id),
                    'Пробный период «Клуб» завершён',
                    'Ваши бесплатные 72 часа тарифа «Клуб» завершены. Аккаунт переведён на Basic. Подключите тариф «Клуб», чтобы вернуть полный доступ к сети брокеров и CRM.',
                    'warning')
                email_queue.append((email,
                    'Пробный период Клуб завершён — Кабинет-24',
                    build_email_html(
                        'Пробный период завершён',
                        'Пробный период «Клуб» завершён',
                        'Ваши бесплатные 72 часа тарифа «Клуб» закончились. Аккаунт переведён на тариф Basic. Подключите тариф «Клуб», чтобы вернуть доступ к сети брокеров коммерческой недвижимости, CRM и совместным сделкам.',
                        site_url, 'Подключить тариф Клуб'
                    ),
                    f'Пробный период Клуб завершён. Подключите тариф: {site_url}'
                ))
            else:
                create_notification(cur, S, str(user_id),
                    'Подписка Клуб деактивирована',
                    'Срок действия подписки истёк. 3 свежих объекта останутся активны 30 дней, остальные — 3 дня. Продлите подписку или оплатите пакет объявлений.',
                    'warning')
                email_queue.append((email,
                    'Подписка Клуб деактивирована — Кабинет-24',
                    build_email_html(
                        'Подписка деактивирована',
                        'Подписка Клуб деактивирована',
                        f'Срок действия вашей подписки истёк. Аккаунт переведён на тариф Basic. Продлите подписку, чтобы восстановить доступ к Клубу.',
                        site_url, 'Продлить подписку'
                    ),
                    f'Подписка Клуб деактивирована. Аккаунт переведён на Basic. Продлите: {site_url}'
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

            if is_welcome:
                create_notification(cur, S, str(user_id),
                    'Пробный период «Клуб» заканчивается сегодня',
                    'Ваши бесплатные 72 часа тарифа «Клуб» истекают сегодня. Подключите тариф, чтобы сохранить доступ к сети брокеров, CRM и совместным сделкам.',
                    'warning')
                email_queue.append((email,
                    'Пробный период Клуб заканчивается — Кабинет-24',
                    build_email_html(
                        'Пробный период заканчивается',
                        'Ваши 72 часа тарифа «Клуб» истекают сегодня',
                        f'Пробный период закончится {end_str}. Подключите полноценный тариф «Клуб» и продолжите работу с сетью брокеров коммерческой недвижимости.',
                        site_url, 'Подключить тариф Клуб'
                    ),
                    f'Пробный период Клуб истекает сегодня. Подключите тариф: {site_url}'
                ))
            else:
                create_notification(cur, S, str(user_id),
                    'Подписка Клуб истекает сегодня',
                    f'Сегодня {end_str} — последний день вашей подписки. Продлите прямо сейчас.',
                    'warning')
                email_queue.append((email,
                    'Подписка Клуб истекает сегодня — Кабинет-24',
                    build_email_html(
                        'Подписка истекает сегодня',
                        'Подписка истекает сегодня',
                        f'Сегодня {end_str} — последний день действия вашей подписки Клуб. После окончания аккаунт будет переведён на тариф Basic. Продлите прямо сейчас.',
                        site_url, 'Продлить сейчас'
                    ),
                    f'Подписка Клуб истекает сегодня {end_str}. Продлите: {site_url}'
                ))
            results['notified_expired'] += 1

        # --- Подписка уже истекла (grace period идёт) ---
        elif days_left < 0 and now <= (grace_end or now):
            grace_days = (grace_end - now).days if grace_end else 0
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекла',
                f'Срок подписки истёк {end_str}. У вас есть ещё {grace_days} дн. для продления — иначе аккаунт будет переведён на Basic.',
                'warning')
            email_queue.append((email,
                f'Подписка Клуб истекла — осталось {grace_days} дн.',
                build_email_html(
                    'Подписка истекла',
                    'Срок подписки истёк',
                    f'Подписка Клуб истекла {end_str}. У вас осталось {grace_days} дн. льготного периода — после этого аккаунт будет автоматически переведён на тариф Basic.',
                    site_url, 'Продлить сейчас'
                ),
                f'Подписка истекла {end_str}. Осталось {grace_days} дн. Продлите: {site_url}'
            ))
            results['notified_expired'] += 1

        elif days_left == 1:
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекает завтра',
                f'Завтра {end_str} истекает ваша подписка. Продлите сейчас, чтобы не потерять доступ.',
                'warning')
            email_queue.append((email,
                'Подписка Клуб истекает завтра — Кабинет-24',
                build_email_html(
                    'Подписка истекает завтра',
                    'Подписка истекает завтра',
                    f'Завтра {end_str} истекает ваша подписка Клуб. Продлите её сейчас, чтобы не потерять доступ к сети брокеров, объектам и CRM.',
                    site_url, 'Продлить подписку'
                ),
                f'Подписка Клуб истекает завтра {end_str}. Продлите: {site_url}'
            ))
            results['notified_1d'] += 1

        elif days_left == 2:
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекает через 2 дня',
                f'Подписка действует до {end_str}. Не забудьте продлить.',
                'warning')
            email_queue.append((email,
                'Подписка Клуб истекает через 2 дня — Кабинет-24',
                build_email_html(
                    'Подписка истекает через 2 дня',
                    'Подписка истекает через 2 дня',
                    f'Ваша подписка Клуб истекает {end_str} — через 2 дня. Продлите её, чтобы сохранить доступ ко всем функциям платформы.',
                    site_url, 'Продлить подписку'
                ),
                f'Подписка Клуб истекает {end_str}. Продлите: {site_url}'
            ))
            results['notified_2d'] += 1

        elif days_left == 3:
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекает через 3 дня',
                f'Подписка действует до {end_str}. Осталось 3 дня — продлите сейчас.',
                'warning')
            email_queue.append((email,
                'Подписка Клуб истекает через 3 дня — Кабинет-24',
                build_email_html(
                    'Подписка истекает через 3 дня',
                    'Подписка истекает через 3 дня',
                    f'Ваша подписка Клуб истекает {end_str} — через 3 дня. Продлите её, чтобы сохранить доступ ко всем функциям платформы.',
                    site_url, 'Продлить подписку'
                ),
                f'Подписка Клуб истекает {end_str} (через 3 дня). Продлите: {site_url}'
            ))
            results['notified_2d'] += 1

        elif days_left == 4:
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекает через 4 дня',
                f'Подписка действует до {end_str}. Рекомендуем продлить заранее.',
                'info')
            email_queue.append((email,
                'Напоминание о продлении подписки Клуб — Кабинет-24',
                build_email_html(
                    'Напоминание о подписке',
                    'Подписка истекает через 4 дня',
                    f'Ваша подписка Клуб действует до {end_str}. Рекомендуем продлить заранее, чтобы не прерывать работу с сетью брокеров и CRM.',
                    site_url, 'Продлить подписку'
                ),
                f'Подписка Клуб истекает {end_str}. Продлите: {site_url}'
            ))
            results['notified_4d'] += 1

        elif days_left == 5:
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекает через 5 дней',
                f'Подписка действует до {end_str}. Рекомендуем продлить заранее, чтобы не прерывать работу.',
                'info')
            email_queue.append((email,
                'Напоминание о продлении подписки Клуб — Кабинет-24',
                build_email_html(
                    'Напоминание о подписке',
                    'Подписка истекает через 5 дней',
                    f'Ваша подписка Клуб действует до {end_str}. Рекомендуем продлить заранее, чтобы не прерывать доступ к сети брокеров, CRM и объектам.',
                    site_url, 'Продлить подписку'
                ),
                f'Подписка Клуб истекает {end_str} (через 5 дней). Продлите: {site_url}'
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