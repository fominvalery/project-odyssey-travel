"""
Дополнения карточки клиента: комментарии, задачи-планировщик, файлы-предложения, автоподбор объектов.
Маршруты через query-параметр ?kind=comments|tasks|files|matches|overdue
GET    ?kind=...&lead_id=&owner_id=  — список
POST   ?kind=...                      — создать
PUT    ?kind=...                      — обновить
DELETE ?kind=...&id=&owner_id=        — удалить
Также: GET ?kind=overdue&owner_id=    — список lead_id с просроченными задачами
       GET ?kind=matches&lead_id=&owner_id=  — авто-подобранные объекты
       POST ?kind=matches             — добавить объект в предложения / пометить просмотренным
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


def match_row(r):
    """
    r: id, lead_id, owner_id, object_id, added_to_proposals, seen, created_at,
       obj_title, obj_category, obj_type, obj_city, obj_price, obj_area, obj_status, obj_photos
    """
    return {
        "id": str(r[0]),
        "lead_id": str(r[1]),
        "owner_id": str(r[2]),
        "object_id": str(r[3]),
        "added_to_proposals": bool(r[4]),
        "seen": bool(r[5]),
        "created_at": r[6].isoformat() if r[6] else "",
        "object": {
            "id": str(r[3]),
            "title": r[7] or "",
            "category": r[8] or "",
            "type": r[9] or "",
            "city": r[10] or "",
            "price": r[11] or "",
            "area": r[12] or "",
            "status": r[13] or "",
            "photos": list(r[14]) if r[14] else [],
        },
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
        # ---------- OVERDUE ----------
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

        # ---------- MATCHES (автоподбор объектов) ----------
        if kind == "matches":
            if method == "GET":
                lead_id = params.get("lead_id")
                owner_id = params.get("owner_id")
                if not lead_id or not owner_id:
                    return resp(400, {"error": "lead_id and owner_id required"})

                # 1. Получаем параметры лида: из полей предпочтений и/или из связанного объекта
                cur.execute(
                    f"""SELECT l.object_id, o.category, o.type, o.city,
                               l.preferred_category, l.preferred_type, l.preferred_city,
                               l.budget_from, l.budget_to, l.area_from, l.area_to
                        FROM {schema}.leads l
                        LEFT JOIN {schema}.objects o ON o.id = l.object_id
                        WHERE l.id = %s AND l.owner_id = %s""",
                    (lead_id, owner_id),
                )
                lead_row = cur.fetchone()
                if not lead_row:
                    return resp(404, {"error": "lead not found"})

                orig_object_id = str(lead_row[0]) if lead_row[0] else None
                # Предпочтения клиента имеют приоритет над параметрами объекта
                category = lead_row[4] or lead_row[1] or ""
                obj_type = lead_row[5] or lead_row[2] or ""
                city = lead_row[6] or lead_row[3] or ""
                budget_from = lead_row[7]
                budget_to = lead_row[8]
                area_from = float(lead_row[9]) if lead_row[9] is not None else None
                area_to = float(lead_row[10]) if lead_row[10] is not None else None

                # 2. Ищем подходящие объекты: опубликованные, активные, того же владельца
                conditions = ["o.user_id = %s", "o.published = true", "o.status = 'Активен'"]
                args = [owner_id]
                if orig_object_id:
                    conditions.append("o.id != %s")
                    args.append(orig_object_id)
                if category:
                    conditions.append("o.category = %s")
                    args.append(category)
                # Фильтр по бюджету: цена объекта <= budget_to (цена хранится как text, пробуем cast)
                if budget_to is not None:
                    conditions.append(
                        "CASE WHEN o.price ~ '^[0-9]+$' THEN o.price::bigint <= %s ELSE true END"
                    )
                    args.append(int(budget_to))
                if budget_from is not None:
                    conditions.append(
                        "CASE WHEN o.price ~ '^[0-9]+$' THEN o.price::bigint >= %s ELSE true END"
                    )
                    args.append(int(budget_from))
                # Фильтр по площади
                if area_to is not None:
                    conditions.append(
                        "CASE WHEN o.area ~ '^[0-9.]+$' THEN o.area::numeric <= %s ELSE true END"
                    )
                    args.append(area_to)
                if area_from is not None:
                    conditions.append(
                        "CASE WHEN o.area ~ '^[0-9.]+$' THEN o.area::numeric >= %s ELSE true END"
                    )
                    args.append(area_from)

                where_clause = " AND ".join(conditions)
                cur.execute(
                    f"""SELECT o.id, o.title, o.category, o.type, o.city, o.price, o.area, o.status, o.photos,
                               m.id AS match_id, m.added_to_proposals, m.seen, m.created_at AS match_created
                        FROM {schema}.objects o
                        LEFT JOIN {schema}.lead_matches m
                            ON m.object_id = o.id AND m.lead_id = %s
                        WHERE {where_clause}
                        ORDER BY
                            CASE WHEN o.type = %s THEN 0 ELSE 1 END,
                            CASE WHEN o.city = %s THEN 0 ELSE 1 END,
                            o.created_at DESC
                        LIMIT 20""",
                    [lead_id] + args + [obj_type, city],
                )
                rows = cur.fetchall()

                matches = []
                for r in rows:
                    obj_id = str(r[0])
                    match_id = str(r[9]) if r[9] else None
                    # Если совпадения ещё нет в таблице — создаём
                    if not match_id:
                        cur.execute(
                            f"""INSERT INTO {schema}.lead_matches (lead_id, owner_id, object_id)
                                VALUES (%s, %s, %s)
                                ON CONFLICT (lead_id, object_id) DO NOTHING
                                RETURNING id, added_to_proposals, seen, created_at""",
                            (lead_id, owner_id, obj_id),
                        )
                        ins = cur.fetchone()
                        if ins:
                            match_id = str(ins[0])
                            added = bool(ins[1])
                            seen = bool(ins[2])
                            match_created = ins[3].isoformat() if ins[3] else ""
                        else:
                            added, seen, match_created = False, False, ""
                    else:
                        added = bool(r[10])
                        seen = bool(r[11])
                        match_created = r[12].isoformat() if r[12] else ""

                    matches.append({
                        "match_id": match_id,
                        "added_to_proposals": added,
                        "seen": seen,
                        "match_created": match_created,
                        "object": {
                            "id": obj_id,
                            "title": r[1] or "",
                            "category": r[2] or "",
                            "type": r[3] or "",
                            "city": r[4] or "",
                            "price": r[5] or "",
                            "area": r[6] or "",
                            "status": r[7] or "",
                            "photos": list(r[8]) if r[8] else [],
                        },
                    })

                conn.commit()
                return resp(200, {"matches": matches})

            if method == "PUT":
                # Обновить: added_to_proposals или seen
                body = json.loads(event.get("body") or "{}")
                match_id = body.get("match_id")
                owner_id = body.get("owner_id")
                if not match_id or not owner_id:
                    return resp(400, {"error": "match_id and owner_id required"})

                fields = []
                vals = []
                if "added_to_proposals" in body:
                    fields.append("added_to_proposals = %s")
                    vals.append(bool(body["added_to_proposals"]))
                if "seen" in body:
                    fields.append("seen = %s")
                    vals.append(bool(body["seen"]))
                if not fields:
                    return resp(400, {"error": "nothing to update"})

                vals += [match_id, owner_id]
                cur.execute(
                    f"""UPDATE {schema}.lead_matches SET {', '.join(fields)}
                        WHERE id = %s AND owner_id = %s
                        RETURNING id, lead_id, owner_id, object_id, added_to_proposals, seen, created_at""",
                    vals,
                )
                row = cur.fetchone()
                conn.commit()
                if not row:
                    return resp(404, {"error": "not found"})
                return resp(200, {"ok": True, "match": {
                    "id": str(row[0]), "added_to_proposals": bool(row[4]), "seen": bool(row[5])
                }})

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

        # ---------- TASKS ----------
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
                        lead_id, owner_id,
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
                    f"""UPDATE {schema}.lead_tasks SET completed = %s
                        WHERE id = %s AND owner_id = %s
                        RETURNING id, lead_id, owner_id, done_text, todo_text, due_at, completed, created_at""",
                    (bool(body.get("completed", True)), tid, owner_id),
                )
                row = cur.fetchone()
                conn.commit()
                if not row:
                    return resp(404, {"error": "not found"})
                return resp(200, {"task": task_row(row)})

        # ---------- FILES ----------
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