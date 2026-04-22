"""List users handler (superadmin-only)."""
from utils.db import query, query_one, get_schema, escape
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Вернуть список пользователей (только для супер-админа)."""
    params = event.get('queryStringParameters') or {}
    actor_id = str(params.get('actor_id', '')).strip()
    search = str(params.get('search', '')).strip().lower()

    if not actor_id:
        return error(400, 'actor_id обязателен', origin)

    S = get_schema()

    actor = query_one(f"SELECT is_superadmin FROM {S}users WHERE id = {escape(actor_id)}")
    if not actor:
        return error(404, 'Пользователь не найден', origin)
    if not bool(actor[0]):
        return error(403, 'Доступ только для супер-админа', origin)

    where = ''
    if search:
        s = escape(f"%{search}%")
        where = f"WHERE LOWER(email) LIKE {s} OR LOWER(name) LIKE {s} OR LOWER(phone) LIKE {s}"

    rows = query(f"""
        SELECT id, email, name, phone, company, plan, status,
               is_superadmin, listings_used, listings_extra, created_at, last_login_at
        FROM {S}users
        {where}
        ORDER BY created_at DESC
        LIMIT 500
    """)

    users = []
    for r in rows:
        uid, email, name, phone, company, plan, status, is_superadmin, \
            listings_used, listings_extra, created_at, last_login_at = r
        users.append({
            'id': str(uid),
            'email': email,
            'name': name or '',
            'phone': phone or '',
            'company': company or '',
            'plan': plan or 'basic',
            'status': status or 'basic',
            'is_superadmin': bool(is_superadmin),
            'listings_used': listings_used or 0,
            'listings_extra': listings_extra or 0,
            'created_at': created_at.isoformat() if created_at else None,
            'last_login_at': last_login_at.isoformat() if last_login_at else None,
        })

    return response(200, {'users': users, 'total': len(users)}, origin)
