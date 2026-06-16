"""
Рейтинг агентов платформы Кабинет-24.
Формула очков:
- Реферал: +10
- Закрытая сделка: +50
- Активное объявление: +5
- Лид в CRM: +3
- Месяц на платформе: +1
Профиль (каждый пункт +5):
  фото, bio, телефон, специализация, город, опыт, telegram, vk/max/сайт
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
    if ref_count >= 100: return "Лидер"
    if ref_count >= 30:  return "Амбасадор"
    if ref_count >= 10:  return "Бизнес"
    if ref_count >= 3:   return "Партнёр"
    if ref_count >= 1:   return "Друг"
    return "Базовый"

def get_activity_label(last_login_at) -> str:
    if not last_login_at:
        return "Неактивен"
    now = datetime.now(timezone.utc)
    if last_login_at.tzinfo is None:
        last_login_at = last_login_at.replace(tzinfo=timezone.utc)
    days = (now - last_login_at).days
    if days <= 7:  return "Активен"
    if days <= 30: return "Был недавно"
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
            u.experience,
            u.telegram_username,
            u.vk_username,
            u.max_username,
            u.website,
            u.status,
            u.created_at,
            u.last_login_at,
            u.referral_level,
            COUNT(DISTINCT r.id) AS ref_count,
            COUNT(DISTINCT CASE WHEN jd.status = 'Успешна' THEN jd.id END) AS deal_count,
            COUNT(DISTINCT CASE WHEN o.status IN ('active', 'Активен') THEN o.id END) AS active_listings,
            COUNT(DISTINCT l.id) AS lead_count
        FROM users u
        LEFT JOIN referrals r ON r.referrer_id = u.id
        LEFT JOIN joint_deals jd ON (jd.initiator_id = u.id OR jd.partner_id = u.id)
        LEFT JOIN objects o ON o.user_id = u.id
        LEFT JOIN leads l ON l.owner_id = u.id
        WHERE u.status IN ('broker', 'agency')
          AND u.name NOT ILIKE '[удал%'
        GROUP BY u.id
    """)

    rows = cur.fetchall()
    cols = [
        "id","name","first_name","last_name","avatar_url","city","specializations",
        "bio","phone","experience","telegram_username","vk_username","max_username","website",
        "status","created_at","last_login_at","referral_level",
        "ref_count","deal_count","active_listings","lead_count"
    ]

    agents = []
    now = datetime.now(timezone.utc)

    for row in rows:
        a = dict(zip(cols, row))

        # Стаж в месяцах
        created = a["created_at"]
        if created and created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        months = max(0, int((now - created).days / 30)) if created else 0

        # Заполненность профиля (каждый пункт +5)
        profile_items = {
            "avatar":         bool(a["avatar_url"]),
            "bio":            bool(a["bio"] and len(a["bio"]) > 5),
            "phone":          bool(a["phone"] and len(a["phone"]) > 5),
            "specialization": bool(a["specializations"] and len(a["specializations"]) > 0),
            "city":           bool(a["city"] and len(a["city"]) > 1),
            "experience":     bool(a["experience"] and len(a["experience"]) > 1),
            "social":         bool(
                (a["telegram_username"] and len(a["telegram_username"]) > 1) or
                (a["vk_username"] and len(a["vk_username"]) > 1) or
                (a["max_username"] and len(a["max_username"]) > 1) or
                (a["website"] and len(a["website"]) > 1)
            ),
        }
        profile_score = sum(5 for v in profile_items.values() if v)
        profile_filled = sum(1 for v in profile_items.values() if v)
        profile_total = len(profile_items)

        # Итоговые очки
        points = (
            int(a["ref_count"]) * 10 +
            int(a["deal_count"]) * 50 +
            int(a["active_listings"]) * 5 +
            int(a["lead_count"]) * 3 +
            months * 1 +
            profile_score
        )

        # Приоритет: referral_level из суперадмина, иначе по рефералам
        admin_level = (a.get("referral_level") or "").strip()
        agent_status = admin_level if admin_level in STATUS_ORDER else get_agent_status(int(a["ref_count"]))
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
            "lead_count": int(a["lead_count"]),
            "months_on_platform": months,
            "profile_score": profile_score,
            "profile_filled": profile_filled,
            "profile_total": profile_total,
            "_status_order": STATUS_ORDER.get(agent_status, 0),
            "_inactive": 1 if activity == "Неактивен" else 0,
        })

    cur.close()
    conn.close()

    # Сортировка: статус DESC → неактивные в конец → очки DESC
    agents.sort(key=lambda x: (-x["_status_order"], x["_inactive"], -x["points"]))

    for i, a in enumerate(agents):
        a["rank"] = i + 1
        del a["_status_order"]
        del a["_inactive"]

    total = len(agents)

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
