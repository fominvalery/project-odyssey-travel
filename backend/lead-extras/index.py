"""
Дополнения карточки клиента: комментарии, задачи-планировщик, файлы-предложения.
Маршруты через query-параметр ?kind=comments|tasks|files
GET    ?kind=...&lead_id=&owner_id=  — список
POST   ?kind=...                      — создать
PUT    ?kind=...                      — обновить (для задач: отметить выполненной)
DELETE ?kind=...&id=&owner_id=        — удалить
Также: GET ?kind=overdue&owner_id=    — список lead_id с просроченными невыполненными задачами (красный значок)
"""
import os
import json
import base64
import uuid
import psycopg2
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema


def resp(status, body):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(body)}


def comment_row(r):
    return {
        "id": str(r[0]),
        "lead_id": str(r[1]),
        "owner_id": str(r[2]),
        "text": r[3] or "",
        "created_at": r[4].isoformat() if r[4] else "",
    }


def task_row(r):
    return {
        "id": str(r[0]),
        "lead_id": str(r[1]),
        "owner_id": str(r[2]),
        "done_text": r[3] or "",
        "todo_text": r[4] or "",
        "due_at": r[5].isoformat() if r[5] else None,
        "completed": bool(r[6]),
        "created_at": r[7].isoformat() if r[7] else "",
    }


def file_row(r):
    return {
        "id": str(r[0]),
        "lead_id": str(r[1]),
        "owner_id": str(r[2]),
        "name": r[3] or "",
        "url": r[4] or "",
        "mime": r[5] or "",
        "size_bytes": int(r[6] or 0),
        "created_at": r[7].isoformat() if r[7] else "",
    }


def upload_to_s3(lead_id: str, name: str, mime: str, data: bytes) -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    safe = "".join(c for c in name if c.isalnum() or c in "._-")
    key = f"leads/{lead_id}/{uuid.uuid4().hex}_{safe or 'file'}"
    s3.put_object(Bucket="files", Key=key, Body=data, ContentType=mime or "application/octet-stream")
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    kind = params.get("kind") or ""
    conn, schema = get_conn()
    cur = conn.cursor()

    try:
        # ---------- OVERDUE: lead_ids с просроченными задачами ----------
        if method == "GET" and kind == "overdue":
            owner_id = params.get("owner_id")
            if not owner_id:
                return resp(400, {"error": "owner_id required"})
            cur.execute(
                f"""SELECT DISTINCT lead_id FROM {schema}.lead_tasks
                    WHERE owner_id = %s AND completed = false
                      AND due_at IS NOT NULL AND due_at <= now()""",
                (owner_id,),
            )
            ids = [str(r[0]) for r in cur.fetchall()]
            return resp(200, {"overdue_lead_ids": ids})

        # ---------- COMMENTS ----------
        if kind == "comments":
            if method == "GET":
                lead_id = params.get("lead_id")
                owner_id = params.get("owner_id")
                if not lead_id or not owner_id:
                    return resp(400, {"error": "lead_id and owner_id required"})
                cur.execute(
                    f"""SELECT id, lead_id, owner_id, text, created_at FROM {schema}.lead_comments
                        WHERE lead_id = %s AND owner_id = %s ORDER BY created_at DESC""",
                    (lead_id, owner_id),
                )
                return resp(200, {"comments": [comment_row(r) for r in cur.fetchall()]})

            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                lead_id = body.get("lead_id")
                owner_id = body.get("owner_id")
                text = (body.get("text") or "").strip()
                if not lead_id or not owner_id or not text:
                    return resp(400, {"error": "lead_id, owner_id, text required"})
                cur.execute(
                    f"""INSERT INTO {schema}.lead_comments (lead_id, owner_id, text)
                        VALUES (%s, %s, %s)
                        RETURNING id, lead_id, owner_id, text, created_at""",
                    (lead_id, owner_id, text),
                )
                row = cur.fetchone()
                conn.commit()
                return resp(200, {"comment": comment_row(row)})

            if method == "DELETE":
                cid = params.get("id")
                owner_id = params.get("owner_id")
                if not cid or not owner_id:
                    return resp(400, {"error": "id and owner_id required"})
                cur.execute(
                    f"UPDATE {schema}.lead_comments SET text = '' WHERE id = %s AND owner_id = %s",
                    (cid, owner_id),
                )
                conn.commit()
                return resp(200, {"ok": True})

        # ---------- TASKS (планировщик) ----------
        if kind == "tasks":
            if method == "GET":
                lead_id = params.get("lead_id")
                owner_id = params.get("owner_id")
                if not lead_id or not owner_id:
                    return resp(400, {"error": "lead_id and owner_id required"})
                cur.execute(
                    f"""SELECT id, lead_id, owner_id, done_text, todo_text, due_at, completed, created_at
                        FROM {schema}.lead_tasks
                        WHERE lead_id = %s AND owner_id = %s ORDER BY created_at DESC""",
                    (lead_id, owner_id),
                )
                return resp(200, {"tasks": [task_row(r) for r in cur.fetchall()]})

            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                lead_id = body.get("lead_id")
                owner_id = body.get("owner_id")
                if not lead_id or not owner_id:
                    return resp(400, {"error": "lead_id and owner_id required"})
                cur.execute(
                    f"""INSERT INTO {schema}.lead_tasks (lead_id, owner_id, done_text, todo_text, due_at)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id, lead_id, owner_id, done_text, todo_text, due_at, completed, created_at""",
                    (
                        lead_id,
                        owner_id,
                        (body.get("done_text") or "").strip(),
                        (body.get("todo_text") or "").strip(),
                        body.get("due_at") or None,
                    ),
                )
                row = cur.fetchone()
                conn.commit()
                return resp(200, {"task": task_row(row)})

            if method == "PUT":
                body = json.loads(event.get("body") or "{}")
                tid = body.get("id")
                owner_id = body.get("owner_id")
                if not tid or not owner_id:
                    return resp(400, {"error": "id and owner_id required"})
                cur.execute(
                    f"""UPDATE {schema}.lead_tasks
                        SET completed = %s
                        WHERE id = %s AND owner_id = %s
                        RETURNING id, lead_id, owner_id, done_text, todo_text, due_at, completed, created_at""",
                    (bool(body.get("completed", True)), tid, owner_id),
                )
                row = cur.fetchone()
                conn.commit()
                if not row:
                    return resp(404, {"error": "not found"})
                return resp(200, {"task": task_row(row)})

        # ---------- FILES (PDF-предложения и пр.) ----------
        if kind == "files":
            if method == "GET":
                lead_id = params.get("lead_id")
                owner_id = params.get("owner_id")
                if not lead_id or not owner_id:
                    return resp(400, {"error": "lead_id and owner_id required"})
                cur.execute(
                    f"""SELECT id, lead_id, owner_id, name, url, mime, size_bytes, created_at
                        FROM {schema}.lead_files
                        WHERE lead_id = %s AND owner_id = %s ORDER BY created_at DESC""",
                    (lead_id, owner_id),
                )
                return resp(200, {"files": [file_row(r) for r in cur.fetchall()]})

            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                lead_id = body.get("lead_id")
                owner_id = body.get("owner_id")
                name = (body.get("name") or "file").strip()
                mime = body.get("mime") or "application/octet-stream"
                data_b64 = body.get("data_base64") or ""
                if not lead_id or not owner_id or not data_b64:
                    return resp(400, {"error": "lead_id, owner_id, data_base64 required"})
                try:
                    data = base64.b64decode(data_b64)
                except Exception:
                    return resp(400, {"error": "invalid base64"})
                url = upload_to_s3(lead_id, name, mime, data)
                cur.execute(
                    f"""INSERT INTO {schema}.lead_files (lead_id, owner_id, name, url, mime, size_bytes)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id, lead_id, owner_id, name, url, mime, size_bytes, created_at""",
                    (lead_id, owner_id, name, url, mime, len(data)),
                )
                row = cur.fetchone()
                conn.commit()
                return resp(200, {"file": file_row(row)})

        return resp(400, {"error": f"unknown kind or method: {kind}/{method}"})
    finally:
        cur.close()
        conn.close()
