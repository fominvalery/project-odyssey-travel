"""
Массовое назначение приветственного тарифа «Клуб» на 72 часа.

POST / — назначить тариф всем пользователям без Клуб/АН (только суперадмин)
GET  /?dry_run=1 — посмотреть сколько пользователей затронет операция
"""
import os
import json
import psycopg2
import smtplib
import logging
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger()
logger.setLevel(logging.INFO)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

NOTIFICATION_TITLE = "Приветственный доступ к тарифу «Клуб» — 72 часа"
NOTIFICATION_BODY = (
    "Здравствуйте!\n\n"
    "Рады видеть вас в Кабинете-24 — платформе, где брокеры коммерческой недвижимости "
    "находят партнёров, объекты и реальные сделки.\n\n"
    "Чтобы вы могли познакомиться с платформой по-настоящему — мы открыли вам "
    "приветственный доступ к тарифу «Клуб» на 72 часа."
)

EMAIL_SUBJECT = "Кабинет-24: Приветственный доступ к тарифу «Клуб» на 72 часа"


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema


def send_welcome_email(to_email: str, name: str, expires_at: datetime) -> bool:
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    if not smtp_user or not smtp_password:
        return False

    expires_str = expires_at.strftime("%d.%m.%Y в %H:%M")
    display_name = name.strip() or "Коллега"

    html_body = f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#111111;border:1px solid #1f1f1f;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Кабинет<span style="color:#3b82f6;">&#8209;24</span>
            </span>
          </td>
        </tr>
        <tr>
          <td style="background:#141414;border-left:1px solid #1f1f1f;border-right:1px solid #1f1f1f;padding:40px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">Приветственный бонус — тариф «Клуб»</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#aaaaaa;line-height:1.6;">
              Здравствуйте, {display_name}!
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#aaaaaa;line-height:1.6;">
              Рады видеть вас в <strong style="color:#ffffff;">Кабинете-24</strong> — платформе, где брокеры
              коммерческой недвижимости находят партнёров, объекты и реальные сделки.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#aaaaaa;line-height:1.6;">
              Чтобы вы могли познакомиться с платформой по-настоящему — мы открыли вам
              приветственный доступ к тарифу <strong style="color:#ffffff;">«Клуб»</strong> на <strong style="color:#ffffff;">72 часа</strong>.
            </p>
            <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin:0 0 24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#666666;">Доступ активен до</p>
              <p style="margin:0;font-size:24px;font-weight:700;color:#3b82f6;">{expires_str}</p>
            </div>
            <p style="margin:0;font-size:13px;color:#666666;line-height:1.6;">
              Войдите на платформу и изучите все возможности тарифа «Клуб».<br>
              После окончания пробного периода вы сможете продлить подписку.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#111111;border:1px solid #1f1f1f;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#555555;">
              Это автоматическое письмо от платформы Кабинет-24.<br>
              Пожалуйста, не отвечайте на него.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    text_body = (
        f"Здравствуйте, {display_name}!\n\n"
        "Рады видеть вас в Кабинете-24 — платформе, где брокеры коммерческой недвижимости "
        "находят партнёров, объекты и реальные сделки.\n\n"
        "Мы открыли вам приветственный доступ к тарифу «Клуб» на 72 часа.\n"
        f"Доступ активен до: {expires_str}\n\n"
        "Войдите на платформу и изучите все возможности."
    )

    try:
        smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        smtp_from = os.environ.get("SMTP_FROM", smtp_user)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = EMAIL_SUBJECT
        msg["From"] = smtp_from
        msg["To"] = to_email
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, to_email, msg.as_string())
        return True
    except Exception as e:
        logger.error(f"[EMAIL] FAIL -> {to_email} | {e}")
        return False


def handler(event: dict, context) -> dict:
    """Массовое назначение приветственного тарифа Клуб на 72 часа (только суперадмин)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    # Проверка секрета суперадмина
    auth_header = event.get("headers", {}).get("X-Authorization", "")
    admin_secret = os.environ.get("ADMIN_SECRET", "")
    if not admin_secret or auth_header != f"Bearer {admin_secret}":
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Forbidden"})}

    body = json.loads(event.get("body") or "{}")
    dry_run = body.get("dry_run", False)  # если True — только покажет кол-во, не меняет

    conn, schema = get_conn()
    cur = conn.cursor()

    expires_at = datetime.utcnow() + timedelta(hours=72)
    expires_iso = expires_at.isoformat()
    grace_at = expires_at + timedelta(days=3)
    grace_iso = grace_at.isoformat()

    # Выбираем пользователей без тарифа Клуб/АН и не суперадминов
    cur.execute(f"""
        SELECT id, email, name
        FROM {schema}.users
        WHERE is_superadmin = FALSE
          AND (plan IS NULL OR plan NOT IN ('club', 'an'))
          AND email_verified = TRUE
    """)
    users = cur.fetchall()

    if dry_run:
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"dry_run": True, "would_affect": len(users)}),
        }

    updated = 0
    notified = 0
    emailed = 0
    errors = []

    for row in users:
        user_id, email, name = str(row[0]), row[1], row[2] or ""
        try:
            # Обновляем тариф и дату окончания
            cur.execute(f"""
                UPDATE {schema}.users
                SET plan = 'club',
                    status = 'broker',
                    subscription_end_at = '{expires_iso}',
                    grace_period_end_at = '{grace_iso}',
                    updated_at = NOW()
                WHERE id = '{user_id}'
            """)
            updated += 1

            # Создаём уведомление в колокольчик
            safe_body = NOTIFICATION_BODY.replace("'", "''")
            safe_title = NOTIFICATION_TITLE.replace("'", "''")
            cur.execute(f"""
                INSERT INTO {schema}.notifications (user_id, type, title, body)
                VALUES ('{user_id}', 'info', '{safe_title}', '{safe_body}')
            """)
            notified += 1

        except Exception as e:
            errors.append(f"{email}: {e}")
            logger.error(f"DB error for {email}: {e}")

    conn.commit()
    cur.close()
    conn.close()

    # Отправляем письма (после commit, чтобы не блокировать транзакцию)
    for row in users:
        user_id, email, name = str(row[0]), row[1], row[2] or ""
        ok = send_welcome_email(email, name, expires_at)
        if ok:
            emailed += 1

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "ok": True,
            "updated": updated,
            "notified": notified,
            "emailed": emailed,
            "expires_at": expires_iso,
            "errors": errors,
        }),
    }