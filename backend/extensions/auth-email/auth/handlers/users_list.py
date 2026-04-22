"""List users handler (superadmin-only)."""
from utils.db import query, query_one, get_schema, escape
from utils.http import response, error


def get_referral_level(count: int) -> dict:
    """Вернуть уровень реферальной программы по количеству рефералов."""
    if count >= 100:
        return {"name": "Адвокат", "level": 5, "color": "rose"}
    elif count >= 30:
        return {"name": "Амбасадор", "level": 4, "color": "amber"}
    elif count >= 10:
        return {"name": "Бизнес", "level": 3, "color": "violet"}
    elif count >= 3:
        return {"name": "Партнёр", "level": 2, "color": "emerald"}
    elif count >= 1:
        return {"name": "Друг", "level": 1, "color": "blue"}
    else:
        return {"name": "—", "level": 0, "color": "gray"}


def handle(event: dict, origin: str = '*') -> dict:
    """Вернуть список пользователей с уровнями рефералов (только для супер-админа)."""
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
        where = f"WHERE LOWER(u.email) LIKE {s} OR LOWER(u.name) LIKE {s} OR LOWER(u.phone) LIKE {s}"

    rows = query(f"""
        SELECT u.id, u.email, u.name, u.phone, u.company, u.plan, u.status,
               u.is_superadmin, u.listings_used, u.listings_extra,
               u.created_at, u.last_login_at, u.referral_level,
               COUNT(r.id) AS referral_count
        FROM {S}users u
        LEFT JOIN {S}referrals r ON r.referrer_id = u.id
        {where}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT 500
    """)

    users = []
    for row in rows:
        uid, email, name, phone, company, plan, status, is_superadmin, \
            listings_used, listings_extra, created_at, last_login_at, \
            referral_level_override, referral_count = row

        ref_count = int(referral_count or 0)
        level = get_referral_level(ref_count)
        if referral_level_override:
            level["name"] = referral_level_override

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
            'referral_count': ref_count,
            'referral_level': level,
        })

    return response(200, {'users': users, 'total': len(users)}, origin)
