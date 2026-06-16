"""
Рейтинг агентов платформы Кабинет-24.
Считает очки и позицию каждого агента по формуле:
- Реферал: +10 очков
- Закрытая сделка: +50 очков
- Активное объявление: +5 очков
- Месяц на платформе: +1 очко
- Фото: +10, Bio: +10, Телефон: +10, Специализация: +10
Сортировка: статус → активность → очки
"""
import os
import json
import psycopg2
from datetime import datetime, timezone

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}

STATUS_ORDER = {"Лидер": 5, "Амбасадор": 4, "Бизнес": 3, "Партнёр": 2, "Друг": 1, "Базовый": 0}

def get_agent_status(ref_count: int) -> str:
    if ref_count >= 100:
        return "Лидер"
    if ref_count >= 30:
        return "Амбасадор"
    if ref_count >= 10:
        return "Бизнес"
    if ref_count >= 3:
        return "Партнёр"
    if ref_count >= 1:
        return "Друг"
    return "Базовый"

def get_activity_label(last_login_at) -> str:
    if not last_login_at:
        return "Неактивен"
    now = datetime.now(timezone.utc)
    if last_login_at.tzinfo is None:
        last_login_at = last_login_at.replace(tzinfo=timezone.utc)
    days = (now - last_login_at).days
    if days <= 7:
        return "Активен"
    if days <= 30:
        return "Был недавно"
    return "Неактивен"

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    user_id = params.get("user_id", "")
    limit = int(params.get("limit", 50))
    offset = int(params.get("offset", 0))

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # Все активные брокеры (статус broker или agency)
    cur.execute("""
        SELECT
            u.id,
            u.name,
            u.first_name,
            u.last_name,
            u.avatar_url,
            u.city,
            u.specializations,
            u.bio,
            u.phone,
            u.status,
            u.created_at,
            u.last_login_at,
            COUNT(DISTINCT r.id) AS ref_count,
            COUNT(DISTINCT CASE WHEN (jd.status = 'Успешна') THEN jd.id END) AS deal_count,
            COUNT(DISTINCT CASE WHEN o.status = 'active' THEN o.id END) AS active_listings
        FROM users u
        LEFT JOIN referrals r ON r.referrer_id = u.id
        LEFT JOIN joint_deals jd ON (jd.initiator_id = u.id OR jd.partner_id = u.id)
        LEFT JOIN objects o ON o.user_id = u.id
        WHERE u.status IN ('broker', 'agency')
        GROUP BY u.id
    """)

    rows = cur.fetchall()
    cols = ["id","name","first_name","last_name","avatar_url","city","specializations",
            "bio","phone","status","created_at","last_login_at","ref_count","deal_count","active_listings"]

    agents = []
    now = datetime.now(timezone.utc)

    for row in rows:
        a = dict(zip(cols, row))

        # Стаж в месяцах
        created = a["created_at"]
        if created and created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        months = max(0, int((now - created).days / 30)) if created else 0

        # Заполненность профиля
        profile_score = 0
        if a["avatar_url"]: profile_score += 10
        if a["bio"] and len(a["bio"]) > 5: profile_score += 10
        if a["phone"] and len(a["phone"]) > 5: profile_score += 10
        if a["specializations"] and len(a["specializations"]) > 0: profile_score += 10

        # Итоговые очки
        points = (
            int(a["ref_count"]) * 10 +
            int(a["deal_count"]) * 50 +
            int(a["active_listings"]) * 5 +
            months * 1 +
            profile_score
        )

        agent_status = get_agent_status(int(a["ref_count"]))
        activity = get_activity_label(a["last_login_at"])

        agents.append({
            "id": str(a["id"]),
            "name": a["name"] or f"{a['first_name']} {a['last_name']}".strip(),
            "avatar_url": a["avatar_url"],
            "city": a["city"],
            "specializations": a["specializations"] or [],
            "bio": a["bio"],
            "status": a["status"],
            "agent_status": agent_status,
            "activity": activity,
            "points": points,
            "ref_count": int(a["ref_count"]),
            "deal_count": int(a["deal_count"]),
            "active_listings": int(a["active_listings"]),
            "months_on_platform": months,
            "profile_score": profile_score,
            "_status_order": STATUS_ORDER.get(agent_status, 0),
            "_inactive": 1 if activity == "Неактивен" else 0,
        })

    cur.close()
    conn.close()

    # Сортировка: статус DESC → неактивные в конец → очки DESC
    agents.sort(key=lambda x: (-x["_status_order"], x["_inactive"], -x["points"]))

    # Проставляем позиции
    for i, a in enumerate(agents):
        a["rank"] = i + 1
        del a["_status_order"]
        del a["_inactive"]

    total = len(agents)

    # Позиция текущего пользователя
    my_rank = None
    my_data = None
    if user_id:
        for a in agents:
            if a["id"] == user_id:
                my_rank = a["rank"]
                my_data = a
                break

    page = agents[offset:offset + limit]

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({
            "agents": page,
            "total": total,
            "my_rank": my_rank,
            "my_data": my_data,
        }, ensure_ascii=False, default=str),
    }
