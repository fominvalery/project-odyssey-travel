import json
import os
import bcrypt
import psycopg2


def handler(event, context) -> dict:
    """Вход пользователя: проверка email и пароля."""

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

    email = (body.get('email') or '').strip().lower()
    password = (body.get('password') or '').strip()

    if not email or not password:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Введите email и пароль'})}

    schema = os.environ['MAIN_DB_SCHEMA']
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(
        f"SELECT id, name, email, phone, company, plan, status, avatar_url, password_hash FROM {schema}.users WHERE email = '{email}'"
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}

    user_id, name, db_email, phone, company, plan, status, avatar_url, password_hash = row

    if not password_hash:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}

    if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({
            'id': str(user_id),
            'name': name,
            'email': db_email,
            'phone': phone or '',
            'company': company or '',
            'plan': plan or 'green',
            'status': status or 'resident',
            'avatar': avatar_url,
        })
    }
