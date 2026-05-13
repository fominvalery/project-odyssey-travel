"""Единый источник правды для расчёта реферального баланса.

ФОРМУЛА БАЛАНСА:
  balance = SUM(referral_bonuses.amount WHERE referrer_id = user)
          - SUM(withdrawal_requests.amount WHERE user_id = user AND status IN ('pending','approved','paid'))

referral_bonuses включает:
  + email_verified  (10₽)
  + first_object    (20₽)
  + commission_line1/2/3 (% от платежа реферала)
  - subscription_payment (отрицательное — оплата тарифа баллами)

withdrawal_requests учитывается ВКЛЮЧАЯ pending/approved (резерв) — чтобы пользователь
не мог дважды вывести/потратить одни и те же деньги.
"""
from utils.db import get_connection, get_schema, query_one, escape


WITHDRAWAL_RESERVED_STATUSES = ('pending', 'approved', 'paid')


def calculate_balance(user_id: str) -> dict:
    """Возвращает детализированный баланс пользователя.

    Returns:
        {
          'earned': float,          # все начисления (положительные записи)
          'spent_on_subscription': float,  # сумма списаний на тариф (положительная)
          'reserved_withdrawals': float,    # сумма заявок pending/approved
          'paid_out': float,        # фактически выплачено (status='paid')
          'available': float,       # доступно для трат/вывода
        }
    """
    S = get_schema()

    earned_row = query_one(f"""
        SELECT COALESCE(SUM(amount), 0)
        FROM {S}referral_bonuses
        WHERE referrer_id = {escape(user_id)} AND amount > 0
    """)
    earned = float(earned_row[0]) if earned_row else 0.0

    spent_row = query_one(f"""
        SELECT COALESCE(SUM(ABS(amount)), 0)
        FROM {S}referral_bonuses
        WHERE referrer_id = {escape(user_id)} AND amount < 0
    """)
    spent = float(spent_row[0]) if spent_row else 0.0

    reserved_row = query_one(f"""
        SELECT COALESCE(SUM(amount), 0)
        FROM {S}withdrawal_requests
        WHERE user_id = {escape(user_id)}
          AND status IN ('pending', 'approved', 'paid')
          AND amount IS NOT NULL
    """)
    reserved = float(reserved_row[0]) if reserved_row else 0.0

    paid_row = query_one(f"""
        SELECT COALESCE(SUM(amount), 0)
        FROM {S}withdrawal_requests
        WHERE user_id = {escape(user_id)} AND status = 'paid'
          AND amount IS NOT NULL
    """)
    paid_out = float(paid_row[0]) if paid_row else 0.0

    available = max(earned - spent - reserved, 0.0)

    return {
        'earned': round(earned, 2),
        'spent_on_subscription': round(spent, 2),
        'reserved_withdrawals': round(reserved, 2),
        'paid_out': round(paid_out, 2),
        'available': round(available, 2),
    }


def calculate_balance_locked(cur, user_id: str) -> float:
    """Считает доступный баланс ВНУТРИ транзакции с блокировкой строк.

    Используется в pay_with_balance и withdrawal_request — чтобы предотвратить
    race condition (двойная трата). Требует открытый cursor и активную транзакцию.

    Берёт SELECT FOR UPDATE на referral_bonuses и withdrawal_requests
    конкретного пользователя.
    """
    S = get_schema()

    # Lock all rows for this user — блокируем чтобы параллельный запрос ждал
    cur.execute(
        f"SELECT id FROM {S}referral_bonuses WHERE referrer_id = %s FOR UPDATE",
        (user_id,)
    )
    cur.fetchall()

    cur.execute(
        f"SELECT id FROM {S}withdrawal_requests WHERE user_id = %s "
        f"AND status IN ('pending','approved','paid') FOR UPDATE",
        (user_id,)
    )
    cur.fetchall()

    cur.execute(
        f"SELECT COALESCE(SUM(amount), 0) FROM {S}referral_bonuses "
        f"WHERE referrer_id = %s AND amount > 0",
        (user_id,)
    )
    earned = float(cur.fetchone()[0])

    cur.execute(
        f"SELECT COALESCE(SUM(ABS(amount)), 0) FROM {S}referral_bonuses "
        f"WHERE referrer_id = %s AND amount < 0",
        (user_id,)
    )
    spent = float(cur.fetchone()[0])

    cur.execute(
        f"SELECT COALESCE(SUM(amount), 0) FROM {S}withdrawal_requests "
        f"WHERE user_id = %s AND status IN ('pending','approved','paid') "
        f"AND amount IS NOT NULL",
        (user_id,)
    )
    reserved = float(cur.fetchone()[0])

    available = max(earned - spent - reserved, 0.0)
    return round(available, 2)
