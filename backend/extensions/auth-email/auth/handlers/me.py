"""Me handler — get user profile by user_id."""
from utils.db import query_one, get_schema, escape
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Вернуть профиль пользователя по user_id."""
    params = event.get('queryStringParameters') or {}
    user_id = str(params.get('user_id', '')).strip()

    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()
    user = query_one(f"""
        SELECT id, email, name, phone, company, plan, status, avatar_url,
               is_superadmin, listings_used, listings_extra, listings_period_start,
               first_name, last_name, middle_name, city,
               specializations, bio, experience,
               telegram_username, vk_username, max_username, website,
               subscription_end_at
        FROM {S}users WHERE id = {escape(user_id)}
    """)

    if not user:
        return error(404, 'Пользователь не найден', origin)

    (uid, email, name, phone, company, plan, status, avatar_url, is_superadmin,
     listings_used, listings_extra, listings_period_start,
     first_name, last_name, middle_name, city,
     specializations, bio, experience,
     telegram_username, vk_username, max_username, website,
     subscription_end_at) = user

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
            'first_name': first_name or '',
            'last_name': last_name or '',
            'middle_name': middle_name or '',
            'city': city or '',
            'specializations': list(specializations) if specializations else [],
            'bio': bio or '',
            'experience': experience or '',
            'telegram': telegram_username or '',
            'vk': vk_username or '',
            'max': max_username or '',
            'website': website or '',
            'subscription_end_at': subscription_end_at.isoformat() if subscription_end_at else None,
        }
    }, origin)