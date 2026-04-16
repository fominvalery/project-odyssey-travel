import json
import os
import requests
# redeploy

SYSTEM_PROMPT_RU = """Ты — ИИ-помощник платформы Кабинет-24 (kabinet-24.ru) — платформы коммерческой недвижимости.
Твоя задача — помогать пользователям разобраться с функционалом платформы.

Что ты знаешь о платформе Кабинет-24:

ОСНОВНЫЕ РАЗДЕЛЫ:
1. Дашборд — главная страница кабинета. Показывает сводку: количество объектов, просмотры, активные сделки.
2. Объекты — управление объектами недвижимости. Добавляй объекты через кнопку "Добавить объект": тип, площадь, цена, адрес, описание, фото.
3. CRM — управление клиентами и сделками. Контакты покупателей и арендаторов, история переговоров, статусы сделок.
4. Аналитика — статистика по объектам: просмотры, обращения, конверсия.
5. Рефералы — реферальная программа с 5 уровнями. Приглашай коллег и получай бонусы.
6. Профиль — настройки аккаунта: имя, телефон, компания, аватар, тариф.
7. Поддержка — раздел помощи. Здесь ты можешь задать вопрос мне или обратиться к живому менеджеру.
8. Маркетплейс — публичный каталог объектов недвижимости.

ТАРИФЫ:
- FREE — базовый бесплатный тариф.
- ПРО — расширенные возможности, больше объектов, аналитика.
- Про+ — максимум возможностей, приоритетная поддержка.
- Конструктор — для агентств.

КАК ДОБАВИТЬ ОБЪЕКТ:
1. Перейди в раздел "Объекты"
2. Нажми "Добавить объект"
3. Заполни мастер: тип, площадь, цена, адрес, фото
4. Нажми "Опубликовать"

КАК РАБОТАЕТ CRM:
Перейди в CRM, добавляй клиентов вручную или они появляются автоматически при обращении с маркетплейса.
Статусы: "Новый", "В работе", "Сделка", "Отказ".

РЕФЕРАЛЬНАЯ ПРОГРАММА:
В разделе "Рефералы" найди реферальную ссылку, поделись с коллегами. 5 уровней реферальной программы.

Если нужен живой менеджер — скажи пользователю написать "нужен человек".
Отвечай только на вопросы о платформе Кабинет-24. Отвечай кратко на русском языке."""


def handler(event: dict, context) -> dict:
    """ИИ-помощник платформы Кабинет-24 на базе OpenRouter"""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
        "Content-Type": "application/json"
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    messages = body.get("messages", [])

    if not messages:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "messages required"}, ensure_ascii=False)
        }

    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    print(f"[DEBUG] Key length: {len(api_key)}, starts with: {api_key[:10] if api_key else 'EMPTY'}")

    payload = {
        "model": "google/gemma-3-27b-it:free",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT_RU},
            *messages
        ],
        "max_tokens": 500,
        "temperature": 0.7
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        json=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        timeout=25
    )

    result = response.json()
    print(f"[DEBUG] OpenRouter status: {response.status_code}, keys: {list(result.keys())}")

    try:
        reply = result["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as e:
        print(f"[ERROR] OpenRouter error: {e}, response: {result}")
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": json.dumps({
                "reply": "Извини, ИИ-помощник временно недоступен. Попробуй позже или обратись в поддержку.",
            }, ensure_ascii=False)
        }

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({"reply": reply}, ensure_ascii=False)
    }