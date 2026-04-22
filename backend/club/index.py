"""Club endpoint — список участников Клуба (broker/agency). v2"""
import os
import psycopg2
from typing import Any

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', '')
    return f"{schema}." if schema else ""


def escape(value: Any) -> str:
    if value is None:
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value).replace("'", "''")
    return f"'{s}'"


def handler(event: dict, context) -> dict:
    """Вернуть список участников Клуба и Агентства для раздела Клуб."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    requester_id = str(params.get('user_id', '')).strip()
    city_filter = str(params.get('city', '')).strip()
    spec_filter = str(params.get('specialization', '')).strip()
    exp_filter = str(params.get('experience', '')).strip()

    if not requester_id:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': '{"error":"user_id обязателен"}'}

    S = get_schema()
    conn = get_connection()
    cur = conn.cursor()

    # Проверяем что запрашивающий — участник клуба или суперадмин
    cur.execute(f"SELECT status, is_superadmin FROM {S}users WHERE id = {escape(requester_id)}")
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': '{"error":"Пользователь не найден"}'}

    req_status, is_superadmin = row
    if req_status not in ('broker', 'agency') and not is_superadmin:
        cur.close(); conn.close()
        return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': '{"error":"Только участники Клуба"}'}

    # Базовый запрос
    where_parts = ["status IN ('broker','agency')"]
    if city_filter:
        where_parts.append(f"city ILIKE {escape('%' + city_filter + '%')}")
    if spec_filter:
        where_parts.append(f"{escape(spec_filter)} = ANY(specializations)")
    if exp_filter:
        where_parts.append(f"experience = {escape(exp_filter)}")

    where_sql = " AND ".join(where_parts)

    cur.execute(f"""
        SELECT id, name, first_name, last_name, middle_name,
               company, city, status, avatar_url,
               specializations, bio, experience,
               telegram_username, vk_username, max_username, website
        FROM {S}users
        WHERE {where_sql}
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 200
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    members = []
    for r in rows:
        (uid, name, first_name, last_name, middle_name,
         company, city, status, avatar_url,
         specializations, bio, experience,
         telegram_username, vk_username, max_username, website) = r

        display_name = ' '.join(filter(None, [last_name, first_name, middle_name])) or name or ''

        members.append({
            'id': str(uid),
            'name': display_name,
            'company': company or '',
            'city': city or '',
            'status': status or 'broker',
            'avatar_url': avatar_url,
            'specializations': list(specializations) if specializations else [],
            'bio': bio or '',
            'experience': experience or '',
            'telegram': telegram_username or '',
            'vk': vk_username or '',
            'max': max_username or '',
            'website': website or '',
        })

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': __import__('json').dumps({'members': members}, ensure_ascii=False),
    }