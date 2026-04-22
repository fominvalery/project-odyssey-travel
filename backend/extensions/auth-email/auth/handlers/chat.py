"""Chat handler — отправка и получение личных сообщений между участниками Клуба."""
import json
from utils.db import query, query_one, execute, execute_returning, get_schema, escape
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Чат между участниками: получить диалоги, сообщения, отправить, пометить прочитанным."""
    method = event.get('httpMethod', 'GET').upper()
    params = event.get('queryStringParameters') or {}
    action = params.get('chat_action', '')

    if method == 'GET':
        if action == 'dialogs':
            return _get_dialogs(params, origin)
        if action == 'messages':
            return _get_messages(params, origin)
        if action == 'unread_count':
            return _get_unread_count(params, origin)
        return error(400, 'Укажите chat_action: dialogs | messages | unread_count', origin)

    if method == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            return error(400, 'Некорректный JSON', origin)
        if action == 'send':
            return _send_message(body, origin)
        if action == 'read':
            return _mark_read(body, origin)
        return error(400, 'Укажите chat_action: send | read', origin)

    return error(405, 'Method not allowed', origin)


def _get_dialogs(params: dict, origin: str) -> dict:
    """Список диалогов пользователя с последним сообщением."""
    user_id = str(params.get('user_id', '')).strip()
    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()
    rows = query(f"""
        WITH last_msgs AS (
            SELECT
                CASE WHEN sender_id = '{user_id}'::uuid THEN receiver_id ELSE sender_id END AS partner_id,
                MAX(created_at) AS last_at
            FROM {S}messages
            WHERE sender_id = '{user_id}'::uuid OR receiver_id = '{user_id}'::uuid
            GROUP BY partner_id
        ),
        unread AS (
            SELECT sender_id AS partner_id, COUNT(*) AS cnt
            FROM {S}messages
            WHERE receiver_id = '{user_id}'::uuid AND is_read = FALSE
            GROUP BY sender_id
        )
        SELECT
            lm.partner_id,
            u.name, u.first_name, u.last_name, u.avatar_url, u.status,
            m.text, m.created_at, m.sender_id,
            COALESCE(un.cnt, 0) AS unread_cnt
        FROM last_msgs lm
        JOIN {S}users u ON u.id = lm.partner_id
        JOIN {S}messages m ON (
            (m.sender_id = '{user_id}'::uuid AND m.receiver_id = lm.partner_id)
            OR (m.receiver_id = '{user_id}'::uuid AND m.sender_id = lm.partner_id)
        ) AND m.created_at = lm.last_at
        LEFT JOIN unread un ON un.partner_id = lm.partner_id
        ORDER BY lm.last_at DESC
    """)

    dialogs = []
    for r in rows:
        (partner_id, name, first_name, last_name, avatar_url, status,
         text, created_at, sender_id, unread_cnt) = r
        display_name = ' '.join(filter(None, [last_name, first_name])) or name or ''
        dialogs.append({
            'partner_id': str(partner_id),
            'partner_name': display_name,
            'partner_avatar': avatar_url,
            'partner_status': status or 'broker',
            'last_text': text or '',
            'last_at': created_at.isoformat() if created_at else '',
            'is_mine': str(sender_id) == user_id,
            'unread_count': int(unread_cnt),
        })

    return response(200, {'dialogs': dialogs}, origin)


def _get_messages(params: dict, origin: str) -> dict:
    """Сообщения конкретного диалога."""
    user_id = str(params.get('user_id', '')).strip()
    partner_id = str(params.get('partner_id', '')).strip()
    if not user_id or not partner_id:
        return error(400, 'user_id и partner_id обязательны', origin)

    S = get_schema()
    rows = query(f"""
        SELECT id, sender_id, receiver_id, text, is_read, created_at
        FROM {S}messages
        WHERE (sender_id = '{user_id}'::uuid AND receiver_id = '{partner_id}'::uuid)
           OR (sender_id = '{partner_id}'::uuid AND receiver_id = '{user_id}'::uuid)
        ORDER BY created_at ASC
        LIMIT 200
    """)

    msgs = []
    for r in rows:
        mid, sender_id, receiver_id, text, is_read, created_at = r
        msgs.append({
            'id': str(mid),
            'sender_id': str(sender_id),
            'receiver_id': str(receiver_id),
            'text': text,
            'is_read': bool(is_read),
            'created_at': created_at.isoformat() if created_at else '',
        })

    return response(200, {'messages': msgs}, origin)


def _get_unread_count(params: dict, origin: str) -> dict:
    """Общее количество непрочитанных сообщений."""
    user_id = str(params.get('user_id', '')).strip()
    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()
    row = query_one(f"""
        SELECT COUNT(*) FROM {S}messages
        WHERE receiver_id = '{user_id}'::uuid AND is_read = FALSE
    """)
    count = int(row[0]) if row else 0
    return response(200, {'unread_count': count}, origin)


def _send_message(body: dict, origin: str) -> dict:
    """Отправить сообщение."""
    sender_id = str(body.get('sender_id', '')).strip()
    receiver_id = str(body.get('receiver_id', '')).strip()
    text = str(body.get('text', '')).strip()

    if not sender_id or not receiver_id or not text:
        return error(400, 'sender_id, receiver_id и text обязательны', origin)
    if len(text) > 2000:
        return error(400, 'Сообщение слишком длинное (макс. 2000 символов)', origin)

    S = get_schema()
    mid = execute_returning(f"""
        INSERT INTO {S}messages (sender_id, receiver_id, text)
        VALUES ('{sender_id}'::uuid, '{receiver_id}'::uuid, {escape(text)})
        RETURNING id
    """)

    return response(200, {'id': str(mid), 'ok': True}, origin)


def _mark_read(body: dict, origin: str) -> dict:
    """Пометить все сообщения от партнёра как прочитанные."""
    user_id = str(body.get('user_id', '')).strip()
    partner_id = str(body.get('partner_id', '')).strip()
    if not user_id or not partner_id:
        return error(400, 'user_id и partner_id обязательны', origin)

    S = get_schema()
    execute(f"""
        UPDATE {S}messages SET is_read = TRUE
        WHERE receiver_id = '{user_id}'::uuid
          AND sender_id = '{partner_id}'::uuid
          AND is_read = FALSE
    """)
    return response(200, {'ok': True}, origin)
