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
Напиши развёрнутое продающее описание объекта для размещения на маркетплейсе.

Данные объекта:
{object_info}{user_block}

Требования к тексту:
- Объём: 4–6 абзацев, каждый абзац 2–4 предложения (итого не менее 250–350 слов)
- Структура: 1-й абзац — общая суть и локация, 2-й — технические характеристики и планировка, 3-й — коммерческие преимущества и доходность, 4-й — инфраструктура и окружение, 5-й — условия сделки и контакт
- Живой деловой язык, без канцеляризмов
- Не используй: «уникальный», «выгодное предложение», «не упустите шанс»
- Разделяй абзацы пустой строкой (\\n\\n)
- Без заголовков, без markdown, без маркированных списков
- На русском языке"""

    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    headers_ai = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    def call_ai(p: str, max_tok: int) -> str:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json={
                "model": "openrouter/free",
                "messages": [{"role": "user", "content": p}],
                "max_tokens": max_tok,
                "temperature": 0.75,
            },
            headers=headers_ai,
            timeout=25,
        )
        data = r.json()
        return ((data.get("choices") or [{}])[0].get("message") or {}).get("content") or ""

    # Попытка 1 — полный промпт
    reply = ""
    try:
        reply = call_ai(prompt, 900).strip()
    except Exception:
        pass

    # Попытка 2 — укороченный промпт если первый дал пустой ответ
    if not reply:
        short_prompt = f"""Напиши продающее описание объекта недвижимости для маркетплейса. 3 абзаца, деловой стиль, на русском языке.

{object_info}{user_block}"""
        try:
            reply = call_ai(short_prompt, 600).strip()
        except Exception:
            pass

    if not reply:
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