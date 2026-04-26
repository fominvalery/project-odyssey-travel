"""Club check handler — проверка активной подписки Клуба для пользователя."""
from utils.db import query_one, get_schema, escape
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Проверить, является ли пользователь активным участником Клуба."""
    params = event.get('queryStringParameters') or {}
    user_id = str(params.get('user_id', '')).strip()

    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()

    row = query_one(f"SELECT status, is_superadmin FROM {S}users WHERE id = {escape(user_id)}")
    if not row:
        return error(404, 'Пользователь не найден', origin)

    status, is_superadmin = row

    is_club_member = status in ('broker', 'agency') or bool(is_superadmin)

    return response(200, {'is_club_member': is_club_member}, origin)
