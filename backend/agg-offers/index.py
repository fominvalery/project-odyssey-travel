"""
Каталог предложений агрегатора (База/Проекты).
GET  / — список предложений с фильтрами
GET  /?id=... — одно предложение
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


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {**CORS, "Access-Control-Max-Age": "86400"}, "body": ""}

    params = event.get("queryStringParameters") or {}
    offer_id = params.get("id")

    conn = get_conn()
    cur = conn.cursor()

    if offer_id:
        cur.execute(
            "SELECT id, title, category, subtype, city, region, address, price, price_label, area, yield_percent, description, status, photos, videos, presentation_url, extra_fields, commission, commission_notes, created_at FROM agg_offers WHERE id = %s AND status != 'hidden'",
            (offer_id,),
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not found"})}
        cols = ["id", "title", "category", "subtype", "city", "region", "address", "price", "price_label", "area", "yield_percent", "description", "status", "photos", "videos", "presentation_url", "extra_fields", "commission", "commission_notes", "created_at"]
        offer = dict(zip(cols, row))
        offer["id"] = str(offer["id"])
        offer["created_at"] = str(offer["created_at"])
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"offer": offer}, ensure_ascii=False)}

    # Список с фильтрами
    category = params.get("category", "")
    city = params.get("city", "")
    price_from = params.get("price_from", "")
    price_to = params.get("price_to", "")
    area_from = params.get("area_from", "")
    area_to = params.get("area_to", "")
    search = params.get("search", "")
    limit = min(int(params.get("limit", 50)), 200)
    offset = int(params.get("offset", 0))

    where = ["status = 'active'"]
    args = []

    if category:
        where.append("category = %s")
        args.append(category)
    if city:
        where.append("city ILIKE %s")
        args.append(f"%{city}%")
    if price_from:
        where.append("price >= %s")
        args.append(int(price_from))
    if price_to:
        where.append("price <= %s")
        args.append(int(price_to))
    if area_from:
        where.append("area >= %s")
        args.append(float(area_from))
    if area_to:
        where.append("area <= %s")
        args.append(float(area_to))
    if search:
        where.append("(title ILIKE %s OR description ILIKE %s OR city ILIKE %s)")
        args += [f"%{search}%", f"%{search}%", f"%{search}%"]

    sql = f"SELECT id, title, category, subtype, city, price, price_label, area, yield_percent, photos, presentation_url, status, commission FROM agg_offers WHERE {' AND '.join(where)} ORDER BY created_at DESC LIMIT %s OFFSET %s"
    args += [limit, offset]

    cur.execute(sql, args)
    rows = cur.fetchall()

    cur.execute(f"SELECT COUNT(*) FROM agg_offers WHERE {' AND '.join(where)}", args[:-2])
    total = cur.fetchone()[0]
    conn.close()

    cols = ["id", "title", "category", "subtype", "city", "price", "price_label", "area", "yield_percent", "photos", "presentation_url", "status", "commission"]
    offers = []
    for row in rows:
        o = dict(zip(cols, row))
        o["id"] = str(o["id"])
        offers.append(o)

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"offers": offers, "total": total}, ensure_ascii=False)}
