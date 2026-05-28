"""
Админ-панель агрегатора: управление предложениями.
GET    / — список всех предложений (для администраторов)
POST   / — добавить предложение
PUT    / — редактировать предложение
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}

ALLOWED_ADMIN_IDS = []  # проверка через isSuperadmin на фронте


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {**CORS, "Access-Control-Max-Age": "86400"}, "body": ""}

    method = event.get("httpMethod", "GET")
    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        params = event.get("queryStringParameters") or {}
        offer_id = params.get("id")

        # Получение одного объекта по ID
        if offer_id:
            cur.execute(
                "SELECT id, title, category, subtype, city, region, address, price, price_label, area, yield_percent, description, status, photos, videos, presentation_url, commission, commission_notes, extra_fields, created_at FROM agg_offers WHERE id = %s",
                (offer_id,),
            )
            row = cur.fetchone()
            conn.close()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not found"})}
            cols = ["id", "title", "category", "subtype", "city", "region", "address", "price", "price_label", "area", "yield_percent", "description", "status", "photos", "videos", "presentation_url", "commission", "commission_notes", "extra_fields", "created_at"]
            offer = dict(zip(cols, row))
            offer["id"] = str(offer["id"])
            offer["created_at"] = str(offer["created_at"])
            offer["price"] = float(offer["price"]) if offer["price"] is not None else None
            offer["area"] = float(offer["area"]) if offer["area"] is not None else None
            offer["yield_percent"] = float(offer["yield_percent"]) if offer["yield_percent"] is not None else None
            offer["extra_fields"] = offer["extra_fields"] or {}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"offer": offer}, ensure_ascii=False)}

        status = params.get("status", "")
        category = params.get("category", "")
        limit = min(int(params.get("limit", 100)), 500)
        offset = int(params.get("offset", 0))

        where = ["1=1"]
        args = []
        if status:
            where.append("status = %s")
            args.append(status)
        else:
            where.append("status != 'hidden'")
        if category:
            where.append("category = %s")
            args.append(category)

        cur.execute(
            f"SELECT id, title, category, subtype, city, region, address, price, price_label, area, yield_percent, description, status, photos, videos, presentation_url, commission, commission_notes, extra_fields, created_at FROM agg_offers WHERE {' AND '.join(where)} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            args + [limit, offset],
        )
        rows = cur.fetchall()
        cols = ["id", "title", "category", "subtype", "city", "region", "address", "price", "price_label", "area", "yield_percent", "description", "status", "photos", "videos", "presentation_url", "commission", "commission_notes", "extra_fields", "created_at"]
        offers = []
        for row in rows:
            o = dict(zip(cols, row))
            o["id"] = str(o["id"])
            o["created_at"] = str(o["created_at"])
            o["price"] = float(o["price"]) if o["price"] is not None else None
            o["area"] = float(o["area"]) if o["area"] is not None else None
            o["yield_percent"] = float(o["yield_percent"]) if o["yield_percent"] is not None else None
            o["extra_fields"] = o["extra_fields"] or {}
            offers.append(o)

        cur.execute(f"SELECT COUNT(*) FROM agg_offers WHERE {' AND '.join(where)}", args)
        total = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM agg_fixations")
        total_fixations = cur.fetchone()[0]

        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"offers": offers, "total": total, "total_fixations": total_fixations}, ensure_ascii=False)}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        title = body.get("title", "").strip()
        category = body.get("category", "")
        if not title or not category:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "title и category обязательны"})}

        def num(val):
            v = body.get(val)
            if v == "" or v is None:
                return None
            try:
                return float(v)
            except (ValueError, TypeError):
                return None

        cur.execute(
            """INSERT INTO agg_offers (title, category, subtype, city, region, address, price, price_label, area, yield_percent, description, status, photos, videos, presentation_url, extra_fields, commission, commission_notes)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (
                title,
                category,
                body.get("subtype") or None,
                body.get("city") or None,
                body.get("region") or None,
                body.get("address") or None,
                num("price"),
                body.get("price_label") or None,
                num("area"),
                num("yield_percent"),
                body.get("description") or None,
                body.get("status", "active"),
                json.dumps(body.get("photos", [])),
                json.dumps(body.get("videos", [])),
                body.get("presentation_url") or None,
                json.dumps(body.get("extra_fields", {})),
                body.get("commission") or None,
                body.get("commission_notes") or None,
            ),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": str(new_id)}, ensure_ascii=False)}

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        offer_id = body.get("id")
        if not offer_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id обязателен"})}

        fields = ["updated_at = NOW()"]
        args = []
        for f in ["title", "category", "subtype", "city", "region", "address", "price_label", "description", "status", "presentation_url", "commission", "commission_notes"]:
            if f in body:
                fields.append(f"{f} = %s")
                args.append(body[f])
        for f in ["price", "area", "yield_percent"]:
            if f in body:
                v = body[f]
                if v == "" or v is None:
                    fields.append(f"{f} = NULL")
                else:
                    try:
                        fields.append(f"{f} = %s")
                        args.append(float(v))
                    except (ValueError, TypeError):
                        fields.append(f"{f} = NULL")
        for f in ["photos", "videos", "extra_fields"]:
            if f in body:
                fields.append(f"{f} = %s")
                args.append(json.dumps(body[f]))

        args.append(offer_id)
        cur.execute(f"UPDATE agg_offers SET {', '.join(fields)} WHERE id = %s", args)
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    if method == "DELETE":
        params = event.get("queryStringParameters") or {}
        offer_id = params.get("id")
        if not offer_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id обязателен"})}
        cur.execute("DELETE FROM agg_offers WHERE id = %s", (offer_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method not allowed"})}