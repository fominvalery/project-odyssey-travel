import json
import os
import bcrypt
import psycopg2


def handler(event, context) -> dict:
    """Регистрация пользователя с паролем: сохранение в БД."""

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
    password = (body.get('password') or '').strip()

    if not name or not email or not phone or not password:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все обязательные поля'})}

    if len(password) < 6:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'})}

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    schema = os.environ['MAIN_DB_SCHEMA']
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(f"SELECT id FROM {schema}.users WHERE email = '{email}'")
    existing = cur.fetchone()
    if existing:
        cur.close()
        conn.close()
        return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь с таким email уже зарегистрирован'})}

    cur.execute(
        f"INSERT INTO {schema}.users (name, email, phone, company, plan, password_hash) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
        (name, email, phone, company, plan, password_hash)
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'id': str(user_id),
            'name': name,
            'email': email,
            'phone': phone,
            'company': company,
            'plan': plan,
            'status': 'resident',
            'avatar': None,
        })
    }
