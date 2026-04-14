"""
Супер-админ API: список пользователей, поиск, удаление.
Защищён секретным токеном ADMIN_SECRET.
"""
import os
import json
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    admin_secret = os.environ.get("ADMIN_SECRET", "")
    token = event.get("headers", {}).get("X-Admin-Token", "")
    if not token or token != admin_secret:
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Forbidden"})}

    schema = os.environ["MAIN_DB_SCHEMA"]
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    # DELETE /users/{id}
    if method == "DELETE" and "/users/" in path:
        user_id = path.split("/users/")[-1].strip("/")
        cur.execute(f"DELETE FROM {schema}.users WHERE id = '{user_id}'")
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # GET /users — список всех пользователей
    cur.execute(f"""
        SELECT id, name, email, phone, company, plan, status, avatar_url, created_at
        FROM {schema}.users
        ORDER BY created_at DESC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    users = [
        {
            "id": str(r[0]),
            "name": r[1],
            "email": r[2],
            "phone": r[3],
            "company": r[4] or "",
            "plan": r[5] or "green",
            "status": r[6] or "resident",
            "avatar": r[7] or "",
            "created_at": r[8].isoformat() if r[8] else "",
        }
        for r in rows
    ]
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": users})}
