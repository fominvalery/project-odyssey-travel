"""
CRUD для объектов недвижимости.
GET    /                   — все опубликованные (маркетплейс)
GET    /?marketplace=true  — все опубликованные (маркетплейс)
GET    /?user_id={uuid}    — объекты пользователя (для ЛК)
GET    /?id={uuid}         — один объект по id
POST   /                   — создать объект
PUT    /                   — обновить объект (нужен id и user_id в теле — только владелец)
DELETE /?id={uuid}&user_id={uuid} — удалить объект (только владелец)
"""
import os
import json
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

SELECT_COLS = """
    id, user_id, category, type, title, city, address, price,
    area, description, yield_percent, extra_fields, status, published, created_at, photos,
    presentation_url
"""


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema


def row_to_obj(r):
    return {
        "id": str(r[0]),
        "user_id": str(r[1]) if r[1] else None,
        "category": r[2],
        "type": r[3],
        "title": r[4],
        "city": r[5] or "",
        "address": r[6] or "",
        "price": r[7] or "",
        "area": r[8] or "",
        "description": r[9] or "",
        "yield_percent": r[10] or "",
        "extra_fields": r[11] or {},
        "status": r[12] or "Активен",
        "published": r[13] or False,
        "created_at": r[14].isoformat() if r[14] else "",
        "photos": list(r[15]) if r[15] else [],
        "presentation_url": r[16] or None,
    }


def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    conn, schema = get_conn()
    cur = conn.cursor()

    try:
        # ---------- GET ----------
        if method == "GET":
            params = event.get("queryStringParameters") or {}
            obj_id = params.get("id")
            user_id = params.get("user_id")

            if obj_id:
                cur.execute(
                    f"""
                    SELECT o.id, o.user_id, o.category, o.type, o.title, o.city, o.address, o.price,
                           o.area, o.description, o.yield_percent, o.extra_fields, o.status, o.published,
                           o.created_at, o.photos, o.presentation_url,
                           u.name, u.phone, u.company, u.avatar_url
                    FROM {schema}.objects o
                    LEFT JOIN {schema}.users u ON u.id = o.user_id
                    WHERE o.id = %s
                    """,
                    (obj_id,),
                )
                row = cur.fetchone()
                if not row:
                    return resp(404, {"error": "not found"})
                obj = row_to_obj(row[:17])
                obj["owner"] = {
                    "name": row[17] or "",
                    "phone": row[18] or "",
                    "company": row[19] or "",
                    "avatar_url": row[20] or "",
                }
                return resp(200, {"object": obj})

            if user_id:
                cur.execute(
                    f"SELECT {SELECT_COLS} FROM {schema}.objects WHERE user_id = %s ORDER BY created_at DESC",
                    (user_id,),
                )
            else:
                cur.execute(
                    f"SELECT {SELECT_COLS} FROM {schema}.objects "
                    f"WHERE published = true AND status = %s ORDER BY created_at DESC",
                    ("Активен",),
                )

            rows = cur.fetchall()
            return resp(200, {"objects": [row_to_obj(r) for r in rows]})

        # ---------- POST ----------
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            user_id = body.get("user_id") or None
            extra = json.dumps(body.get("extra_fields", {}))
            photos = body.get("photos") or []

            cur.execute(
                f"""
                INSERT INTO {schema}.objects
                    (user_id, category, type, title, city, address, price, area,
                     description, yield_percent, extra_fields, status, published, photos, presentation_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s)
                RETURNING {SELECT_COLS}
                """,
                (
                    user_id,
                    body.get("category", ""),
                    body.get("type", ""),
                    body.get("title", ""),
                    body.get("city", ""),
                    body.get("address", ""),
                    body.get("price", ""),
                    body.get("area", ""),
                    body.get("description", ""),
                    body.get("yield_percent", ""),
                    extra,
                    body.get("status", "Активен"),
                    bool(body.get("published", False)),
                    photos,
                    body.get("presentation_url") or None,
                ),
            )
            row = cur.fetchone()
            conn.commit()
            return resp(200, {"ok": True, "object": row_to_obj(row)})

        # ---------- PUT ----------
        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            obj_id = body.get("id")
            user_id = body.get("user_id")
            if not obj_id or not user_id:
                return resp(400, {"error": "id and user_id required"})

            cur.execute(
                f"SELECT user_id FROM {schema}.objects WHERE id = %s",
                (obj_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "not found"})
            if str(row[0]) != str(user_id):
                return resp(403, {"error": "forbidden"})

            extra = json.dumps(body.get("extra_fields", {}))
            photos = body.get("photos") or []

            # presentation_url: если передан явно — обновляем, если не передан — не трогаем
            if "presentation_url" in body:
                cur.execute(
                    f"""
                    UPDATE {schema}.objects
                    SET category = %s, type = %s, title = %s, city = %s, address = %s,
                        price = %s, area = %s, description = %s, yield_percent = %s,
                        extra_fields = %s::jsonb, status = %s, published = %s, photos = %s,
                        presentation_url = %s
                    WHERE id = %s
                    RETURNING {SELECT_COLS}
                    """,
                    (
                        body.get("category", ""),
                        body.get("type", ""),
                        body.get("title", ""),
                        body.get("city", ""),
                        body.get("address", ""),
                        body.get("price", ""),
                        body.get("area", ""),
                        body.get("description", ""),
                        body.get("yield_percent", ""),
                        extra,
                        body.get("status", "Активен"),
                        bool(body.get("published", False)),
                        photos,
                        body.get("presentation_url") or None,
                        obj_id,
                    ),
                )
            else:
                cur.execute(
                    f"""
                    UPDATE {schema}.objects
                    SET category = %s, type = %s, title = %s, city = %s, address = %s,
                        price = %s, area = %s, description = %s, yield_percent = %s,
                        extra_fields = %s::jsonb, status = %s, published = %s, photos = %s
                    WHERE id = %s
                    RETURNING {SELECT_COLS}
                    """,
                    (
                        body.get("category", ""),
                        body.get("type", ""),
                        body.get("title", ""),
                        body.get("city", ""),
                        body.get("address", ""),
                        body.get("price", ""),
                        body.get("area", ""),
                        body.get("description", ""),
                        body.get("yield_percent", ""),
                        extra,
                        body.get("status", "Активен"),
                        bool(body.get("published", False)),
                        photos,
                        obj_id,
                    ),
                )
            updated = cur.fetchone()
            conn.commit()
            return resp(200, {"ok": True, "object": row_to_obj(updated)})

        # ---------- DELETE ----------
        if method == "DELETE":
            params = event.get("queryStringParameters") or {}
            obj_id = params.get("id")
            user_id = params.get("user_id")
            if not obj_id or not user_id:
                return resp(400, {"error": "id and user_id required"})

            cur.execute(
                f"SELECT user_id FROM {schema}.objects WHERE id = %s",
                (obj_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "not found"})
            if str(row[0]) != str(user_id):
                return resp(403, {"error": "forbidden"})

            cur.execute(f"DELETE FROM {schema}.objects WHERE id = %s", (obj_id,))
            conn.commit()
            return resp(200, {"ok": True})

        return resp(405, {"error": "Method not allowed"})
    finally:
        cur.close()
        conn.close()
