"""Email utilities for sending verification codes."""
import os
import secrets
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def is_email_enabled() -> bool:
    """Check if email sending is configured."""
    return bool(os.environ.get('SMTP_USER') and os.environ.get('SMTP_PASSWORD'))


def generate_code() -> str:
    """Generate 6-digit verification code using cryptographically secure random."""
    return str(secrets.randbelow(900000) + 100000)


def send_email(to_email: str, subject: str, html_body: str, text_body: str) -> tuple[bool, str]:
    """Send email via SMTP (Gmail by default).

    Returns (success, error_message). error_message пустая если success=True.
    """
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    smtp_from = os.environ.get('SMTP_FROM', smtp_user)

    if not smtp_user or not smtp_password:
        msg = 'SMTP не настроен (нет SMTP_USER/SMTP_PASSWORD)'
        logger.warning(f'[EMAIL] {msg}')
        return False, msg

    msg_obj = MIMEMultipart('alternative')
    msg_obj['Subject'] = subject
    msg_obj['From'] = smtp_from
    msg_obj['To'] = to_email

    msg_obj.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg_obj.attach(MIMEText(html_body, 'html', 'utf-8'))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, to_email, msg_obj.as_string())
        logger.info(f'[EMAIL] OK -> {to_email} | subject="{subject}" | host={smtp_host}:{smtp_port}')
        return True, ''
    except smtplib.SMTPAuthenticationError as e:
        err = f'SMTP auth error: {e.smtp_code} {e.smtp_error!r}'
        logger.error(f'[EMAIL] FAIL -> {to_email} | {err}')
        return False, err
    except smtplib.SMTPRecipientsRefused as e:
        err = f'Recipient refused: {e.recipients!r}'
        logger.error(f'[EMAIL] FAIL -> {to_email} | {err}')
        return False, err
    except smtplib.SMTPSenderRefused as e:
        err = f'Sender refused: {e.smtp_code} {e.smtp_error!r}'
        logger.error(f'[EMAIL] FAIL -> {to_email} | {err}')
        return False, err
    except smtplib.SMTPDataError as e:
        err = f'SMTP data error (возможно лимит/спам-фильтр): {e.smtp_code} {e.smtp_error!r}'
        logger.error(f'[EMAIL] FAIL -> {to_email} | {err}')
        return False, err
    except smtplib.SMTPException as e:
        err = f'SMTP error: {type(e).__name__}: {e!r}'
        logger.error(f'[EMAIL] FAIL -> {to_email} | {err}')
        return False, err
    except OSError as e:
        err = f'Network/OS error: {type(e).__name__}: {e!r}'
        logger.error(f'[EMAIL] FAIL -> {to_email} | {err}')
        return False, err
    except Exception as e:
        err = f'Unexpected error: {type(e).__name__}: {e!r}'
        logger.exception(f'[EMAIL] FAIL -> {to_email} | {err}')
        return False, err


def _base_template(title: str, content: str) -> str:
    """Базовый HTML-шаблон письма в стиле платформы."""
    return f"""<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Шапка -->
        <tr>
          <td style="background:#111111;border:1px solid #1f1f1f;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Кабинет<span style="color:#3b82f6;">&#8209;24</span>
            </span>
          </td>
        </tr>

        <!-- Контент -->
        <tr>
          <td style="background:#141414;border-left:1px solid #1f1f1f;border-right:1px solid #1f1f1f;padding:40px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ffffff;">{title}</h1>
            {content}
          </td>
        </tr>

        <!-- Подвал -->
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


def send_verification_code(to_email: str, code: str) -> tuple[bool, str]:
    """Send email verification code. Returns (success, error_message)."""
    subject = "Кабинет-24: Код подтверждения email"

    content = """
        <p style="margin:0 0 24px;font-size:15px;color:#aaaaaa;line-height:1.6;">
          Для завершения регистрации введите код подтверждения на сайте:
        </p>
        <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
          <span style="font-size:38px;font-weight:700;letter-spacing:12px;color:#ffffff;font-variant-numeric:tabular-nums;">""" + code + """</span>
        </div>
        <p style="margin:0 0 8px;font-size:13px;color:#666666;">
          Код действителен в течение <strong style="color:#aaaaaa;">24 часов</strong>.
        </p>
        <p style="margin:0;font-size:13px;color:#666666;">
          Если вы не регистрировались на платформе — просто проигнорируйте это письмо.
        </p>
    """

    html_body = _base_template("Подтверждение email", content)
    text_body = f"Кабинет-24: Ваш код подтверждения email — {code}\nКод действителен 24 часа."

    return send_email(to_email, subject, html_body, text_body)


def send_password_reset_code(to_email: str, code: str) -> tuple[bool, str]:
    """Send password reset code. Returns (success, error_message)."""
    subject = "Кабинет-24: Сброс пароля"

    content = """
        <p style="margin:0 0 24px;font-size:15px;color:#aaaaaa;line-height:1.6;">
          Мы получили запрос на сброс пароля для вашего аккаунта.<br>
          Введите код на странице восстановления пароля:
        </p>
        <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
          <span style="font-size:38px;font-weight:700;letter-spacing:12px;color:#ffffff;font-variant-numeric:tabular-nums;">""" + code + """</span>
        </div>
        <p style="margin:0 0 8px;font-size:13px;color:#666666;">
          Код действителен в течение <strong style="color:#aaaaaa;">1 часа</strong>.
        </p>
        <p style="margin:0;font-size:13px;color:#666666;">
          Если вы не запрашивали сброс пароля — ничего делать не нужно, ваш пароль остаётся прежним.
        </p>
    """

    html_body = _base_template("Сброс пароля", content)
    text_body = f"Кабинет-24: Ваш код для сброса пароля — {code}\nКод действителен 1 час."

    return send_email(to_email, subject, html_body, text_body)