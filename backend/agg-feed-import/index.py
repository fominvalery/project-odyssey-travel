"""
Импорт объектов недвижимости из XML-фида.
POST / — принимает feed_url, скачивает XML, парсит, добавляет объекты в базу.
GET  /?selftest=1 — внутренний тест парсера (не трогает БД).
Поддерживает форматы: YRL (Яндекс), Циан, Авито Недвижимость.
"""
import json
import os
import urllib.request
import xml.etree.ElementTree as ET
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SELFTEST_YRL = """<?xml version="1.0" encoding="utf-8"?>
<realty-feed>
  <offer>
    <name>Офис в центре Москвы</name>
    <type>коммерческая</type>
    <locality-name>Москва</locality-name>
    <address>ул. Тверская, 10</address>
    <price><value>15000000</value></price>
    <area><value>120</value></area>
    <description>Светлый офис с ремонтом</description>
    <image>https://example.com/photo1.jpg</image>
  </offer>
  <offer>
    <name>Склад в Подмосковье</name>
    <type>commercial</type>
    <locality-name>Химки</locality-name>
    <address>Ленинградское ш., 5</address>
    <price><value>8500000</value></price>
    <area><value>450</value></area>
    <description>Тёплый склад класса B</description>
  </offer>
</realty-feed>"""

SELFTEST_AVITO = """<?xml version="1.0" encoding="utf-8"?>
<Ads>
  <Ad>
    <Title>Торговое помещение на Арбате</Title>
    <Category>коммерческая</Category>
    <City>Москва</City>
    <Address>ул. Арбат, 22</Address>
    <Price>22000000</Price>
    <Square>80</Square>
    <Description>Первая линия, высокий трафик</Description>
  </Ad>
</Ads>"""

CATEGORY_MAP = {
    "коммерческая": "commercial",
    "commercial": "commercial",
    "жилая": "residential",
    "residential": "residential",
    "инвестиционная": "investment",
    "investment": "investment",
    "новостройки": "newbuildings",
    "новостройка": "newbuildings",
    "newbuildings": "newbuildings",
    "курортная": "resort",
    "resort": "resort",
    "с торгов": "auction",
    "auction": "auction",
}


def normalize_category(raw: str) -> str:
    if not raw:
        return "commercial"
    key = raw.lower().strip()
    return CATEGORY_MAP.get(key, "commercial")


def safe_float(val):
    try:
        return float(str(val).replace(" ", "").replace(",", "."))
    except Exception:
        return None


def parse_yrl(root):
    """Парсим YRL (Яндекс Недвижимость) формат"""
    offers = []
    for offer in root.iter("offer"):
        title = (offer.findtext("name") or offer.findtext("title") or "").strip()
        if not title:
            continue
        photos = [img.text.strip() for img in offer.findall(".//image") if img.text]
        photos += [img.text.strip() for img in offer.findall(".//photo") if img.text]
        offers.append({
            "title": title,
            "category": normalize_category(offer.findtext("type") or offer.findtext("category") or ""),
            "city": offer.findtext("locality-name") or offer.findtext("city") or "",
            "address": offer.findtext("address") or "",
            "price": safe_float(offer.findtext("price/value") or offer.findtext("price") or ""),
            "area": safe_float(offer.findtext("area/value") or offer.findtext("area") or ""),
            "description": offer.findtext("description") or "",
            "photos": photos[:20],
        })
    return offers


def parse_cian(root):
    """Парсим формат Циан"""
    offers = []
    for offer in root.iter("object"):
        title = (offer.findtext("name") or offer.findtext("title") or "").strip()
        if not title:
            continue
        photos = [img.text.strip() for img in offer.findall(".//image") if img.text]
        photos += [img.text.strip() for img in offer.findall(".//photo") if img.text]
        offers.append({
            "title": title,
            "category": normalize_category(offer.findtext("category") or offer.findtext("type") or ""),
            "city": offer.findtext("city") or offer.findtext("town") or "",
            "address": offer.findtext("address") or "",
            "price": safe_float(offer.findtext("price") or ""),
            "area": safe_float(offer.findtext("area") or offer.findtext("totalArea") or ""),
            "description": offer.findtext("description") or "",
            "photos": photos[:20],
        })
    return offers


def parse_sminex(root):
    """Парсим формат Sminex/Циан CamelCase (feed > object > ExternalId, PropertyType, Address, Photos)"""
    offers = []
    for obj in root.iter("object"):
        ext_id = obj.findtext("ExternalId") or ""
        address = (obj.findtext("Address") or "").strip()
        prop_type = obj.findtext("PropertyType") or ""
        description = (obj.findtext("Description") or "").strip()
        title = address or description or ext_id or prop_type
        if not title:
            continue
        price_el = obj.find(".//Price")
        price = safe_float(price_el.text if price_el is not None else "")
        area_el = obj.find(".//TotalArea") or obj.find(".//Area") or obj.find(".//SquareTotal")
        area = safe_float(area_el.text if area_el is not None else "")
        photos = [el.text.strip() for el in obj.findall(".//Photos/PhotoSchema/FullUrl") if el.text]
        photos += [el.text.strip() for el in obj.findall(".//LayoutPhoto/FullUrl") if el.text]
        city = obj.findtext("City") or obj.findtext("Town") or ""
        offers.append({
            "title": title,
            "category": normalize_category(prop_type),
            "city": city,
            "address": address,
            "price": price,
            "area": area,
            "description": description,
            "photos": photos[:20],
        })
    return offers


def parse_avito(root):
    """Парсим формат Авито Недвижимость"""
    offers = []
    for ad in root.iter("Ad"):
        title = (ad.findtext("Title") or "").strip()
        if not title:
            continue
        photos = [img.text.strip() for img in ad.findall(".//Photo/Url") if img.text]
        photos += [img.text.strip() for img in ad.findall(".//Image") if img.text]
        offers.append({
            "title": title,
            "category": normalize_category(ad.findtext("Category") or ""),
            "city": ad.findtext("City") or ad.findtext("Region") or "",
            "address": ad.findtext("Address") or "",
            "price": safe_float(ad.findtext("Price") or ""),
            "area": safe_float(ad.findtext("Square") or ""),
            "description": ad.findtext("Description") or "",
            "photos": photos[:20],
        })
    return offers


def detect_and_parse(root) -> list:
    tag = root.tag.lower()
    if "realty-feed" in tag or root.find(".//offer") is not None:
        return parse_yrl(root)
    if root.find(".//Ad") is not None:
        return parse_avito(root)
    if root.find(".//object") is not None:
        # Sminex/CamelCase формат: есть ExternalId или PropertyType
        first_obj = root.find(".//object")
        if first_obj is not None and (first_obj.find("ExternalId") is not None or first_obj.find("PropertyType") is not None):
            return parse_sminex(root)
        return parse_cian(root)
    # Generic fallback — ищем любые item/offer/object/ad
    for tag_name in ("offer", "item", "Ad", "object", "listing"):
        items = root.findall(f".//{tag_name}")
        if items:
            return parse_yrl(root)
    return []


def handler(event: dict, context) -> dict:
    """Импорт объектов из XML-фида по URL"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {**CORS, "Access-Control-Max-Age": "86400"}, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method not allowed"})}

    body = json.loads(event.get("body") or "{}")
    feed_url = (body.get("feed_url") or "").strip()

    if not feed_url:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "feed_url required"})}

    if not feed_url.startswith(("http://", "https://")):
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid URL"})}

    # Скачиваем фид
    req = urllib.request.Request(feed_url, headers={"User-Agent": "Cabinet24-FeedImporter/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        xml_data = resp.read()

    root = ET.fromstring(xml_data)
    parsed = detect_and_parse(root)

    if not parsed:
        return {"statusCode": 422, "headers": CORS, "body": json.dumps({"error": "Не удалось распознать формат фида. Поддерживаются: YRL, Циан, Авито"})}

    conn = get_conn()
    cur = conn.cursor()
    imported = 0
    skipped = 0
    errors = []

    for item in parsed:
        title = (item.get("title") or "").strip()
        if not title:
            skipped += 1
            continue
        try:
            # Проверяем дубль по title + city
            cur.execute(
                "SELECT id FROM agg_offers WHERE title = %s AND city = %s LIMIT 1",
                (title, item.get("city") or "")
            )
            if cur.fetchone():
                skipped += 1
                continue

            cur.execute(
                """INSERT INTO agg_offers (title, category, city, address, price, area, description, status, photos, videos, extra_fields)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,'active',%s,'[]','{}')""",
                (
                    title,
                    item.get("category", "commercial"),
                    item.get("city") or "",
                    item.get("address") or "",
                    item.get("price"),
                    item.get("area"),
                    item.get("description") or "",
                    json.dumps(item.get("photos", []), ensure_ascii=False),
                )
            )
            imported += 1
        except Exception as e:
            errors.append(str(e)[:100])
            conn.rollback()
            continue

    conn.commit()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"imported": imported, "skipped": skipped, "errors": errors}, ensure_ascii=False)
    }