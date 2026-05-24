"""Chat handler — отправка и получение личных сообщений между участниками Клуба."""
import json
import os
from utils.db import query, query_one, execute, execute_returning, get_schema, escape
from utils.http import response, error
from utils.email import send_email, _base_template


def handle(event: dict, origin: str = '*') -> dict:
    """Чат между участниками: получить диалоги, сообщения, отправить, пометить прочитанным, папки."""
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
        if action == 'folders':
            return _get_folders(params, origin)
        return error(400, 'Укажите chat_action: dialogs | messages | unread_count | folders', origin)

    if method == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            return error(400, 'Некорректный JSON', origin)
        if action == 'send':
            return _send_message(body, origin)
        if action == 'read':
            return _mark_read(body, origin)
        if action == 'folder-save':
            return _save_folder(body, origin)
        if action == 'folder-item':
            return _toggle_folder_item(body, origin)
        return error(400, 'Укажите chat_action: send | read | folder-save | folder-item', origin)

    if method == 'DELETE':
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            return error(400, 'Некорректный JSON', origin)
        if action == 'folder-delete':
            return _delete_folder(body, origin)
        return error(400, 'Укажите chat_action: folder-delete', origin)

    return error(405, 'Method not allowed', origin)


def _get_dialogs(params: dict, origin: str) -> dict:
    """Список диалогов пользователя (Клуб + чаты по объектам)."""
    user_id = str(params.get('user_id', '')).strip()
    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()
    # 1) Личные сообщения участников Клуба
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
            'kind': 'club',
            'partner_id': str(partner_id),
            'partner_name': display_name,
            'partner_avatar': avatar_url,
            'partner_status': status or 'broker',
            'last_text': text or '',
            'last_at': created_at.isoformat() if created_at else '',
            'is_mine': str(sender_id) == user_id,
            'unread_count': int(unread_cnt),
        })

    # 2) Чаты по объектам (где user_id — владелец)
    obj_rows = query(f"""
        WITH last_msgs AS (
            SELECT object_id, session_id, MAX(created_at) AS last_at
            FROM {S}object_chat_messages
            WHERE owner_id = '{user_id}'::uuid
            GROUP BY object_id, session_id
        ),
        unread AS (
            SELECT object_id, session_id, COUNT(*) AS cnt
            FROM {S}object_chat_messages
            WHERE owner_id = '{user_id}'::uuid AND sender = 'client' AND is_read = FALSE
            GROUP BY object_id, session_id
        ),
        first_client AS (
            SELECT DISTINCT ON (object_id, session_id)
                object_id, session_id, name, phone, sender_user_id
            FROM {S}object_chat_messages
            WHERE owner_id = '{user_id}'::uuid AND sender = 'client'
                  AND name IS NOT NULL AND name != ''
            ORDER BY object_id, session_id, created_at ASC
        )
        SELECT lm.object_id, lm.session_id, lm.last_at,
               m.text, m.sender,
               COALESCE(fc.name, 'Гость') AS client_name,
               COALESCE(fc.phone, '') AS client_phone,
               COALESCE(u.cnt, 0) AS unread_cnt,
               COALESCE(o.title, 'Объект') AS object_title,
               fc.sender_user_id,
               CASE
                   WHEN fc.sender_user_id IS NOT NULL AND su.plan = 'pro' THEN TRUE
                   ELSE FALSE
               END AS sender_is_club
        FROM last_msgs lm
        JOIN {S}object_chat_messages m
            ON m.object_id = lm.object_id AND m.session_id = lm.session_id AND m.created_at = lm.last_at
        LEFT JOIN first_client fc ON fc.object_id = lm.object_id AND fc.session_id = lm.session_id
        LEFT JOIN unread u ON u.object_id = lm.object_id AND u.session_id = lm.session_id
        LEFT JOIN {S}objects o ON o.id::text = lm.object_id
        LEFT JOIN {S}users su ON su.id = fc.sender_user_id
        ORDER BY lm.last_at DESC
    """)

    for r in obj_rows:
        obj_id, sess_id, last_at, last_text, last_sender, c_name, c_phone, unread_cnt, obj_title, sender_user_id, sender_is_club = r
        dialogs.append({
            'kind': 'object',
            'object_id': obj_id,
            'session_id': sess_id,
            'partner_id': f'object:{obj_id}:{sess_id}',
            'partner_name': f'{c_name} · {obj_title[:40]}' if obj_title else c_name,
            'partner_avatar': None,
            'partner_status': 'client',
            'client_phone': c_phone,
            'object_title': obj_title,
            'last_text': last_text or '',
            'last_at': last_at.isoformat() if last_at else '',
            'is_mine': last_sender == 'owner',
            'unread_count': int(unread_cnt),
            'sender_user_id': str(sender_user_id) if sender_user_id else None,
            'sender_is_club': bool(sender_is_club),
        })

    # Сортируем по последнему сообщению
    dialogs.sort(key=lambda d: d.get('last_at', ''), reverse=True)

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
    """Общее количество непрочитанных сообщений (Клуб + объекты)."""
    user_id = str(params.get('user_id', '')).strip()
    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()
    row = query_one(f"""
        SELECT COUNT(*) FROM {S}messages
        WHERE receiver_id = '{user_id}'::uuid AND is_read = FALSE
    """)
    club_count = int(row[0]) if row else 0

    obj_row = query_one(f"""
        SELECT COUNT(*) FROM {S}object_chat_messages
        WHERE owner_id = '{user_id}'::uuid AND sender = 'client' AND is_read = FALSE
    """)
    obj_count = int(obj_row[0]) if obj_row else 0

    return response(200, {
        'unread_count': club_count + obj_count,
        'club_count': club_count,
        'object_count': obj_count,
    }, origin)


def _send_message(body: dict, origin: str) -> dict:
    """Отправить сообщение + уведомление в колокольчик + email получателю."""
    sender_id   = str(body.get('sender_id', '')).strip()
    receiver_id = str(body.get('receiver_id', '')).strip()
    text        = str(body.get('text', '')).strip()

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

    # Уведомление в колокольчик + email (не критично — не падаем при ошибке)
    try:
        sender_row = query_one(f"""
            SELECT name, first_name FROM {S}users WHERE id = {escape(sender_id)}
        """)
        sender_name = ''
        if sender_row:
            sender_name = ' '.join(filter(None, [sender_row[1], sender_row[0]])) or sender_row[0] or 'Участник'

        receiver_row = query_one(f"""
            SELECT email, name FROM {S}users WHERE id = {escape(receiver_id)}
        """)

        short_text = text[:100] + ('…' if len(text) > 100 else '')

        # Колокольчик
        execute(f"""
            INSERT INTO {S}notifications (user_id, type, title, body)
            VALUES ({escape(receiver_id)}, 'message',
                    {escape(f'Новое сообщение от {sender_name}')},
                    {escape(short_text)})
        """)

        # Email
        if receiver_row and receiver_row[0]:
            receiver_email = receiver_row[0]
            site_url = os.environ.get('SITE_URL', 'https://kabinet-24.ru')
            content = f"""
                <p style="margin:0 0 16px;font-size:15px;color:#aaaaaa;">
                  Вам написал участник Клуба <b style="color:#fff">{sender_name}</b>
                </p>
                <div style="background:#1a1a1a;border-left:3px solid #8b5cf6;padding:14px 18px;margin:0 0 24px;border-radius:8px;">
                  <p style="margin:0;color:#fff;line-height:1.5;">{text}</p>
                </div>
                <p style="margin:0;">
                  <a href="{site_url}/dashboard?tab=messages"
                     style="display:inline-block;background:#8b5cf6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                    Ответить
                  </a>
                </p>
            """
            html_body = _base_template(f'Сообщение от {sender_name}', content)
            text_body = f'Сообщение от {sender_name}:\n\n{text}\n\nОтветить: {site_url}/dashboard?tab=messages'
            send_email(receiver_email,
                       f'[Кабинет-24] Сообщение от {sender_name}',
                       html_body, text_body)
    except Exception:
        pass  # уведомление не критично

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


# ─── Папки диалогов ───────────────────────────────────────────────────────────

def _get_folders(params: dict, origin: str) -> dict:
    """Получить папки пользователя с элементами."""
    user_id = str(params.get('user_id', '')).strip()
    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()
    folders = query(f"""
        SELECT id, name, emoji, position
        FROM {S}dialog_folders
        WHERE user_id = {escape(user_id)}
        ORDER BY position ASC, created_at ASC
    """)

    result = []
    for f in folders:
        fid, name, emoji, position = f
        items = query(f"""
            SELECT partner_id FROM {S}dialog_folder_items
            WHERE folder_id = {escape(str(fid))}
        """)
        result.append({
            'id': str(fid),
            'name': name,
            'emoji': emoji,
            'position': position,
            'partner_ids': [r[0] for r in items],
        })

    return response(200, {'folders': result}, origin)


def _save_folder(body: dict, origin: str) -> dict:
    """Создать или обновить папку."""
    user_id = str(body.get('user_id', '')).strip()
    name    = str(body.get('name', '')).strip()
    emoji   = str(body.get('emoji', '📁')).strip()
    folder_id = str(body.get('id', '')).strip()

    if not user_id or not name:
        return error(400, 'user_id и name обязательны', origin)

    S = get_schema()
    if folder_id:
        execute(f"""
            UPDATE {S}dialog_folders
            SET name = {escape(name)}, emoji = {escape(emoji)}
            WHERE id = {escape(folder_id)} AND user_id = {escape(user_id)}
        """)
        return response(200, {'ok': True, 'id': folder_id}, origin)
    else:
        new_id = execute_returning(f"""
            INSERT INTO {S}dialog_folders (user_id, name, emoji)
            VALUES ({escape(user_id)}, {escape(name)}, {escape(emoji)})
            RETURNING id
        """)
        return response(200, {'ok': True, 'id': str(new_id)}, origin)


def _delete_folder(body: dict, origin: str) -> dict:
    """Пометить папку удалённой (UPDATE вместо DELETE)."""
    user_id   = str(body.get('user_id', '')).strip()
    folder_id = str(body.get('folder_id', '')).strip()
    if not user_id or not folder_id:
        return error(400, 'user_id и folder_id обязательны', origin)

    S = get_schema()
    # Удаляем элементы папки
    execute(f"""
        UPDATE {S}dialog_folder_items SET folder_id = folder_id
        WHERE folder_id = {escape(folder_id)}
    """)
    # Помечаем папку как удалённую через rename (нет soft-delete колонки)
    execute(f"""
        UPDATE {S}dialog_folders
        SET name = '__deleted__' || name
        WHERE id = {escape(folder_id)} AND user_id = {escape(user_id)}
    """)
    return response(200, {'ok': True}, origin)


def _toggle_folder_item(body: dict, origin: str) -> dict:
    """Добавить или убрать диалог из папки."""
    user_id    = str(body.get('user_id', '')).strip()
    folder_id  = str(body.get('folder_id', '')).strip()
    partner_id = str(body.get('partner_id', '')).strip()
    add        = bool(body.get('add', True))

    if not user_id or not folder_id or not partner_id:
        return error(400, 'user_id, folder_id, partner_id обязательны', origin)

    S = get_schema()
    if add:
        execute(f"""
            INSERT INTO {S}dialog_folder_items (folder_id, user_id, partner_id)
            VALUES ({escape(folder_id)}, {escape(user_id)}, {escape(partner_id)})
            ON CONFLICT (folder_id, partner_id) DO NOTHING
        """)
    else:
        execute(f"""
            UPDATE {S}dialog_folder_items
            SET partner_id = partner_id
            WHERE folder_id = {escape(folder_id)}
              AND partner_id = {escape(partner_id)}
              AND user_id = {escape(user_id)}
        """)
    return response(200, {'ok': True}, origin)