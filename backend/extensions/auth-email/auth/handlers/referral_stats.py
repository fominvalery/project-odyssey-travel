"""Referral stats handler — реальная статистика рефералов пользователя."""
from utils.db import query_one, query, get_schema, escape
from utils.http import response, error


LEVEL_THRESHOLDS = [
    (100, "Адвокат",   5, "rose",    10, 2),
    (30,  "Амбасадор", 4, "amber",   10, 0),
    (10,  "Бизнес",    3, "violet",   7, 0),
    (3,   "Партнёр",   2, "emerald",  7, 0),
    (1,   "Друг",      1, "blue",     5, 0),
]

# Маппинг имени уровня → параметры (для ручного override супер-админом)
LEVEL_BY_NAME = {name: (level, color, pct1, pct2) for _, name, level, color, pct1, pct2 in LEVEL_THRESHOLDS}


def get_level(count: int, override: str | None) -> dict:
    # Если супер-админ вручную задал уровень — берём его параметры, игнорируя count
    if override and override in LEVEL_BY_NAME:
        level, color, pct1, pct2 = LEVEL_BY_NAME[override]
        return {
            "name": override,
            "level": level,
            "color": color,
            "commission1": pct1,
            "commission2": pct2,
            "withdrawal": level >= 3,
        }

    # Иначе — считаем по количеству рефералов
    for min_refs, name, level, color, pct1, pct2 in LEVEL_THRESHOLDS:
        if count >= min_refs:
            return {
                "name": name,
                "level": level,
                "color": color,
                "commission1": pct1,
                "commission2": pct2,
                "withdrawal": level >= 3,
            }

    return {
        "name": "—",
        "level": 0,
        "color": "gray",
        "commission1": 0,
        "commission2": 0,
        "withdrawal": False,
    }


def handle(event: dict, origin: str = '*') -> dict:
    """Вернуть статистику рефералов для пользователя."""
    params = event.get('queryStringParameters') or {}
    user_id = str(params.get('user_id', '')).strip()

    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()

    user = query_one(f"""
        SELECT id, referral_level FROM {S}users WHERE id = {escape(user_id)}
    """)
    if not user:
        return error(404, 'Пользователь не найден', origin)

    level_override = user[1]

    # Считаем рефералов 1-й линии
    referrals_row = query_one(f"""
        SELECT COUNT(*) FROM {S}referrals WHERE referrer_id = {escape(user_id)}
    """)
    referral_count = int(referrals_row[0]) if referrals_row else 0

    # Рефералы за последние 7 дней
    week_row = query_one(f"""
        SELECT COUNT(*) FROM {S}referrals
        WHERE referrer_id = {escape(user_id)}
          AND created_at >= NOW() - INTERVAL '7 days'
    """)
    week_count = int(week_row[0]) if week_row else 0

    # Рефералы 2-й линии (рефералы рефералов)
    line2_row = query_one(f"""
        SELECT COUNT(*) FROM {S}referrals r2
        JOIN {S}referrals r1 ON r2.referrer_id = r1.referred_id
        WHERE r1.referrer_id = {escape(user_id)}
    """)
    line2_count = int(line2_row[0]) if line2_row else 0

    # Список рефералов с именами
    referred_rows = query(f"""
        SELECT u.id, u.name, u.email, u.status, r.created_at
        FROM {S}referrals r
        JOIN {S}users u ON u.id = r.referred_id
        WHERE r.referrer_id = {escape(user_id)}
        ORDER BY r.created_at DESC
        LIMIT 50
    """)
    referred_users = [
        {
            "id": str(row[0]),
            "name": row[1] or "",
            "email": row[2] or "",
            "status": row[3] or "basic",
            "joined_at": row[4].isoformat() if row[4] else None,
        }
        for row in referred_rows
    ]

    level = get_level(referral_count, level_override)

    return response(200, {
        "referral_count": referral_count,
        "referral_count_week": week_count,
        "line2_count": line2_count,
        "level": level,
        "referred_users": referred_users,
        "ref_code": str(user[0])[:8],
    }, origin)