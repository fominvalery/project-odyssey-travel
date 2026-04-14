"""
CRUD для объектов недвижимости.
GET  / — список (published=true для маркетплейса, или по user_id)
POST / — создать объект
"""
import os
import json
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    conn, schema = get_conn()
    cur = conn.cursor()

    # GET — список объектов
    if method == "GET":
        params = event.get("queryStringParameters") or {}
        user_id = params.get("user_id")
        marketplace = params.get("marketplace")

        if user_id:
            cur.execute(f"""
                SELECT id, user_id, category, type, title, city, address, price,
                       area, description, yield_percent, extra_fields, status, published, created_at
                FROM {schema}.objects
                WHERE user_id = '{user_id}'
                ORDER BY created_at DESC
            """)
        elif marketplace:
            cur.execute(f"""
                SELECT id, user_id, category, type, title, city, address, price,
                       area, description, yield_percent, extra_fields, status, published, created_at
                FROM {schema}.objects
                WHERE published = true AND status = 'Активен'
                ORDER BY created_at DESC
            """)
        else:
            cur.execute(f"""
                SELECT id, user_id, category, type, title, city, address, price,
                       area, description, yield_percent, extra_fields, status, published, created_at
                FROM {schema}.objects
                WHERE published = true AND status = 'Активен'
                ORDER BY created_at DESC
            """)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        objects = []
        for r in rows:
            objects.append({
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
            })
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"objects": objects})}

    # POST — создать объект
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        user_id = body.get("user_id", "")
        category = body.get("category", "")
        obj_type = body.get("type", "")
        title = body.get("title", "").replace("'", "''")
        city = body.get("city", "").replace("'", "''")
        address = body.get("address", "").replace("'", "''")
        price = body.get("price", "").replace("'", "''")
        area = body.get("area", "").replace("'", "''")
        description = body.get("description", "").replace("'", "''")
        yield_percent = body.get("yield_percent", "").replace("'", "''")
        extra_fields = json.dumps(body.get("extra_fields", {})).replace("'", "''")
        status = body.get("status", "Активен")
        published = body.get("published", False)

        user_id_sql = f"'{user_id}'" if user_id else "NULL"

        cur.execute(f"""
            INSERT INTO {schema}.objects
              (user_id, category, type, title, city, address, price, area,
               description, yield_percent, extra_fields, status, published)
            VALUES
              ({user_id_sql}, '{category}', '{obj_type}', '{title}', '{city}', '{address}',
               '{price}', '{area}', '{description}', '{yield_percent}',
               '{extra_fields}'::jsonb, '{status}', {str(published).lower()})
            RETURNING id
        """)
        new_id = str(cur.fetchone()[0])
        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "ok": True})}

    cur.close()
    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}