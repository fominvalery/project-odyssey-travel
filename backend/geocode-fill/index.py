import os
import json
import urllib.request
import urllib.parse
import psycopg2

CORS = {"Access-Control-Allow-Origin": "*"}
GEOCODER_KEY = "8966eab8-9617-4075-845c-184846af3286"


def geocode(query: str):
    url = f"https://geocode-maps.yandex.ru/1.x/?apikey={GEOCODER_KEY}&geocode={urllib.parse.quote(query)}&format=json&lang=ru_RU&results=1"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    pos = data["response"]["GeoObjectCollection"]["featureMember"][0]["GeoObject"]["Point"]["pos"]
    lon, lat = map(float, pos.split())
    return lat, lon


def handler(event: dict, context) -> dict:
    """Заполняет lat/lon для всех объектов у которых есть адрес но нет координат"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    cur.execute("""
        SELECT id, city, address FROM agg_offers
        WHERE (lat IS NULL OR lon IS NULL)
        AND (COALESCE(city, '') != '' OR COALESCE(address, '') != '')
    """)
    rows = cur.fetchall()

    updated = 0
    errors = []
    for row in rows:
        obj_id, city, address = row
        query = ", ".join(filter(None, [str(address or ""), str(city or "")]))
        if not query.strip():
            continue
        try:
            lat, lon = geocode(query)
            cur.execute("UPDATE agg_offers SET lat = %s, lon = %s WHERE id = %s", (lat, lon, str(obj_id)))
            updated += 1
        except Exception as e:
            errors.append({"id": str(obj_id), "error": str(e)})

    conn.commit()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"updated": updated, "errors": errors}),
    }
