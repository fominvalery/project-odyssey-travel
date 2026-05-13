"""Admin: manually verify user's email (superadmin-only)."""
import json
from utils.db import query_one, execute, get_schema, escape
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Позволяет супер-админу вручную подтвердить email пользователя.

    Используется когда письмо не дошло, а пользователь не может пройти
    через "Забыл пароль" (например, sapm-фильтры).
    """
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

    S = get_schema()

    actor = query_one(f"SELECT is_superadmin FROM {S}users WHERE id = {escape(actor_id)}")
    if not actor:
        return error(404, 'Актор не найден', origin)
    if not bool(actor[0]):
        return error(403, 'Только супер-админ может подтверждать email вручную', origin)

    target = query_one(f"SELECT id, email FROM {S}users WHERE id = {escape(target_id)}")
    if not target:
        return error(404, 'Пользователь не найден', origin)

    execute(f"""
        UPDATE {S}users
        SET email_verified = TRUE, updated_at = NOW()
        WHERE id = {escape(target_id)}
    """)

    # Удаляем неиспользованные коды подтверждения
    execute(f"DELETE FROM {S}email_verification_tokens WHERE user_id = {escape(target_id)}")

    # Начисляем 10₽ рефереру (если есть) — однократно
    try:
        ref_row = query_one(f"""
            SELECT referrer_id FROM {S}referrals WHERE referred_id = {escape(target_id)}
        """)
        if ref_row and ref_row[0]:
            referrer_id = str(ref_row[0])
            execute(f"""
                INSERT INTO {S}referral_bonuses
                    (referrer_id, referred_id, bonus_type, amount, description)
                VALUES ({escape(referrer_id)}, {escape(target_id)}, 'email_verified', 10,
                        'Реферал подтвердил email')
                ON CONFLICT DO NOTHING
            """)
    except Exception:
        pass

    return response(200, {
        'success': True,
        'user_id': str(target[0]),
        'email': target[1],
        'message': 'Email подтверждён вручную'
    }, origin)