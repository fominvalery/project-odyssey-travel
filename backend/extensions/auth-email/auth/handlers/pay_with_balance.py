"""Оплата тарифа Клуб реферальными баллами."""
import json
from datetime import datetime, timedelta, timezone
from utils.db import query_one, get_schema, escape, execute, execute_returning
from utils.http import response, error

PLANS = {
    1:  990,
    3:  2673,
    6:  5167,
    12: 10000,
}

MONTHS_LABEL = {1: '1 месяц', 3: '3 месяца', 6: '6 месяцев', 12: '12 месяцев'}


def handle(event: dict, origin: str = '*') -> dict:
    """Списать баллы с реферального баланса и продлить подписку Клуб."""
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return error(400, 'Некорректный JSON', origin)

    user_id = str(body.get('user_id', '')).strip()
    months = int(body.get('months', 1))

    if not user_id:
        return error(400, 'user_id обязателен', origin)
    if months not in PLANS:
        return error(400, 'Некорректный период. Допустимо: 1, 3, 6, 12', origin)

    price = PLANS[months]
    S = get_schema()

    # Считаем баланс: заработано - выведено - списано на подписку
    earned_row = query_one(f"""
        SELECT COALESCE(SUM(amount), 0)
        FROM {S}referral_bonuses
        WHERE referrer_id = {escape(user_id)} AND amount > 0
    """)
    earned = float(earned_row[0]) if earned_row else 0.0

    paid_row = query_one(f"""
        SELECT COALESCE(SUM(amount), 0)
        FROM {S}withdrawal_requests
        WHERE user_id = {escape(user_id)} AND status = 'paid'
    """)
    paid_out = float(paid_row[0]) if paid_row else 0.0

    spent_row = query_one(f"""
        SELECT COALESCE(SUM(ABS(amount)), 0)
        FROM {S}referral_bonuses
        WHERE referrer_id = {escape(user_id)} AND bonus_type = 'subscription_payment'
    """)
    spent = float(spent_row[0]) if spent_row else 0.0

    balance = earned - paid_out - spent

    if balance < price:
        return error(400, f'Недостаточно баллов. Баланс: {balance:.0f} ₽, нужно: {price} ₽', origin)

    # Получаем текущую дату подписки
    user_row = query_one(f"""
        SELECT subscription_end_at FROM {S}users WHERE id = {escape(user_id)}
    """)
    existing_end = user_row[0] if user_row and user_row[0] else None

    now_dt = datetime.now(timezone.utc)
    if existing_end:
        if existing_end.tzinfo is None:
            existing_end = existing_end.replace(tzinfo=timezone.utc)
        base = existing_end if existing_end > now_dt else now_dt
    else:
        base = now_dt
    new_end = base + timedelta(days=months * 30)
    grace_end = new_end + timedelta(days=3)

    label = MONTHS_LABEL[months]

    # Списываем баллы (отрицательная запись)
    execute_returning(f"""
        INSERT INTO {S}referral_bonuses
            (referrer_id, referred_id, bonus_type, amount, description)
        VALUES
            ({escape(user_id)}, {escape(user_id)}, 'subscription_payment',
             -{price}, {escape(f'Оплата тарифа Клуб — {label}')})
        RETURNING id
    """)

    # Продлеваем подписку
    execute(f"""
        UPDATE {S}users
        SET plan = 'pro', status = 'broker',
            subscription_end_at = '{new_end.isoformat()}',
            grace_period_end_at = '{grace_end.isoformat()}',
            updated_at = NOW()
        WHERE id = {escape(user_id)} AND is_superadmin = false
    """)

    # Уведомление в колокольчик
    execute(f"""
        INSERT INTO {S}notifications (user_id, type, title, body)
        VALUES ({escape(user_id)}, 'payment',
                'Тариф Клуб продлён',
                {escape(f'Подписка продлена на {label}. Списано {price} ₽ с реферального баланса.')})
    """)

    return response(200, {
        'ok': True,
        'months': months,
        'price': price,
        'new_balance': round(balance - price, 2),
        'subscription_end_at': new_end.isoformat(),
    }, origin)
