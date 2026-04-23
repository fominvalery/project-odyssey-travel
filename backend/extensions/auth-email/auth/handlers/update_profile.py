"""Update profile handler — сохраняет поля профиля пользователя."""
import json
from utils.db import query_one, execute, get_schema, escape
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Сохранить данные профиля пользователя (имя, телефон, специализации и т.д.)."""
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return error(400, 'Некорректный JSON', origin)

    user_id = str(body.get('user_id', '')).strip()
    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()

    user = query_one(f"SELECT id FROM {S}users WHERE id = {escape(user_id)}")
    if not user:
        return error(404, 'Пользователь не найден', origin)

    allowed = {
        'name', 'phone', 'company',
        'first_name', 'last_name', 'middle_name', 'city',
        'bio', 'experience', 'telegram_username', 'vk_username', 'max_username', 'website',
        'avatar_url',
    }

    set_parts = []

    for field in allowed:
        val = body.get(field)
        if val is not None:
            set_parts.append(f"{field} = {escape(str(val))}")

    # specializations — массив
    specs = body.get('specializations')
    if specs is not None and isinstance(specs, list):
        specs_escaped = "ARRAY[" + ",".join(escape(s) for s in specs) + "]::text[]" if specs else "ARRAY[]::text[]"
        set_parts.append(f"specializations = {specs_escaped}")

    if not set_parts:
        return error(400, 'Нет данных для обновления', origin)

    set_parts.append("updated_at = NOW()")
    set_sql = ", ".join(set_parts)

    execute(f"UPDATE {S}users SET {set_sql} WHERE id = {escape(user_id)}")

    user = query_one(f"""
        SELECT id, email, name, phone, company, plan, status, avatar_url,
               is_superadmin, listings_used, listings_extra, listings_period_start,
               first_name, last_name, middle_name, city,
               specializations, bio, experience,
               telegram_username, vk_username, max_username, website
        FROM {S}users WHERE id = {escape(user_id)}
    """)

    (uid, email, name, phone, company, plan, status, avatar_url, is_superadmin,
     listings_used, listings_extra, listings_period_start,
     first_name, last_name, middle_name, city,
     specializations, bio, experience,
     telegram_username, vk_username, max_username, website) = user

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
        }
    }, origin)