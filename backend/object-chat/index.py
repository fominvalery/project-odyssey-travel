"""
Чат объекта недвижимости (двусторонний).

GET  ?object_id=&session_id=                — получить сообщения чата (для клиента, по session_id)
GET  ?owner_id=&object_id=&session_id=      — получить сообщения конкретной сессии (для владельца)
GET  ?owner_id=&dialogs=1                   — список диалогов владельца (все обращения по его объектам)
GET  ?owner_id=&unread_count=1              — счётчик непрочитанных у владельца

POST                                        — отправить сообщение:
   - client: создаёт лид (если первое), уведомление и email владельцу
   - owner:  ответ владельца клиенту

PUT  {owner_id, object_id, session_id}      — пометить переписку прочитанной
"""
import json
import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}

SCHEMA = "t_p32045231_project_odyssey_trav"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _send_email(to_email: str, subject: str, html: str, text: str) -> bool:
    """Отправка email через SMTP. Не падает при ошибке."""
    try:
        host = os.environ.get("SMTP_HOST", "")
        port = int(os.environ.get("SMTP_PORT", "465"))
        user = os.environ.get("SMTP_USER", "")
        password = os.environ.get("SMTP_PASSWORD", "")
        from_addr = os.environ.get("SMTP_FROM", user)
        if not host or not user or not password or not to_email:
            return False
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = to_email
        msg.attach(MIMEText(text, "plain", "utf-8"))
        msg.attach(MIMEText(html, "html", "utf-8"))
        with smtplib.SMTP_SSL(host, port, timeout=10) as s:
            s.login(user, password)
            s.sendmail(from_addr, [to_email], msg.as_string())
        return True
    except Exception:
        return False


def handler(event: dict, context) -> dict:
    """Чат объекта: GET сообщений/диалогов, POST сообщение, PUT отметка прочитанного."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        return handle_get(event)
    if method == "POST":
        return handle_post(event)
    if method == "PUT":
        return handle_put(event)

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}


def handle_get(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    owner_id = (params.get("owner_id") or "").strip()
    object_id = (params.get("object_id") or "").strip()
    session_id = (params.get("session_id") or "").strip()
    dialogs_mode = params.get("dialogs") == "1"
    unread_mode = params.get("unread_count") == "1"

    conn = get_conn()
    cur = conn.cursor()

    try:
        # 1) Счётчик непрочитанных у владельца
        if owner_id and unread_mode:
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.object_chat_messages "
                f"WHERE owner_id = %s AND sender = 'client' AND is_read = FALSE",
                (owner_id,)
            )
            cnt = cur.fetchone()[0]
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"unread_count": int(cnt)})}

        # 2) Список диалогов владельца (по всем его объектам)
        if owner_id and dialogs_mode:
            cur.execute(
                f"""
                WITH last_msgs AS (
                    SELECT object_id, session_id, MAX(created_at) AS last_at
                    FROM {SCHEMA}.object_chat_messages
                    WHERE owner_id = %s
                    GROUP BY object_id, session_id
                ),
                unread AS (
                    SELECT object_id, session_id, COUNT(*) AS cnt
                    FROM {SCHEMA}.object_chat_messages
                    WHERE owner_id = %s AND sender = 'client' AND is_read = FALSE
                    GROUP BY object_id, session_id
                ),
                names AS (
                    SELECT DISTINCT ON (object_id, session_id) object_id, session_id, name, phone
                    FROM {SCHEMA}.object_chat_messages
                    WHERE owner_id = %s AND sender = 'client'
                          AND name IS NOT NULL AND name != ''
                    ORDER BY object_id, session_id, created_at ASC
                )
                SELECT lm.object_id, lm.session_id, lm.last_at,
                       m.text, m.sender,
                       COALESCE(n.name, 'Гость') AS client_name,
                       COALESCE(n.phone, '') AS client_phone,
                       COALESCE(u.cnt, 0) AS unread_cnt,
                       COALESCE(o.title, 'Объект') AS object_title,
                       o.photos
                FROM last_msgs lm
                JOIN {SCHEMA}.object_chat_messages m
                    ON m.object_id = lm.object_id AND m.session_id = lm.session_id AND m.created_at = lm.last_at
                LEFT JOIN names n ON n.object_id = lm.object_id AND n.session_id = lm.session_id
                LEFT JOIN unread u ON u.object_id = lm.object_id AND u.session_id = lm.session_id
                LEFT JOIN {SCHEMA}.objects o ON o.id::text = lm.object_id
                ORDER BY lm.last_at DESC
                """,
                (owner_id, owner_id, owner_id)
            )
            rows = cur.fetchall()
            dialogs = []
            for r in rows:
                obj_id, sess_id, last_at, last_text, last_sender, c_name, c_phone, unread_cnt, obj_title, photos = r
                first_photo = (photos[0] if photos else None) if isinstance(photos, list) else None
                dialogs.append({
                    "object_id": obj_id,
                    "session_id": sess_id,
                    "client_name": c_name,
                    "client_phone": c_phone,
                    "object_title": obj_title,
                    "object_photo": first_photo,
                    "last_text": last_text or "",
                    "last_sender": last_sender or "client",
                    "last_at": last_at.isoformat() if last_at else "",
                    "unread_count": int(unread_cnt),
                })
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"dialogs": dialogs})}

        # 3) Сообщения конкретного чата (для клиента по session_id или для владельца)
        if not object_id or not session_id:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "object_id and session_id required"})}

        cur.execute(
            f"SELECT id, sender, name, text, created_at FROM {SCHEMA}.object_chat_messages "
            f"WHERE object_id = %s AND session_id = %s ORDER BY created_at ASC",
            (object_id, session_id)
        )
        rows = cur.fetchall()

        messages = [
            {"id": str(r[0]), "sender": r[1], "name": r[2], "text": r[3],
             "created_at": r[4].isoformat()}
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"messages": messages})}
    finally:
        cur.close()
        conn.close()


def handle_post(event: dict) -> dict:
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Invalid JSON"})}

    object_id = (body.get("object_id") or "").strip()
    session_id = (body.get("session_id") or "").strip()
    text = (body.get("text") or "").strip()
    sender = (body.get("sender") or "client").strip()
    name = (body.get("name") or "").strip()
    phone = (body.get("phone") or "").strip()
    owner_id = (body.get("owner_id") or "").strip()
    object_title = (body.get("object_title") or "").strip()

    if not object_id or not session_id or not text:
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "object_id, session_id, text required"})}

    conn = get_conn()
    cur = conn.cursor()

    try:
        # Подтягиваем owner_id из objects если не передан
        if not owner_id:
            cur.execute(f"SELECT user_id FROM {SCHEMA}.objects WHERE id::text = %s", (object_id,))
            r = cur.fetchone()
            if r and r[0]:
                owner_id = str(r[0])

        # Проверяем — первое ли это сообщение в сессии
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.object_chat_messages "
            f"WHERE object_id = %s AND session_id = %s",
            (object_id, session_id)
        )
        is_first = cur.fetchone()[0] == 0

        # Ответ владельца — помечается прочитанным сразу с его стороны
        is_owner_reply = sender == "owner"
        # is_read=TRUE для ответов владельца (он же их и отправил)
        is_read_value = True if is_owner_reply else False

        cur.execute(
            f"INSERT INTO {SCHEMA}.object_chat_messages "
            f"(object_id, session_id, sender, name, phone, text, owner_id, is_read) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at",
            (object_id, session_id, sender, name or None, phone or None, text,
             owner_id or None, is_read_value)
        )
        msg_id, created_at = cur.fetchone()

        # При первом сообщении клиента — создаём лид и уведомляем владельца
        lead_id = None
        if is_first and sender == "client" and owner_id:
            cur.execute(
                f"INSERT INTO {SCHEMA}.leads "
                f"(owner_id, object_id, object_title, name, phone, email, message, source, stage) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (
                    owner_id, object_id, object_title or "Объект",
                    name or "Клиент из чата", phone or "", "",
                    text, "Чат объекта", "Лид",
                )
            )
            lead_id = str(cur.fetchone()[0])

        # Уведомление владельцу — на каждое сообщение от клиента
        if sender == "client" and owner_id:
            short_text = text[:120] + ("…" if len(text) > 120 else "")
            obj_title_safe = object_title or "вашему объекту"
            cur.execute(
                f"INSERT INTO {SCHEMA}.notifications (user_id, type, title, body) "
                f"VALUES (%s, 'object_chat', %s, %s)",
                (
                    owner_id,
                    f"Новое сообщение по «{obj_title_safe[:80]}»",
                    f"{name or 'Гость'}: {short_text}",
                )
            )

            # Email владельцу
            cur.execute(f"SELECT email, name FROM {SCHEMA}.users WHERE id = %s", (owner_id,))
            urow = cur.fetchone()
            if urow and urow[0]:
                owner_email, owner_name = urow
                site_url = os.environ.get("SITE_URL", "https://kabinet-24.ru")
                contact_block = ""
                if name or phone:
                    contact_block = f"<p style='margin:0 0 8px;color:#aaa;'>Контакт: <b style='color:#fff'>{name or 'Гость'}</b>{' · ' + phone if phone else ''}</p>"
                html = f"""
                <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:24px;">
                  <h2 style="margin:0 0 16px;color:#3b82f6;">Новое сообщение по объекту</h2>
                  <p style="margin:0 0 8px;color:#aaa;">Объект: <b style="color:#fff">{obj_title_safe}</b></p>
                  {contact_block}
                  <div style="background:#1a1a1a;border-left:3px solid #3b82f6;padding:14px 18px;margin:16px 0;border-radius:8px;">
                    <p style="margin:0;color:#fff;line-height:1.5;">{text}</p>
                  </div>
                  <p style="margin:16px 0 0;">
                    <a href="{site_url}/dashboard?tab=messages" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Ответить в кабинете</a>
                  </p>
                </div>
                """
                text_body = (
                    f"Новое сообщение по объекту «{obj_title_safe}»\n"
                    f"От: {name or 'Гость'} {phone}\n\n"
                    f"{text}\n\n"
                    f"Ответить: {site_url}/dashboard?tab=messages"
                )
                _send_email(owner_email,
                            f"[Кабинет-24] Сообщение по объекту «{obj_title_safe[:60]}»",
                            html, text_body)

        conn.commit()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "ok": True,
                "id": str(msg_id),
                "created_at": created_at.isoformat(),
                "lead_created": bool(lead_id),
                "lead_id": lead_id,
            }),
        }
    except Exception as e:
        conn.rollback()
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": f"Internal error: {str(e)[:200]}"})}
    finally:
        cur.close()
        conn.close()


def handle_put(event: dict) -> dict:
    """Пометить переписку прочитанной (со стороны владельца)."""
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Invalid JSON"})}

    owner_id = (body.get("owner_id") or "").strip()
    object_id = (body.get("object_id") or "").strip()
    session_id = (body.get("session_id") or "").strip()

    if not owner_id or not object_id or not session_id:
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "owner_id, object_id, session_id required"})}

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.object_chat_messages SET is_read = TRUE "
            f"WHERE owner_id = %s AND object_id = %s AND session_id = %s "
            f"AND sender = 'client' AND is_read = FALSE",
            (owner_id, object_id, session_id)
        )
        conn.commit()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}
    except Exception as e:
        conn.rollback()
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": f"Internal error: {str(e)[:200]}"})}
    finally:
        cur.close()
        conn.close()
