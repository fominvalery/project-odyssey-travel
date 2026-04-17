"""
Генерация описания объекта недвижимости с помощью ИИ.
POST / — принимает данные объекта и черновик пользователя, возвращает готовое описание.
"""
import json
import os
import requests

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    "Content-Type": "application/json",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")

    # Данные объекта
    category = body.get("category", "")
    title = body.get("title", "")
    city = body.get("city", "")
    address = body.get("address", "")
    price = body.get("price", "")
    area = body.get("area", "")
    extra_fields = body.get("extra_fields", {})
    user_draft = (body.get("user_draft") or "").strip()

    # Формируем контекст об объекте
    facts = []
    if category:
        facts.append(f"Категория: {category}")
    if title:
        facts.append(f"Название: {title}")
    if city:
        facts.append(f"Город: {city}")
    if address:
        facts.append(f"Адрес: {address}")
    if price:
        facts.append(f"Цена: {price} ₽")
    if area:
        facts.append(f"Площадь: {area} м²")
    for k, v in extra_fields.items():
        if v:
            facts.append(f"{k}: {v}")

    object_info = "\n".join(facts) if facts else "Данные не указаны"

    user_block = ""
    if user_draft:
        user_block = f"\n\nДополнительная информация от пользователя:\n{user_draft}"

    prompt = f"""Напиши развёрнутое продающее описание объекта недвижимости для маркетплейса.
Объём: 4 абзаца, каждый 2-3 предложения. Деловой стиль, на русском. Разделяй абзацы пустой строкой.
Без заголовков, без markdown, без списков.

Структура:
1) Общая суть и локация
2) Характеристики и планировка
3) Коммерческие преимущества
4) Условия сделки

Данные:
{object_info}{user_block}"""

    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    headers_ai = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    reply = ""
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json={
                "model": "openrouter/free",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 700,
                "temperature": 0.75,
            },
            headers=headers_ai,
            timeout=22,
        )
        data = r.json()
        reply = (((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip()
    except Exception:
        pass

    # Fallback — генерим развёрнутый текст из данных если ИИ не ответил
    if not reply:
        reply = build_fallback_text(
            category=category, title=title, city=city, address=address,
            price=price, area=area, extra_fields=extra_fields, user_draft=user_draft,
        )

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"description": reply}, ensure_ascii=False),
    }


def build_fallback_text(category, title, city, address, price, area, extra_fields, user_draft):
    """Собирает развёрнутое описание из данных объекта без использования ИИ."""
    loc_parts = [p for p in [city, address] if p]
    loc = ", ".join(loc_parts) if loc_parts else "востребованной локации"

    p1_parts = []
    if title:
        p1_parts.append(f"{title} — объект категории «{category or 'коммерческая недвижимость'}», расположенный в {loc}.")
    else:
        p1_parts.append(f"Представляем объект категории «{category or 'коммерческая недвижимость'}» в {loc}.")
    p1_parts.append("Удачное расположение обеспечивает стабильный трафик и доступ к основным транспортным узлам.")
    p1 = " ".join(p1_parts)

    p2_parts = []
    if area:
        p2_parts.append(f"Общая площадь объекта составляет {area} м².")
    floor = extra_fields.get("floor")
    ceiling = extra_fields.get("ceiling")
    if floor:
        p2_parts.append(f"Расположен на {floor} этаже.")
    if ceiling:
        p2_parts.append(f"Высота потолков — {ceiling} м.")
    subtype = extra_fields.get("subtype") or extra_fields.get("class")
    if subtype:
        p2_parts.append(f"Тип помещения: {subtype}.")
    if not p2_parts:
        p2_parts.append("Помещение имеет функциональную планировку и подходит под различные задачи бизнеса.")
    p2 = " ".join(p2_parts)

    p3_parts = []
    yield_val = extra_fields.get("yield")
    rent = extra_fields.get("rent")
    roi = extra_fields.get("roi")
    if rent:
        p3_parts.append(f"Арендный доход составляет {rent} ₽ в месяц.")
    if yield_val:
        p3_parts.append(f"Доходность объекта — {yield_val}% годовых.")
    if roi:
        p3_parts.append(f"ROI на уровне {roi}%.")
    if not p3_parts:
        p3_parts.append("Объект обладает высоким коммерческим потенциалом и подходит как для собственного использования, так и для сдачи в аренду.")
    p3_parts.append("Такое сочетание факторов делает его интересным инвестиционным активом.")
    p3 = " ".join(p3_parts)

    p4_parts = []
    if price:
        p4_parts.append(f"Цена объекта — {price} ₽.")
    p4_parts.append("Готовы обсудить условия сделки, показать объект и предоставить полный пакет документов.")
    p4_parts.append("Свяжитесь с нами для получения подробной информации и организации просмотра.")
    p4 = " ".join(p4_parts)

    result = "\n\n".join([p1, p2, p3, p4])
    if user_draft:
        result = f"{user_draft}\n\n{result}"
    return result