"""API для статей блога и материалов обучения."""
import json
import os
import psycopg2

S = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def escape(v):
    if v is None: return "NULL"
    return "'" + str(v).replace("'", "''") + "'"

def row_to_dict(row):
    return {
        "id": str(row[0]),
        "content_type": row[1],
        "title": row[2],
        "preview": row[3],
        "body": row[4],
        "category": row[5],
        "status": row[6],
        "tags": row[7],
        "photos": list(row[8] or []),
        "videos": list(row[9] or []),
        "created_at": row[10].isoformat() if row[10] else None,
        "updated_at": row[11].isoformat() if row[11] else None,
        "sort_order": row[12] if len(row) > 12 else 0,
    }

def handler(event: dict, context) -> dict:
    """CRUD для статей блога и обучения."""
    method = event.get("httpMethod", "GET").upper()

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    content_type = params.get("type", "blog")

    # GET — список или одна статья
    if method == "GET":
        article_id = params.get("id")
        conn = db()
        cur = conn.cursor()
        if article_id:
            cur.execute(f"""
                SELECT id, content_type, title, preview, body, category, status, tags, photos, videos, created_at, updated_at, sort_order
                FROM {S}.content_articles WHERE id = {escape(article_id)}
            """)
            row = cur.fetchone()
            conn.close()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"article": row_to_dict(row)})}
        else:
            status_filter = params.get("status", "published")
            where = f"WHERE content_type = {escape(content_type)}"
            if status_filter != "all":
                where += f" AND status = {escape(status_filter)}"
            cur.execute(f"""
                SELECT id, content_type, title, preview, body, category, status, tags, photos, videos, created_at, updated_at, sort_order
                FROM {S}.content_articles {where}
                ORDER BY sort_order ASC, created_at ASC LIMIT 100
            """)
            rows = cur.fetchall()
            conn.close()
            return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"articles": [row_to_dict(r) for r in rows]})}

    # Для POST/PUT/DELETE нужен супер-админ
    actor_id = str((event.get("headers") or {}).get("X-User-Id", "")).strip()
    if not actor_id:
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Доступ запрещён"})}

    conn = db()
    cur = conn.cursor()
    cur.execute(f"SELECT is_superadmin FROM {S}.users WHERE id = {escape(actor_id)}")
    row = cur.fetchone()
    if not row or not bool(row[0]):
        conn.close()
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Только администратор"})}

    body = json.loads(event.get("body") or "{}")

    if method == "POST":
        # Перестановка sort_order для FAQ
        if body.get("action") == "reorder":
            article_id = body.get("id")
            direction = body.get("direction")  # "up" | "down"
            cur.execute(f"""
                SELECT id, sort_order FROM {S}.content_articles
                WHERE category = 'faq' AND content_type = 'training'
                ORDER BY sort_order ASC, created_at ASC
            """)
            items = cur.fetchall()
            ids = [str(r[0]) for r in items]
            if article_id not in ids:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Не найдено"})}
            idx = ids.index(article_id)
            if direction == "up" and idx > 0:
                swap_id = ids[idx - 1]
            elif direction == "down" and idx < len(ids) - 1:
                swap_id = ids[idx + 1]
            else:
                conn.close()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}
            # Обмен sort_order
            cur.execute(f"UPDATE {S}.content_articles SET sort_order = {idx} WHERE id = {escape(article_id)}")
            cur.execute(f"UPDATE {S}.content_articles SET sort_order = {ids.index(article_id)} WHERE id = {escape(swap_id)}")
            # Пересчитываем всё по порядку
            new_ids = list(ids)
            new_ids[ids.index(article_id)], new_ids[ids.index(swap_id)] = new_ids[ids.index(swap_id)], new_ids[ids.index(article_id)]
            for i, aid in enumerate(new_ids):
                cur.execute(f"UPDATE {S}.content_articles SET sort_order = {i} WHERE id = {escape(aid)}")
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

        photos_val = "ARRAY[" + ",".join(f"'{p}'" for p in (body.get("photos") or [])) + "]::text[]" if body.get("photos") else "'{}'::text[]"
        videos_val = "ARRAY[" + ",".join(f"'{v}'" for v in (body.get("videos") or [])) + "]::text[]" if body.get("videos") else "'{}'::text[]"
        # Для нового FAQ — ставим в конец
        cur.execute(f"""
            SELECT COALESCE(MAX(sort_order), -1) + 1 FROM {S}.content_articles
            WHERE category = 'faq' AND content_type = 'training'
        """)
        next_order = cur.fetchone()[0] if body.get("category") == "faq" else 0
        cur.execute(f"""
            INSERT INTO {S}.content_articles (content_type, title, preview, body, category, status, tags, photos, videos, sort_order)
            VALUES ({escape(body.get("content_type","blog"))}, {escape(body.get("title",""))}, {escape(body.get("preview",""))},
                    {escape(body.get("body",""))}, {escape(body.get("category","news"))}, {escape(body.get("status","draft"))},
                    {escape(body.get("tags",""))}, {photos_val}, {videos_val}, {next_order})
            RETURNING id
        """)
        new_id = str(cur.fetchone()[0])
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "success": True})}

    if method == "PUT":
        article_id = body.get("id") or params.get("id")
        if not article_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id обязателен"})}
        photos_val = "ARRAY[" + ",".join(f"'{p}'" for p in (body.get("photos") or [])) + "]::text[]" if body.get("photos") else "'{}'::text[]"
        videos_val = "ARRAY[" + ",".join(f"'{v}'" for v in (body.get("videos") or [])) + "]::text[]" if body.get("videos") else "'{}'::text[]"
        cur.execute(f"""
            UPDATE {S}.content_articles SET
                title = {escape(body.get("title"))},
                preview = {escape(body.get("preview",""))},
                body = {escape(body.get("body",""))},
                category = {escape(body.get("category","news"))},
                status = {escape(body.get("status","draft"))},
                tags = {escape(body.get("tags",""))},
                photos = {photos_val},
                videos = {videos_val},
                updated_at = now()
            WHERE id = {escape(article_id)}
        """)
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

    if method == "DELETE":
        article_id = params.get("id") or body.get("id")
        if not article_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id обязателен"})}
        cur.execute(f"DELETE FROM {S}.content_articles WHERE id = {escape(article_id)}")
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
