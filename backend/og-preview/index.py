"""
OG-превью для объектов недвижимости.
GET /?id={uuid} — возвращает HTML с Open Graph тегами для красивого превью в мессенджерах.
Боты (Telegram, VK и др.) получают HTML с тегами, обычные пользователи — редирект на сайт.
"""
import os
import json
import psycopg2

SITE_URL = "https://kabinet-24.ru"


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema


def is_bot(user_agent: str) -> bool:
    ua = (user_agent or "").lower()
    bots = ["telegrambot", "twitterbot", "facebookexternalhit", "vkshare", "whatsapp",
            "slackbot", "linkedinbot", "discordbot", "bot", "crawler", "spider", "preview"]
    return any(b in ua for b in bots)


def make_html(obj_id: str, title: str, description: str, image: str, price: str, address: str) -> str:
    full_title = title
    if price:
        full_title += f" · {price}"

    meta_desc = description[:200] if description else address or "Коммерческая недвижимость на Кабинет-24"

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url={SITE_URL}/object/{obj_id}">
  <title>{full_title}</title>
  <meta name="description" content="{meta_desc}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="{SITE_URL}/preview/{obj_id}">
  <meta property="og:title" content="{full_title}">
  <meta property="og:description" content="{meta_desc}">
  <meta property="og:image" content="{image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Кабинет-24">
  <meta property="og:locale" content="ru_RU">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{full_title}">
  <meta name="twitter:description" content="{meta_desc}">
  <meta name="twitter:image" content="{image}">
</head>
<body>
  <p>Перенаправление на <a href="{SITE_URL}/object/{obj_id}">{full_title}</a>...</p>
</body>
</html>"""


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*"}, "body": ""}

    params = event.get("queryStringParameters") or {}
    obj_id = params.get("id", "").strip()

    if not obj_id:
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "text/html; charset=utf-8", "Access-Control-Allow-Origin": "*"},
            "body": f'<html><head><meta http-equiv="refresh" content="0; url={SITE_URL}"></head><body></body></html>'
        }

    conn, schema = get_conn()
    cur = conn.cursor()

    cur.execute(
        f"SELECT title, address, city, price, description, photos FROM {schema}.objects WHERE id = %s LIMIT 1",
        (obj_id,)
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "text/html; charset=utf-8", "Access-Control-Allow-Origin": "*"},
            "body": f'<html><head><meta http-equiv="refresh" content="0; url={SITE_URL}/object/{obj_id}"></head><body></body></html>'
        }

    title = row[0] or "Объект недвижимости"
    address = row[1] or ""
    city = row[2] or ""
    price = row[3] or ""
    description = row[4] or ""
    photos = list(row[5]) if row[5] else []

    location = ", ".join(filter(None, [city, address]))
    if location and description:
        description = f"{location} · {description}"
    elif location:
        description = location

    image = photos[0] if photos else f"{SITE_URL}/og-default.jpg"

    html = make_html(obj_id, title, description, image, price, address)

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/html; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600"
        },
        "body": html
    }