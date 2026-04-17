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

    prompt = f"""Ты — профессиональный копирайтер по коммерческой недвижимости.
Напиши продающее описание объекта для размещения на маркетплейсе.

Данные объекта:
{object_info}{user_block}

Требования:
- 3–5 предложений, живой профессиональный язык
- Выдели ключевые преимущества
- Без воды и шаблонных фраз вроде «уникальное предложение»
- Только текст описания, без заголовков и markdown
- На русском языке"""

    api_key = os.environ.get("OPENROUTER_API_KEY", "")

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        json={
            "model": "openrouter/free",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 600,
            "temperature": 0.75,
        },
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        timeout=25,
    )

    result = response.json()

    try:
        reply = result["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError):
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"error": "ИИ временно недоступен, попробуйте позже"}, ensure_ascii=False),
        }

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"description": reply}, ensure_ascii=False),
    }
