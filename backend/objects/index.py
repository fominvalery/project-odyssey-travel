"""
CRUD для объектов недвижимости.
GET    /                          — все опубликованные (маркетплейс)
GET    /?user_id={uuid}           — объекты пользователя (для ЛК)
GET    /?id={uuid}                — один объект по id
GET    /?org_id={uuid}            — объекты агентства
GET    /?org_id={uuid}&department_id={uuid} — объекты отдела
POST   /                          — создать объект
PUT    /                          — обновить объект
DELETE /?id={uuid}&user_id={uuid} — удалить объект
"""
import os
import json
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

SELECT_COLS = (
    "id, user_id, category, type, title, city, address, price, "
    "area, description, yield_percent, extra_fields, status, published, created_at, photos, "
    "presentation_url, org_id, department_id"
)


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema


def strip_private_fields(extra: dict) -> dict:
    """Удаляет конфиденциальные поля собственника из extra_fields для публичных запросов."""
    return {k: v for k, v in extra.items() if not k.startswith("owner_")}


def row_to_obj(r, private=False):
    extra = r[11] or {}
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
        "extra_fields": extra if private else strip_private_fields(extra),
        "status": r[12] or "Активен",
        "published": r[13] or False,
        "created_at": r[14].isoformat() if r[14] else "",
        "photos": list(r[15]) if r[15] else [],
        "presentation_url": r[16] or None,
        "org_id": str(r[17]) if r[17] else None,
        "department_id": str(r[18]) if r[18] else None,
    }


def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, default=str)}


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
            org_id = params.get("org_id")
            dept_id = params.get("department_id")

            if obj_id:
                sql = (
                    "SELECT o.id, o.user_id, o.category, o.type, o.title, o.city, o.address, o.price,"
                    " o.area, o.description, o.yield_percent, o.extra_fields, o.status, o.published,"
                    " o.created_at, o.photos, o.presentation_url, o.org_id, o.department_id,"
                    " u.name, u.phone, u.company, u.avatar_url"
                    " FROM " + schema + ".objects o"
                    " LEFT JOIN " + schema + ".users u ON u.id = o.user_id"
                    " WHERE o.id = %s"
                )
                cur.execute(sql, (obj_id,))
                row = cur.fetchone()
                if not row:
                    return resp(404, {"error": "not found"})
                obj = row_to_obj(row[:19])
                obj["owner"] = {
                    "name": row[19] or "",
                    "phone": row[20] or "",
                    "company": row[21] or "",
                    "avatar_url": row[22] or "",
                }
                return resp(200, {"object": obj})

            if org_id:
                if dept_id:
                    cur.execute(
                        "SELECT " + SELECT_COLS + " FROM " + schema + ".objects"
                        " WHERE org_id = %s AND department_id = %s ORDER BY created_at DESC",
                        (org_id, dept_id),
                    )
                else:
                    cur.execute(
                        "SELECT " + SELECT_COLS + " FROM " + schema + ".objects"
                        " WHERE org_id = %s ORDER BY created_at DESC",
                        (org_id,),
                    )
                rows = cur.fetchall()
                return resp(200, {"objects": [row_to_obj(r) for r in rows]})

            archive = params.get("archive")

            if user_id:
                cur.execute(
                    "SELECT " + SELECT_COLS + " FROM " + schema + ".objects"
                    " WHERE user_id = %s ORDER BY created_at DESC",
                    (user_id,),
                )
            elif archive:
                cur.execute(
                    "SELECT " + SELECT_COLS + " FROM " + schema + ".objects"
                    " WHERE status IN ('Продан', 'Сдан') ORDER BY created_at DESC",
                )
            else:
                cur.execute(
                    "SELECT " + SELECT_COLS + " FROM " + schema + ".objects"
                    " WHERE published = true AND status = %s ORDER BY created_at DESC",
                    ("Активен",),
                )

            rows = cur.fetchall()
            # Приватные данные (owner_*) только для владельца
            is_private = bool(user_id)
            return resp(200, {"objects": [row_to_obj(r, private=is_private) for r in rows]})

        # ---------- POST ----------
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            user_id = body.get("user_id") or None
            extra = json.dumps(body.get("extra_fields", {}))
            photos = body.get("photos") or []
            org_id = body.get("org_id") or None
            dept_id = body.get("department_id") or None

            sql = (
                "INSERT INTO " + schema + ".objects"
                " (user_id, category, type, title, city, address, price, area,"
                "  description, yield_percent, extra_fields, status, published, photos,"
                "  presentation_url, org_id, department_id)"
                " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s)"
                " RETURNING " + SELECT_COLS
            )
            cur.execute(sql, (
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
                org_id,
                dept_id,
            ))
            row = cur.fetchone()
            conn.commit()

            # Начисление 20 бонусов рефереру за первый объект реферала
            if user_id:
                try:
                    # Считаем сколько объектов у этого пользователя (новый уже создан)
                    cur.execute(
                        "SELECT COUNT(*) FROM " + schema + ".objects WHERE user_id = %s",
                        (user_id,)
                    )
                    obj_count = cur.fetchone()[0]

                    # Если это первый объект — ищем реферера
                    if obj_count == 1:
                        cur.execute(
                            "SELECT referrer_id FROM " + schema + ".referrals WHERE referred_id = %s",
                            (user_id,)
                        )
                        ref_row = cur.fetchone()
                        if ref_row:
                            referrer_id = ref_row[0]
                            # Начисляем бонус (UNIQUE гарантирует однократность)
                            cur.execute(
                                "INSERT INTO " + schema + ".referral_bonuses"
                                " (referrer_id, referred_id, bonus_type, amount, description)"
                                " VALUES (%s, %s, %s, %s, %s)"
                                " ON CONFLICT (referrer_id, referred_id, bonus_type) DO NOTHING",
                                (referrer_id, user_id, 'first_object', 20,
                                 'Реферал создал первый объект')
                            )
                            conn.commit()
                except Exception:
                    pass  # бонус не критичен для создания объекта

            return resp(200, {"ok": True, "object": row_to_obj(row)})

        # ---------- PUT ----------
        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            obj_id = body.get("id")
            user_id = body.get("user_id")
            if not obj_id or not user_id:
                return resp(400, {"error": "id and user_id required"})

            cur.execute(
                "SELECT user_id FROM " + schema + ".objects WHERE id = %s",
                (obj_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "not found"})
            if str(row[0]) != str(user_id):
                return resp(403, {"error": "forbidden"})

            # Частичное обновление — только статус (для архива/восстановления)
            status_only = set(body.keys()) <= {"id", "user_id", "status"}
            # Частичное обновление — только extra_fields (для данных собственника)
            extra_only = set(body.keys()) <= {"id", "user_id", "status", "extra_fields"} and "extra_fields" in body and "status" in body

            if status_only and "status" in body:
                cur.execute(
                    "UPDATE " + schema + ".objects SET status=%s WHERE id=%s RETURNING " + SELECT_COLS,
                    (body["status"], obj_id),
                )
            elif extra_only:
                cur.execute(
                    "UPDATE " + schema + ".objects SET extra_fields=%s::jsonb, status=%s WHERE id=%s RETURNING " + SELECT_COLS,
                    (json.dumps(body["extra_fields"]), body["status"], obj_id),
                )
            else:
                extra = json.dumps(body.get("extra_fields", {}))
                photos = body.get("photos") or []
                org_id = body.get("org_id") or None
                dept_id = body.get("department_id") or None

                base_set = (
                    "category=%s, type=%s, title=%s, city=%s, address=%s,"
                    " price=%s, area=%s, description=%s, yield_percent=%s,"
                    " extra_fields=%s::jsonb, status=%s, published=%s, photos=%s,"
                    " org_id=%s, department_id=%s"
                )
                base_vals = (
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
                    org_id,
                    dept_id,
                )

                if "presentation_url" in body:
                    sql = (
                        "UPDATE " + schema + ".objects SET " + base_set +
                        ", presentation_url=%s WHERE id=%s RETURNING " + SELECT_COLS
                    )
                    cur.execute(sql, base_vals + (body.get("presentation_url") or None, obj_id))
                else:
                    sql = (
                        "UPDATE " + schema + ".objects SET " + base_set +
                        " WHERE id=%s RETURNING " + SELECT_COLS
                    )
                    cur.execute(sql, base_vals + (obj_id,))

            row = cur.fetchone()
            conn.commit()
            return resp(200, {"ok": True, "object": row_to_obj(row)})

        # ---------- DELETE ----------
        if method == "DELETE":
            params = event.get("queryStringParameters") or {}
            obj_id = params.get("id")
            user_id = params.get("user_id")
            if not obj_id or not user_id:
                return resp(400, {"error": "id and user_id required"})

            cur.execute(
                "SELECT user_id FROM " + schema + ".objects WHERE id = %s",
                (obj_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "not found"})
            if str(row[0]) != str(user_id):
                return resp(403, {"error": "forbidden"})

            cur.execute("DELETE FROM " + schema + ".objects WHERE id = %s", (obj_id,))
            conn.commit()
            return resp(200, {"ok": True})

        return resp(405, {"error": "method not allowed"})

    finally:
        cur.close()
        conn.close()