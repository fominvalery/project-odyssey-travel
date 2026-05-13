"""Оплата тарифа Клуб реферальными баллами.

Защищено от race condition — баланс блокируется (SELECT FOR UPDATE)
внутри транзакции, чтобы параллельные запросы не могли потратить одни и те же баллы.
"""
import json
from datetime import datetime, timedelta, timezone
from utils.db import get_connection, get_schema, escape
from utils.balance import calculate_balance_locked
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

    conn = get_connection()
    try:
        cur = conn.cursor()

        # Атомарная проверка баланса с блокировкой
        balance = calculate_balance_locked(cur, user_id)

        if balance < price:
            conn.rollback()
            return error(400, f'Недостаточно баллов. Доступно: {balance:.0f} ₽, нужно: {price} ₽', origin)

        # Получаем текущую дату подписки (тоже под локом — пользователь не должен меняться)
        cur.execute(
            f"SELECT subscription_end_at, is_superadmin FROM {S}users WHERE id = %s FOR UPDATE",
            (user_id,)
        )
        user_row = cur.fetchone()
        if not user_row:
            conn.rollback()
            return error(404, 'Пользователь не найден', origin)

        existing_end, is_superadmin = user_row

        if is_superadmin:
            conn.rollback()
            return error(400, 'Супер-админу не нужно продлевать подписку', origin)

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
        cur.execute(
            f"INSERT INTO {S}referral_bonuses "
            f"(referrer_id, referred_id, bonus_type, amount, description) "
            f"VALUES (%s, %s, 'subscription_payment', %s, %s) RETURNING id",
            (user_id, user_id, -price, f'Оплата тарифа Клуб — {label}')
        )
        cur.fetchone()

        # Продлеваем подписку
        cur.execute(
            f"UPDATE {S}users SET plan = 'pro', status = 'broker', "
            f"subscription_end_at = %s, grace_period_end_at = %s, updated_at = NOW() "
            f"WHERE id = %s AND is_superadmin = false",
            (new_end.isoformat(), grace_end.isoformat(), user_id)
        )

        # Уведомление
        cur.execute(
            f"INSERT INTO {S}notifications (user_id, type, title, body) "
            f"VALUES (%s, 'payment', 'Тариф Клуб продлён', %s)",
            (user_id, f'Подписка продлена на {label}. Списано {price} ₽ с реферального баланса.')
        )

        conn.commit()

        return response(200, {
            'ok': True,
            'months': months,
            'price': price,
            'new_balance': round(balance - price, 2),
            'subscription_end_at': new_end.isoformat(),
        }, origin)

    except Exception as e:
        conn.rollback()
        return error(500, f'Ошибка оплаты: {str(e)[:200]}', origin)
    finally:
        conn.close()
