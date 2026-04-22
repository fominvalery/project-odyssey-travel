"""
Уведомления пользователя.
GET    /?user_id={uuid}           — получить уведомления (последние 50)
POST   /                          — создать уведомление (системное)
PUT    /                          — пометить прочитанными (id или all)
"""
import os
import json
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema


def row_to_notification(r):
    return {
        "id": str(r[0]),
        "user_id": str(r[1]),
        "type": r[2],
        "title": r[3],
        "body": r[4],
        "read": r[5],
        "created_at": r[6].isoformat() if r[6] else None,
    }


def handler(event: dict, context) -> dict:
    """Управление уведомлениями пользователя."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    conn, schema = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET":
            user_id = (event.get("queryStringParameters") or {}).get("user_id")
            if not user_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}

            cur.execute(
                f"SELECT id, user_id, type, title, body, read, created_at "
                f"FROM {schema}.notifications "
                f"WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
                (user_id,)
            )
            rows = cur.fetchall()
            notifications = [row_to_notification(r) for r in rows]
            unread_count = sum(1 for n in notifications if not n["read"])
            return {
                "statusCode": 200,
                "headers": CORS,
                "body": json.dumps({"notifications": notifications, "unread_count": unread_count}),
            }

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            user_id = body.get("user_id")
            n_type = body.get("type", "info")
            title = body.get("title", "")
            n_body = body.get("body", "")
            if not user_id or not title:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id and title required"})}

            cur.execute(
                f"INSERT INTO {schema}.notifications (user_id, type, title, body) "
                f"VALUES (%s, %s, %s, %s) RETURNING id",
                (user_id, n_type, title, n_body)
            )
            new_id = str(cur.fetchone()[0])
            conn.commit()
            return {
                "statusCode": 201,
                "headers": CORS,
                "body": json.dumps({"id": new_id, "ok": True}),
            }

        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            user_id = body.get("user_id")
            mark_all = body.get("all", False)
            n_id = body.get("id")
            if not user_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}

            if mark_all:
                cur.execute(
                    f"UPDATE {schema}.notifications SET read = TRUE WHERE user_id = %s",
                    (user_id,)
                )
            elif n_id:
                cur.execute(
                    f"UPDATE {schema}.notifications SET read = TRUE WHERE id = %s AND user_id = %s",
                    (n_id, user_id)
                )
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method not allowed"})}

    finally:
        cur.close()
        conn.close()
