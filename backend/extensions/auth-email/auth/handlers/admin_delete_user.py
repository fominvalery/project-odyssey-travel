"""Admin: delete user account (superadmin-only)."""
import json
from utils.db import query_one, execute, get_schema, escape
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Позволяет супер-админу удалить аккаунт пользователя и все связанные данные."""
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return error(400, 'Некорректный JSON', origin)

    actor_id = str((event.get('headers') or {}).get('X-User-Id', '')).strip()
    target_id = str(body.get('user_id', '')).strip()

    if not actor_id:
        return error(403, 'Доступ запрещён', origin)
    if not target_id:
        return error(400, 'user_id обязателен', origin)
    if actor_id == target_id:
        return error(400, 'Нельзя удалить собственный аккаунт', origin)

    S = get_schema()

    actor = query_one(f"SELECT is_superadmin FROM {S}users WHERE id = {escape(actor_id)}")
    if not actor:
        return error(404, 'Актор не найден', origin)
    if not bool(actor[0]):
        return error(403, 'Только супер-админ может удалять аккаунты', origin)

    target = query_one(f"SELECT id, email, name, is_superadmin FROM {S}users WHERE id = {escape(target_id)}")
    if not target:
        return error(404, 'Пользователь не найден', origin)

    if bool(target[3]):
        return error(400, 'Нельзя удалить аккаунт супер-админа', origin)

    # Удаляем связанные данные
    execute(f"DELETE FROM {S}refresh_tokens WHERE user_id = {escape(target_id)}")
    execute(f"DELETE FROM {S}email_verification_tokens WHERE user_id = {escape(target_id)}")
    execute(f"DELETE FROM {S}password_reset_tokens WHERE user_id = {escape(target_id)}")
    execute(f"DELETE FROM {S}referral_bonuses WHERE referrer_id = {escape(target_id)} OR referred_id = {escape(target_id)}")
    execute(f"DELETE FROM {S}referral_clicks WHERE referrer_id = {escape(target_id)}")
    execute(f"DELETE FROM {S}referrals WHERE referrer_id = {escape(target_id)} OR referred_id = {escape(target_id)}")
    execute(f"DELETE FROM {S}notifications WHERE user_id = {escape(target_id)}")
    execute(f"DELETE FROM {S}withdrawal_requests WHERE user_id = {escape(target_id)}")

    # Удаляем пользователя
    execute(f"DELETE FROM {S}users WHERE id = {escape(target_id)}")

    return response(200, {
        'success': True,
        'deleted_user_id': str(target[0]),
        'deleted_email': target[1],
        'message': f'Аккаунт {target[2] or target[1]} удалён'
    }, origin)
