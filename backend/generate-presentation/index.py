"""
Генерация структурированного контента для PDF-презентации + загрузка готового PDF в S3.

POST /          — генерирует JSON-контент, возвращает presentation{}
POST /?upload=1 — принимает base64 PDF, загружает в S3, возвращает cdn_url
"""
import json
import os
import base64
import uuid
import requests
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    "Content-Type": "application/json",
}


def upload_pdf_to_s3(pdf_bytes: bytes, object_id: str) -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    key = f"presentations/{object_id or uuid.uuid4().hex}/presentation.pdf"
    s3.put_object(
        Bucket="files",
        Key=key,
        Body=pdf_bytes,
        ContentType="application/pdf",
        ContentDisposition="inline",
    )
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")

    # ── Загрузка готового PDF в S3 ──────────────────────────────────────────────
    if params.get("upload") == "1":
        pdf_b64 = body.get("pdf_base64") or ""
        object_id = body.get("object_id") or ""
        if not pdf_b64:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "pdf_base64 required"})}
        try:
            pdf_bytes = base64.b64decode(pdf_b64)
            cdn_url = upload_pdf_to_s3(pdf_bytes, object_id)
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"cdn_url": cdn_url}, ensure_ascii=False)}
        except Exception as e:
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"error": str(e)}, ensure_ascii=False)}

    # ── Генерация контента через ИИ ─────────────────────────────────────────────
    category     = body.get("category", "")
    title        = body.get("title", "")
    city         = body.get("city", "")
    address      = body.get("address", "")
    price        = body.get("price", "")
    area         = body.get("area", "")
    description  = body.get("description", "")
    extra_fields = body.get("extra_fields", {})
    notes        = (body.get("notes") or "").strip()
    contact_name    = body.get("contact_name", "")
    contact_phone   = body.get("contact_phone", "")
    contact_company = body.get("contact_company", "")

    facts_lines = []
    if category:   facts_lines.append(f"Категория: {category}")
    if city:       facts_lines.append(f"Город: {city}")
    if address:    facts_lines.append(f"Адрес: {address}")
    if price:      facts_lines.append(f"Цена: {price} ₽")
    if area:       facts_lines.append(f"Площадь: {area} м²")
    for k, v in extra_fields.items():
        if v:
            facts_lines.append(f"{k}: {v}")
    if description: facts_lines.append(f"\nОписание: {description}")
    if notes:       facts_lines.append(f"\nДополнительно: {notes}")

    object_info = "\n".join(facts_lines) if facts_lines else "Данные не указаны"

    prompt = f"""Ты — аналитик рынка коммерческой недвижимости. Подготовь структурированный контент для PDF-презентации объекта.

Данные объекта:
{object_info}

Верни ТОЛЬКО JSON (без markdown, без ```json```) следующей структуры:
{{
  "headline": "Краткий продающий заголовок (до 10 слов)",
  "tagline": "Подзаголовок — ключевая выгода (до 15 слов)",
  "summary": "Вводный абзац 2–3 предложения — суть предложения",
  "highlights": ["преимущество 1", "преимущество 2", "преимущество 3", "преимущество 4"],
  "specs": {{"Площадь": "...", "Цена": "...", "Адрес": "...", "Категория": "..."}},
  "investment_appeal": "1–2 предложения о потенциале для инвестора/арендатора",
  "call_to_action": "Побуждающая фраза для обращения (1 предложение)"
}}

Язык — русский. Деловой тон. Только JSON."""

    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        json={
            "model": "openrouter/free",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 900,
            "temperature": 0.6,
        },
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        timeout=30,
    )

    result = response.json()

    try:
        raw = ((result.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
        raw = raw.strip()
        if not raw:
            raise ValueError("empty")
        if "```" in raw:
            for part in raw.split("```"):
                p = part.strip().lstrip("json").strip()
                if p.startswith("{"):
                    raw = p
                    break
        s, e = raw.find("{"), raw.rfind("}") + 1
        if s >= 0 and e > s:
            raw = raw[s:e]
        content = json.loads(raw)
    except Exception:
        highlights = []
        if area:    highlights.append(f"Площадь: {area} м²")
        if price:   highlights.append(f"Цена: {price} ₽")
        if address: highlights.append(f"Адрес: {address}")
        highlights.append("Готов к переговорам")
        content = {
            "headline": title or "Объект недвижимости",
            "tagline": f"{category} · {city}" if city else (category or "Коммерческая недвижимость"),
            "summary": description or "Подробная информация по запросу.",
            "highlights": highlights,
            "specs": {k: v for k, v in {"Площадь": f"{area} м²", "Цена": f"{price} ₽", "Адрес": address, "Категория": category}.items() if v},
            "investment_appeal": "Объект подходит для долгосрочных инвестиций.",
            "call_to_action": "Свяжитесь с нами для получения подробной информации.",
        }

    content["contact"] = {"name": contact_name, "phone": contact_phone, "company": contact_company}
    content["object_title"] = title or content.get("headline", "Объект")

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"presentation": content}, ensure_ascii=False),
    }
