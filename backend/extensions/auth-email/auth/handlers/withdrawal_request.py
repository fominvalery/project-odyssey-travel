"""Withdrawal request handler — сохранение реквизитов и уведомление супер-админа."""
import json
import os
from datetime import datetime
from utils.db import query_one, query, execute_returning, get_schema, escape
from utils.http import response, error
from utils.email import send_email, _base_template


def handle(event: dict, origin: str = '*') -> dict:
    """Принять заявку на вывод средств с реквизитами и отправить email."""
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return error(400, 'Некорректный JSON', origin)

    user_id = str(body.get('user_id', '')).strip()
    entity_type = str(body.get('entity_type', '')).strip()  # ip / selfemployed / ooo
    full_name = str(body.get('full_name', '')).strip()
    inn = str(body.get('inn', '')).strip()
    bank_name = str(body.get('bank_name', '')).strip()
    bik = str(body.get('bik', '')).strip()
    account = str(body.get('account', '')).strip()
    amount = str(body.get('amount', '')).strip()
    comment = str(body.get('comment', '')).strip()

    if not user_id:
        return error(400, 'user_id обязателен', origin)
    if not entity_type or not full_name or not inn or not account:
        return error(400, 'Заполните обязательные поля', origin)

    S = get_schema()
    user = query_one(f"""
        SELECT email, name FROM {S}users WHERE id = {escape(user_id)}
    """)
    if not user:
        return error(404, 'Пользователь не найден', origin)

    user_email, user_name = user

    entity_labels = {
        'ip': 'ИП',
        'selfemployed': 'Самозанятый',
        'ooo': 'ООО',
    }
    entity_label = entity_labels.get(entity_type, entity_type)

    now = datetime.now().strftime('%d.%m.%Y %H:%M')

    # Сохраняем заявку в БД
    amount_val = float(amount) if amount else None
    request_id = execute_returning(f"""
        INSERT INTO {S}withdrawal_requests
            (user_id, entity_type, full_name, inn, bank_name, bik, account, amount, comment)
        VALUES
            ({escape(user_id)}, {escape(entity_type)}, {escape(full_name)}, {escape(inn)},
             {escape(bank_name) if bank_name else 'NULL'},
             {escape(bik) if bik else 'NULL'},
             {escape(account)},
             {amount_val if amount_val is not None else 'NULL'},
             {escape(comment) if comment else 'NULL'})
        RETURNING id
    """)

    # HTML письмо супер-админу
    content = f"""
        <p style="margin:0 0 16px;font-size:15px;color:#aaaaaa;">
          Новая заявка на вывод средств от пользователя платформы Кабинет-24.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;">
              <table width="100%" cellpadding="6" cellspacing="0">
                <tr>
                  <td style="color:#666;font-size:13px;width:40%;">Пользователь</td>
                  <td style="color:#fff;font-size:13px;font-weight:600;">{user_name or '—'} ({user_email})</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:13px;">Тип организации</td>
                  <td style="color:#fff;font-size:13px;font-weight:600;">{entity_label}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:13px;">ФИО / Название</td>
                  <td style="color:#fff;font-size:13px;font-weight:600;">{full_name}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:13px;">ИНН</td>
                  <td style="color:#fff;font-size:13px;font-weight:600;">{inn}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:13px;">Банк</td>
                  <td style="color:#fff;font-size:13px;">{bank_name or '—'}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:13px;">БИК</td>
                  <td style="color:#fff;font-size:13px;">{bik or '—'}</td>
                </tr>
                <tr>
                  <td style="color:#666;font-size:13px;">Расчётный счёт</td>
                  <td style="color:#fff;font-size:13px;font-weight:600;">{account}</td>
                </tr>
                {"" if not amount else f'<tr><td style="color:#666;font-size:13px;">Сумма к выводу</td><td style="color:#3b82f6;font-size:15px;font-weight:700;">{amount} ₽</td></tr>'}
                {"" if not comment else f'<tr><td style="color:#666;font-size:13px;">Комментарий</td><td style="color:#aaa;font-size:13px;">{comment}</td></tr>'}
                <tr>
                  <td style="color:#666;font-size:13px;">Дата заявки</td>
                  <td style="color:#555;font-size:13px;">{now}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:0;font-size:13px;color:#666666;">
          Обработайте заявку в личном кабинете или свяжитесь с пользователем напрямую.
        </p>
    """

    html_body = _base_template("Заявка на вывод средств", content)
    text_body = (
        f"Заявка на вывод от {user_name} ({user_email})\n"
        f"Тип: {entity_label}, ФИО: {full_name}, ИНН: {inn}, Счёт: {account}\n"
        f"Сумма: {amount or 'не указана'}"
    )

    # Отправляем супер-админу (на SMTP_USER — это твоя почта)
    admin_email = os.environ.get('SMTP_USER', '')
    sent_admin = send_email(admin_email, f"[Кабинет-24] Заявка на вывод от {user_name or user_email}", html_body, text_body)

    # Подтверждение пользователю
    user_content = f"""
        <p style="margin:0 0 16px;font-size:15px;color:#aaaaaa;line-height:1.6;">
          Ваша заявка на вывод средств принята и будет обработана в течение 1–3 рабочих дней.
        </p>
        <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
          <p style="margin:0 0 8px;font-size:13px;color:#666;">Реквизиты:</p>
          <p style="margin:0;font-size:14px;color:#fff;font-weight:600;">{entity_label} · {full_name}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#aaa;">Счёт: {account}</p>
          {"" if not amount else f'<p style="margin:8px 0 0;font-size:15px;color:#3b82f6;font-weight:700;">Сумма: {amount} ₽</p>'}
        </div>
        <p style="margin:0;font-size:13px;color:#666666;">
          При возникновении вопросов обратитесь в поддержку.
        </p>
    """
    user_html = _base_template("Заявка на вывод принята", user_content)
    send_email(user_email, "Кабинет-24: Заявка на вывод принята", user_html,
               f"Ваша заявка на вывод средств принята. Реквизиты: {entity_label}, {full_name}, счёт {account}.")

    return response(200, {
        'ok': True,
        'id': request_id,
        'sent': sent_admin,
        'message': 'Заявка отправлена. Мы свяжемся с вами в течение 1–3 рабочих дней.'
    }, origin)