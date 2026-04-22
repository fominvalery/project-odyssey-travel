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

    # Иначе — считаем по количеству рефералов (минимум — Друг)
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

    # Базовый уровень для всех — Друг
    return {
        "name": "Друг",
        "level": 1,
        "color": "blue",
        "commission1": 5,
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
    ref_code = str(user[0])[:8]

    # Переходы по реферальной ссылке (всего + за 7 дней)
    clicks_row = query_one(f"""
        SELECT COUNT(*), COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')
        FROM {S}referral_clicks WHERE ref_code = {escape(ref_code)}
    """)
    clicks_total = int(clicks_row[0]) if clicks_row else 0
    clicks_week = int(clicks_row[1]) if clicks_row else 0

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

    # Рефералы у которых создан хотя бы 1 объект (активированы = вступили в работу)
    activated_row = query_one(f"""
        SELECT COUNT(DISTINCT rb.referred_id) FROM {S}referral_bonuses rb
        WHERE rb.referrer_id = {escape(user_id)} AND rb.bonus_type = 'first_object'
    """)
    activated_count = int(activated_row[0]) if activated_row else 0

    # Рефералы, с которых получена комиссия (оплатили тариф)
    paid_row = query_one(f"""
        SELECT COUNT(DISTINCT referred_id) FROM {S}referral_bonuses
        WHERE referrer_id = {escape(user_id)} AND bonus_type = 'commission_line1'
    """)
    paid_count = int(paid_row[0]) if paid_row else 0

    # Конверсия (оплатили / зарегистрировались * 100)
    conversion = round(paid_count / referral_count * 100) if referral_count > 0 else 0

    # Сумма платежей рефералов 1-й линии (succeeded заказы)
    line1_sum_row = query_one(f"""
        SELECT COALESCE(SUM(o.amount), 0)
        FROM {S}referrals r
        JOIN {S}orders o ON CAST(o.user_id AS TEXT) = CAST(r.referred_id AS TEXT)
        WHERE r.referrer_id = {escape(user_id)} AND o.status = 'succeeded'
    """)
    line1_payments = float(line1_sum_row[0]) if line1_sum_row else 0.0

    # Сумма платежей рефералов 2-й линии
    line2_sum_row = query_one(f"""
        SELECT COALESCE(SUM(o.amount), 0)
        FROM {S}referrals r1
        JOIN {S}referrals r2 ON r2.referrer_id = r1.referred_id
        JOIN {S}orders o ON CAST(o.user_id AS TEXT) = CAST(r2.referred_id AS TEXT)
        WHERE r1.referrer_id = {escape(user_id)} AND o.status = 'succeeded'
    """)
    line2_payments = float(line2_sum_row[0]) if line2_sum_row else 0.0

    # Начисления комиссии (считаем после определения уровня)
    level = get_level(referral_count, level_override)
    pct1 = level["commission1"] / 100
    pct2 = level["commission2"] / 100
    earned_line1 = round(line1_payments * pct1, 2)
    earned_line2 = round(line2_payments * pct2, 2)
    earned_total = round(earned_line1 + earned_line2, 2)

    # Бонусы за первые объекты рефералов
    bonuses_row = query_one(f"""
        SELECT COALESCE(SUM(amount), 0), COUNT(*) FROM {S}referral_bonuses
        WHERE referrer_id = {escape(user_id)}
    """)
    bonus_total = round(float(bonuses_row[0]) if bonuses_row else 0.0, 2)
    bonus_count = int(bonuses_row[1]) if bonuses_row else 0

    # Список начисленных бонусов
    bonus_rows = query(f"""
        SELECT rb.id, rb.bonus_type, rb.amount, rb.description, rb.created_at,
               u.name, u.email
        FROM {S}referral_bonuses rb
        JOIN {S}users u ON u.id = rb.referred_id
        WHERE rb.referrer_id = {escape(user_id)}
        ORDER BY rb.created_at DESC
        LIMIT 50
    """)
    bonuses = [
        {
            "id": row[0],
            "bonus_type": row[1],
            "amount": float(row[2]),
            "description": row[3] or "",
            "created_at": row[4].isoformat() if row[4] else None,
            "referred_name": row[5] or "",
            "referred_email": row[6] or "",
        }
        for row in bonus_rows
    ]

    # Уже выплачено (сумма заявок со статусом paid)
    paid_out_row = query_one(f"""
        SELECT COALESCE(SUM(amount), 0) FROM {S}withdrawal_requests
        WHERE user_id = {escape(user_id)} AND status = 'paid'
    """)
    paid_out = round(float(paid_out_row[0]) if paid_out_row else 0.0, 2)
    # Баланс = комиссии + бонусы − выплачено
    balance = round(max(earned_total + bonus_total - paid_out, 0), 2)

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

    return response(200, {
        "referral_count": referral_count,
        "referral_count_week": week_count,
        "line2_count": line2_count,
        "activated_count": activated_count,
        "paid_count": paid_count,
        "conversion": conversion,
        "earned_line1": earned_line1,
        "earned_line2": earned_line2,
        "earned_total": earned_total,
        "bonus_total": bonus_total,
        "bonus_count": bonus_count,
        "bonuses": bonuses,
        "paid_out": paid_out,
        "balance": balance,
        "line1_payments": line1_payments,
        "line2_payments": line2_payments,
        "clicks_total": clicks_total,
        "clicks_week": clicks_week,
        "level": level,
        "referred_users": referred_users,
        "ref_code": ref_code,
    }, origin)