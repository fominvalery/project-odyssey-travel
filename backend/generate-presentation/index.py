"""
Генерация структурированного контента для PDF-презентации объекта недвижимости.
ИИ возвращает JSON со всеми секциями презентации — фронтенд собирает PDF из этого JSON.

POST / — принимает данные объекта и настройки презентации, возвращает JSON-контент.
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

    category    = body.get("category", "")
    title       = body.get("title", "")
    city        = body.get("city", "")
    address     = body.get("address", "")
    price       = body.get("price", "")
    area        = body.get("area", "")
    description = body.get("description", "")
    extra_fields = body.get("extra_fields", {})
    notes       = (body.get("notes") or "").strip()
    contact_name  = body.get("contact_name", "")
    contact_phone = body.get("contact_phone", "")
    contact_company = body.get("contact_company", "")

    # Собираем факты об объекте
    facts_lines = []
    if category:    facts_lines.append(f"Категория: {category}")
    if city:        facts_lines.append(f"Город: {city}")
    if address:     facts_lines.append(f"Адрес: {address}")
    if price:       facts_lines.append(f"Цена: {price} ₽")
    if area:        facts_lines.append(f"Площадь: {area} м²")
    for k, v in extra_fields.items():
        if v:
            facts_lines.append(f"{k}: {v}")
    if description: facts_lines.append(f"\nОписание: {description}")
    if notes:       facts_lines.append(f"\nДополнительно от продавца: {notes}")

    object_info = "\n".join(facts_lines) if facts_lines else "Данные не указаны"

    prompt = f"""Ты — аналитик рынка коммерческой недвижимости. Подготовь структурированный контент для профессиональной PDF-презентации объекта.

Данные объекта:
{object_info}

Верни ТОЛЬКО JSON (без markdown, без ```json```) следующей структуры:
{{
  "headline": "Краткий продающий заголовок (до 10 слов)",
  "tagline": "Подзаголовок — ключевая выгода (до 15 слов)",
  "summary": "Вводный абзац 2–3 предложения — суть предложения",
  "highlights": ["факт/преимущество 1", "факт/преимущество 2", "факт/преимущество 3", "факт/преимущество 4"],
  "specs": {{"Площадь": "...", "Цена": "...", "Адрес": "...", "Категория": "..."}},
  "investment_appeal": "1–2 предложения о потенциале и выгоде для инвестора/арендатора",
  "call_to_action": "Побуждающая фраза для обращения (1 предложение)"
}}

Язык — русский. Профессиональный деловой тон. Только JSON, ничего лишнего."""

    api_key = os.environ.get("OPENROUTER_API_KEY", "")

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        json={
            "model": "openrouter/free",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 900,
            "temperature": 0.6,
        },
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        timeout=30,
    )

    result = response.json()

    try:
        raw = ((result.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
        raw = raw.strip()
        if not raw:
            raise ValueError("empty response")
        # Убираем markdown-обёртку
        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                p = part.strip().lstrip("json").strip()
                if p.startswith("{"):
                    raw = p
                    break
        # Вырезаем только JSON-объект
        start, end = raw.find("{"), raw.rfind("}") + 1
        if start >= 0 and end > start:
            raw = raw[start:end]
        content = json.loads(raw)
    except Exception:
        # Fallback: строим контент из данных без ИИ
        highlights = []
        if area:  highlights.append(f"Площадь: {area} м²")
        if price: highlights.append(f"Цена: {price} ₽")
        if address: highlights.append(f"Адрес: {address}")
        highlights.append("Готов к переговорам")
        content = {
            "headline": title or "Объект недвижимости",
            "tagline": f"{category} · {city}" if city else (category or "Коммерческая недвижимость"),
            "summary": description or "Подробная информация по запросу.",
            "highlights": highlights,
            "specs": {k: v for k, v in {"Площадь": f"{area} м²", "Цена": f"{price} ₽", "Адрес": address, "Категория": category}.items() if v},
            "investment_appeal": "Объект подходит для долгосрочных инвестиций и стабильного дохода.",
            "call_to_action": "Свяжитесь с нами для получения подробной информации и организации просмотра.",
        }

    # Дополняем контактами
    content["contact"] = {
        "name": contact_name,
        "phone": contact_phone,
        "company": contact_company,
    }
    content["object_title"] = title or content.get("headline", "Объект")

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"presentation": content}, ensure_ascii=False),
    }