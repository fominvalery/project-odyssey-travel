import json
import os
import psycopg2
import urllib.request
import urllib.error

def handler(event, context) -> dict:
    """Регистрация пользователя: сохранение в БД и отправка письма через Resend."""

    if isinstance(event, str):
        event = json.loads(event)

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    CORS = {'Access-Control-Allow-Origin': '*'}

    raw = event.get('body') or {}
    body = raw
    while isinstance(body, str):
        body = json.loads(body) if body else {}
    if not isinstance(body, dict):
        body = {}
    name = (body.get('name') or '').strip()
    email = (body.get('email') or '').strip().lower()
    phone = (body.get('phone') or '').strip()
    company = (body.get('company') or '').strip()
    plan = (body.get('plan') or 'green').strip()

    if not name or not email or not phone:
        return {'statusCode': 400, 'headers': CORS, 'body': {'error': 'Заполните все обязательные поля'}}

    plan_labels = {
        'green': 'Грин — Бесплатно',
        'pro': 'Про — 9 900 ₽/мес',
        'proplus': 'Про+ — 24 900 ₽/мес',
        'constructor': 'Конструктор — от 4 900 ₽/мес',
    }
    plan_label = plan_labels.get(plan, plan)

    schema = os.environ['MAIN_DB_SCHEMA']
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(f"SELECT id FROM {schema}.users WHERE email = '{email}'")
    existing = cur.fetchone()
    if existing:
        cur.close()
        conn.close()
        return {'statusCode': 409, 'headers': CORS, 'body': {'error': 'Пользователь с таким email уже зарегистрирован'}}

    cur.execute(
        f"INSERT INTO {schema}.users (name, email, phone, company, plan) VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (name, email, phone, company, plan)
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    resend_key = os.environ.get('RESEND_API_KEY', '')
    email_sent = False

    if resend_key:
        html_body = f"""
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; max-width: 560px; margin: 0 auto; border-radius: 16px;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 24px; font-weight: bold;">Кабинет-24</span>
          </div>
          <h1 style="font-size: 22px; margin-bottom: 8px; color: #ffffff;">Добро пожаловать, {name}!</h1>
          <p style="color: #9ca3af; margin-bottom: 24px;">Ваш аккаунт на платформе Кабинет-24 успешно создан.</p>

          <div style="background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #9ca3af; font-size: 13px; margin: 0 0 4px;">Тариф</p>
            <p style="color: #a78bfa; font-size: 15px; font-weight: bold; margin: 0;">{plan_label}</p>
          </div>

          <div style="background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
            <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px;">Ваши данные для входа</p>
            <p style="color: #ffffff; font-size: 14px; margin: 0 0 4px;">Email: <strong>{email}</strong></p>
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Используйте email для входа в платформу</p>
          </div>

          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Если вы не регистрировались на Кабинет-24, просто проигнорируйте это письмо.
          </p>
        </div>
        """

        payload = json.dumps({
            'from': 'Кабинет-24 <onboarding@resend.dev>',
            'to': [email],
            'subject': f'Добро пожаловать в Кабинет-24, {name}!',
            'html': html_body,
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.resend.com/emails',
            data=payload,
            headers={
                'Authorization': f'Bearer {resend_key}',
                'Content-Type': 'application/json',
            },
            method='POST'
        )
        try:
            urllib.request.urlopen(req, timeout=10)
            email_sent = True
        except urllib.error.HTTPError:
            email_sent = False

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': {
            'id': str(user_id),
            'name': name,
            'email': email,
            'phone': phone,
            'company': company,
            'plan': plan,
            'status': 'resident',
            'avatar': None,
            'email_sent': email_sent,
        }
    }