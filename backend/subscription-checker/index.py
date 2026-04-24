"""Проверка истечения подписок, сброс на Basic и отправка уведомлений."""
import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone
import psycopg2


NOTIFICATIONS_URL = "https://functions.poehali.dev/59063dd0-5097-4670-8e02-9ef4fc534d1d"

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


def send_email(to_email: str, subject: str, html: str, text: str) -> bool:
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    if not smtp_user or not smtp_password:
        return False
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg.attach(MIMEText(text, 'plain', 'utf-8'))
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    try:
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
        return True
    except Exception:
        return False


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
    }

    # Получаем всех активных подписчиков с датой окончания
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

        # Приводим к UTC если нет tzinfo
        if sub_end.tzinfo is None:
            sub_end = sub_end.replace(tzinfo=timezone.utc)
        if grace_end and grace_end.tzinfo is None:
            grace_end = grace_end.replace(tzinfo=timezone.utc)

        days_left = (sub_end - now).days
        display_name = name or email
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
            create_notification(cur, S, str(user_id),
                'Подписка Клуб деактивирована',
                'Срок действия вашей подписки истёк. Аккаунт переведён на тариф Basic. Продлите подписку, чтобы восстановить доступ.',
                'warning')
            send_email(email,
                'Подписка Клуб деактивирована — Кабинет-24',
                build_email_html(
                    'Подписка деактивирована',
                    'Подписка Клуб деактивирована',
                    f'Срок действия вашей подписки истёк. Аккаунт переведён на тариф Basic. Продлите подписку, чтобы восстановить доступ к Клубу.',
                    site_url,
                    'Продлить подписку'
                ),
                f'Подписка Клуб деактивирована. Аккаунт переведён на Basic. Продлите: {site_url}'
            )
            results['downgraded'] += 1
            continue

        # --- День окончания или подписка уже истекла (grace period идёт) ---
        if days_left <= 0 and now <= (grace_end or now):
            grace_days = (grace_end - now).days if grace_end else 0
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекла',
                f'Срок подписки истёк {end_str}. У вас есть ещё {grace_days} дн. для продления — иначе аккаунт будет переведён на Basic.',
                'warning')
            send_email(email,
                f'Подписка Клуб истекла — осталось {grace_days} дн.',
                build_email_html(
                    'Подписка истекла',
                    'Срок подписки истёк',
                    f'Подписка Клуб истекла {end_str}. У вас осталось {grace_days} дн. льготного периода — после этого аккаунт будет автоматически переведён на тариф Basic и все настройки Клуба станут недоступны.',
                    site_url,
                    'Продлить сейчас'
                ),
                f'Подписка истекла {end_str}. Осталось {grace_days} дн. Продлите: {site_url}'
            )
            results['notified_expired'] += 1

        # --- За 1 день ---
        elif days_left == 1:
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекает завтра',
                f'Завтра {end_str} истекает ваша подписка. Продлите сейчас, чтобы не потерять доступ.',
                'warning')
            send_email(email,
                'Подписка Клуб истекает завтра — Кабинет-24',
                build_email_html(
                    'Подписка истекает завтра',
                    'Подписка истекает завтра',
                    f'Завтра {end_str} истекает ваша подписка Клуб. Продлите её сейчас, чтобы не потерять доступ к сети брокеров, объектам и CRM.',
                    site_url,
                    'Продлить подписку'
                ),
                f'Подписка Клуб истекает завтра {end_str}. Продлите: {site_url}'
            )
            results['notified_1d'] += 1

        # --- За 2 дня ---
        elif days_left == 2:
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекает через 2 дня',
                f'Подписка действует до {end_str}. Не забудьте продлить.',
                'warning')
            send_email(email,
                'Подписка Клуб истекает через 2 дня — Кабинет-24',
                build_email_html(
                    'Подписка истекает через 2 дня',
                    'Подписка истекает через 2 дня',
                    f'Ваша подписка Клуб истекает {end_str} — через 2 дня. Продлите её, чтобы сохранить доступ ко всем функциям платформы.',
                    site_url,
                    'Продлить подписку'
                ),
                f'Подписка Клуб истекает {end_str}. Продлите: {site_url}'
            )
            results['notified_2d'] += 1

        # --- За 4 дня ---
        elif days_left == 4:
            create_notification(cur, S, str(user_id),
                'Подписка Клуб истекает через 4 дня',
                f'Подписка действует до {end_str}. Рекомендуем продлить заранее.',
                'info')
            send_email(email,
                'Напоминание о продлении подписки Клуб — Кабинет-24',
                build_email_html(
                    'Напоминание о подписке',
                    'Подписка истекает через 4 дня',
                    f'Ваша подписка Клуб действует до {end_str}. Рекомендуем продлить заранее, чтобы не прерывать работу с сетью брокеров и CRM.',
                    site_url,
                    'Продлить подписку'
                ),
                f'Подписка Клуб истекает {end_str}. Продлите: {site_url}'
            )
            results['notified_4d'] += 1

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({'ok': True, 'results': results})
    }
