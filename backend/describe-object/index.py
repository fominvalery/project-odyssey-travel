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
    PRIVATE_FIELDS = {"owner_name", "owner_phone", "owner_fee", "owner_comment",
                      "presentation_contact_name", "presentation_contact_phone",
                      "presentation_contact_company"}
    extra_fields = {k: v for k, v in body.get("extra_fields", {}).items()
                    if k not in PRIVATE_FIELDS}
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

    # Удаляем контактные данные из черновика перед отправкой в ИИ
    import re
    user_draft_clean = re.sub(r'\+?[\d\s\-\(\)]{7,}', '', user_draft)  # телефоны
    user_draft_clean = re.sub(r'[\w.\-]+@[\w.\-]+\.\w+', '', user_draft_clean)  # email
    user_draft_clean = re.sub(r'https?://\S+', '', user_draft_clean)  # ссылки
    user_draft_clean = user_draft_clean.strip()

    user_block = ""
    if user_draft_clean:
        user_block = f"\n\nЧерновик/тезисы от пользователя (встрой их органично в текст, не выноси отдельным блоком):\n{user_draft_clean}"

    # Определяем тип сделки — сначала из явного поля, потом fallback по тексту
    deal_type_raw = (body.get("deal_type") or "").lower().strip()
    if "аренд" in deal_type_raw or deal_type_raw in ("rent", "аренда"):
        deal_type = "аренда"
    elif deal_type_raw in ("sale", "продажа", "продаж"):
        deal_type = "продажа"
    else:
        deal_type = "аренда" if any(w in title.lower() + category.lower() for w in ["аренд", "снять", "сдать", "сдаём", "сдаем"]) else "продажа"
    deal_hint = "аренды" if deal_type == "аренда" else "покупки"
    deal_cta = "арендовать" if deal_type == "аренда" else "приобрести"
    deal_investor = "стабильный арендный доход" if deal_type == "аренда" else "выгодное вложение капитала"

    prompt = f"""Ты опытный риелтор коммерческой недвижимости. Напиши продающее описание объекта для профессионального маркетплейса.

Правила:
- Ровно 4 абзаца, каждый 2–3 предложения, абзацы разделены пустой строкой
- Деловой стиль, живой язык, на русском
- Без заголовков, без markdown, без списков, без эмодзи
- Используй переданные характеристики объекта — не придумывай то, чего нет в данных
- Тип сделки: {deal_type.upper()} — весь текст пиши под этот сценарий
- Адаптируй язык под категорию и вид объекта (офис — деловая атмосфера, склад — логистика и операционность, ритейл — трафик и витрина, жильё — комфорт и lifestyle)
- Если черновик/тезисы пользователя указаны — органично встрой их смысловую суть внутрь абзацев, НЕ выноси их отдельным блоком
- СТРОГО ЗАПРЕЩЕНО: упоминать имена людей, номера телефонов, email-адреса, ссылки, мессенджеры и любые контактные данные — их нет в публичном описании объекта

Структура:
1) Суть объекта, категория, локация и её преимущества
2) Конкретные характеристики: площадь, этаж, класс, планировка, отделка — всё что есть в данных
3) Коммерческая ценность для сценария «{deal_hint}»: {deal_investor}, целевая аудитория, потенциал
4) Условия {deal_hint} и призыв к действию — {deal_cta} этот объект

Данные объекта:
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
                "model": "google/gemini-2.0-flash-exp:free",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 900,
                "temperature": 0.7,
            },
            headers=headers_ai,
            timeout=40,
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
            deal_type=deal_type,
        )

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"description": reply}, ensure_ascii=False),
    }


def build_fallback_text(category, title, city, address, price, area, extra_fields, user_draft, deal_type="продажа"):
    """Собирает развёрнутое описание из данных объекта без использования ИИ."""
    is_rent = deal_type == "аренда"
    loc_parts = [p for p in [city, address] if p]
    loc = ", ".join(loc_parts) if loc_parts else "востребованной локации"
    subtype = extra_fields.get("subtype", "")
    obj_label = subtype or category or "объект"

    # Абзац 1 — суть и локация
    if is_rent:
        intro = f"Предлагается в аренду {obj_label.lower()} площадью {area} м²" if area else f"Предлагается в аренду {obj_label.lower()}"
    else:
        intro = f"Продаётся {obj_label.lower()} площадью {area} м²" if area else f"Продаётся {obj_label.lower()}"
    if loc_parts:
        p1 = f"{intro}, расположенный по адресу {loc}. Объект находится в развитом районе с удобной транспортной доступностью."
    else:
        p1 = f"{intro}. Объект расположен в развитом районе с удобной транспортной доступностью."

    # Абзац 2 — характеристики
    p2_parts = []
    floor = extra_fields.get("floor")
    ceiling = extra_fields.get("ceiling")
    condition = extra_fields.get("condition")
    cls = extra_fields.get("class")
    if floor:
        p2_parts.append(f"Помещение расположено на {floor} этаже.")
    if ceiling:
        p2_parts.append(f"Высота потолков — {ceiling} м.")
    if cls:
        p2_parts.append(f"Класс здания: {cls}.")
    if condition:
        p2_parts.append(f"Состояние: {condition}.")
    if not p2_parts:
        p2_parts.append("Помещение имеет функциональную планировку, готово к использованию.")
    p2 = " ".join(p2_parts)

    # Абзац 3 — преимущества под тип сделки
    p3_parts = []
    if is_rent:
        deposit = extra_fields.get("deposit")
        lease_term = extra_fields.get("lease_term")
        if deposit:
            p3_parts.append(f"Депозит — {deposit} мес.")
        if lease_term:
            p3_parts.append(f"Минимальный срок аренды: {lease_term} мес.")
        if not p3_parts:
            p3_parts.append("Объект подходит для размещения бизнеса любого формата — планировка легко адаптируется под задачи арендатора.")
        p3_parts.append("Инфраструктура здания обеспечивает комфортные условия работы.")
    else:
        yield_val = extra_fields.get("yield")
        roi = extra_fields.get("roi")
        if yield_val:
            p3_parts.append(f"Доходность объекта — {yield_val}% годовых.")
        if roi:
            p3_parts.append(f"ROI: {roi}%.")
        if not p3_parts:
            p3_parts.append("Объект подходит как для собственного бизнеса, так и для сдачи в аренду с первого дня.")
        p3_parts.append("Ликвидная локация обеспечивает стабильный спрос.")
    p3 = " ".join(p3_parts)

    # Абзац 4 — условия и CTA
    p4_parts = []
    if is_rent:
        if price:
            p4_parts.append(f"Арендная ставка — {price} ₽ в месяц.")
        p4_parts.append("Готовы организовать показ и предоставить полный пакет документов по объекту.")
    else:
        if price:
            p4_parts.append(f"Цена — {price} ₽.")
        p4_parts.append("Возможно рассмотрение альтернативных условий сделки. Готовы к переговорам и организации просмотра.")
    p4 = " ".join(p4_parts)

    return "\n\n".join([p1, p2, p3, p4])