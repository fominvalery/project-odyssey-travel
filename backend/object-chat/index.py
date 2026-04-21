"""
Чат объекта недвижимости.
GET  ?object_id=&session_id= — получить сообщения чата
POST — отправить сообщение (при первом сообщении создаётся лид в CRM)
"""
import json
import os
import uuid
import psycopg2


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        return handle_get(event)
    elif method == "POST":
        return handle_post(event)

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}


def handle_get(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    object_id = params.get("object_id", "").strip()
    session_id = params.get("session_id", "").strip()

    if not object_id or not session_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "object_id and session_id required"})}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, sender, name, text, created_at FROM t_p32045231_project_odyssey_trav.object_chat_messages "
        "WHERE object_id = %s AND session_id = %s ORDER BY created_at ASC",
        (object_id, session_id)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    messages = [
        {"id": str(r[0]), "sender": r[1], "name": r[2], "text": r[3], "created_at": r[4].isoformat()}
        for r in rows
    ]
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": messages})}


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
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "object_id, session_id, text required"})}

    conn = get_conn()
    cur = conn.cursor()

    # Проверяем, есть ли уже сообщения в этой сессии
    cur.execute(
        "SELECT COUNT(*) FROM t_p32045231_project_odyssey_trav.object_chat_messages "
        "WHERE object_id = %s AND session_id = %s",
        (object_id, session_id)
    )
    count = cur.fetchone()[0]
    is_first = count == 0

    # Сохраняем сообщение
    cur.execute(
        "INSERT INTO t_p32045231_project_odyssey_trav.object_chat_messages "
        "(object_id, session_id, sender, name, phone, text) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at",
        (object_id, session_id, sender, name or None, phone or None, text)
    )
    msg_id, created_at = cur.fetchone()

    # При первом сообщении клиента — создаём лид в CRM
    lead_id = None
    if is_first and sender == "client" and owner_id:
        cur.execute(
            "INSERT INTO t_p32045231_project_odyssey_trav.leads "
            "(owner_id, object_id, object_title, name, phone, email, message, source, stage) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                owner_id,
                object_id,
                object_title or "Объект",
                name or "Клиент из чата",
                phone or "",
                "",
                text,
                "Чат объекта",
                "Лид",
            )
        )
        lead_id = str(cur.fetchone()[0])

    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "ok": True,
            "id": str(msg_id),
            "created_at": created_at.isoformat(),
            "lead_created": is_first and sender == "client",
            "lead_id": lead_id,
        }),
    }
