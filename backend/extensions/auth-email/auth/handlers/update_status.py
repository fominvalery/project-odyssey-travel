"""Update user status handler (superadmin-only, no payment required)."""
import json
from utils.db import query_one, execute, get_schema, escape
from utils.http import response, error


STATUS_TO_PLAN = {
    'basic': 'basic',
    'broker': 'pro',
    'agency': 'proplus',
}
ALLOWED_STATUSES = {'basic', 'broker', 'agency'}


def handle(event: dict, origin: str = '*') -> dict:
    """Позволяет супер-админу менять свой статус (или любого пользователя) без оплаты."""
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return error(400, 'Некорректный JSON', origin)

    actor_id = str(body.get('actor_id', '')).strip()
    target_id = str(body.get('user_id', '')).strip() or actor_id
    new_status = str(body.get('status', '')).strip().lower()

    if not actor_id:
        return error(400, 'actor_id обязателен', origin)
    if new_status not in ALLOWED_STATUSES:
        return error(400, 'Неверный статус', origin)

    S = get_schema()

    actor = query_one(f"SELECT is_superadmin FROM {S}users WHERE id = {escape(actor_id)}")
    if not actor:
        return error(404, 'Пользователь не найден', origin)
    if not bool(actor[0]):
        return error(403, 'Только супер-админ может менять статус без оплаты', origin)

    new_plan = STATUS_TO_PLAN[new_status]
    execute(f"""
        UPDATE {S}users
        SET status = {escape(new_status)}, plan = {escape(new_plan)}, updated_at = NOW()
        WHERE id = {escape(target_id)}
    """)

    user = query_one(f"""
        SELECT id, email, name, phone, company, plan, status, avatar_url,
               is_superadmin, listings_used, listings_extra, listings_period_start
        FROM {S}users WHERE id = {escape(target_id)}
    """)
    if not user:
        return error(404, 'Пользователь не найден', origin)

    uid, email, name, phone, company, plan, status, avatar_url, is_superadmin, \
        listings_used, listings_extra, listings_period_start = user

    return response(200, {
        'user': {
            'id': str(uid),
            'email': email,
            'name': name or '',
            'phone': phone or '',
            'company': company or '',
            'plan': plan or 'basic',
            'status': status or 'basic',
            'avatar_url': avatar_url,
            'is_superadmin': bool(is_superadmin),
            'listings_used': listings_used or 0,
            'listings_extra': listings_extra or 0,
            'listings_period_start': listings_period_start.isoformat() if listings_period_start else None,
        }
    }, origin)
