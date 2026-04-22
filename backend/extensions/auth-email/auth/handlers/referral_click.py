"""Referral click handler — фиксация перехода по реферальной ссылке."""
import json
from utils.db import execute, get_schema, escape
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Записать факт перехода по реферальной ссылке."""
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return error(400, 'Некорректный JSON', origin)

    ref_code = str(body.get('ref_code', '')).strip()[:8]
    if not ref_code:
        return error(400, 'ref_code обязателен', origin)

    # IP из заголовков
    headers = event.get('headers', {})
    ip = (headers.get('X-Forwarded-For') or headers.get('x-forwarded-for') or
          event.get('requestContext', {}).get('identity', {}).get('sourceIp') or '')
    ip = ip.split(',')[0].strip()[:64]

    user_agent = (headers.get('User-Agent') or headers.get('user-agent') or '')[:500]

    S = get_schema()
    execute(f"""
        INSERT INTO {S}referral_clicks (ref_code, ip, user_agent)
        VALUES ({escape(ref_code)}, {escape(ip) if ip else 'NULL'}, {escape(user_agent) if user_agent else 'NULL'})
    """)

    return response(200, {'ok': True}, origin)
