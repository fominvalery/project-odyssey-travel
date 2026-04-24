"""YooKassa webhook handler for payment notifications."""
import json
import os
import base64
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2

# =============================================================================
# CONSTANTS
# =============================================================================

HEADERS = {
    'Content-Type': 'application/json'
}

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"


# =============================================================================
# SECURITY
# =============================================================================

def verify_payment_via_api(payment_id: str, shop_id: str, secret_key: str) -> dict | None:
    """Verify payment status via YooKassa API.

    YooKassa doesn't use webhook signatures. The recommended approach is to
    verify payment status by making a GET request to the API.
    """
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()

    request = Request(
        f"{YOOKASSA_API_URL}/{payment_id}",
        headers={
            'Authorization': f'Basic {auth_bytes}',
            'Content-Type': 'application/json'
        },
        method='GET'
    )

    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode())
    except (HTTPError, Exception):
        return None


# =============================================================================
# DATABASE
# =============================================================================

def get_connection():
    """Get database connection."""
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    """Get database schema prefix."""
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


# =============================================================================
# HANDLER
# =============================================================================

def handler(event, context):
    """Handle YooKassa webhook notification."""
    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    # Parse body
    body = event.get('body', '{}')
    if event.get('isBase64Encoded'):
        body = base64.b64decode(body).decode('utf-8')

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Invalid JSON'})
        }

    # Extract payment info
    event_type = data.get('event', '')
    payment_object = data.get('object', {})
    payment_id = payment_object.get('id', '')
    metadata = payment_object.get('metadata', {})

    if not payment_id:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Missing payment id'})
        }

    # Security: Verify payment via API (most reliable)
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')

    if shop_id and secret_key:
        verified_payment = verify_payment_via_api(payment_id, shop_id, secret_key)
        if not verified_payment:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Payment verification failed'})
            }
        # Use verified status instead of webhook data
        payment_status = verified_payment.get('status', '')
    else:
        # Fallback to webhook data (less secure, only if credentials missing)
        payment_status = payment_object.get('status', '')

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()
        now = datetime.utcnow().isoformat()

        # Find order by payment_id
        cur.execute(f"""
            SELECT id, status FROM {S}orders
            WHERE yookassa_payment_id = %s
        """, (payment_id,))

        row = cur.fetchone()

        if not row:
            # Try to find by order_id from metadata
            order_id_meta = metadata.get('order_id')
            if order_id_meta:
                cur.execute(f"""
                    SELECT id, status FROM {S}orders WHERE id = %s
                """, (int(order_id_meta),))
                row = cur.fetchone()

        if not row:
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Order not found'})
            }

        order_id, current_status = row

        # Update based on verified payment status
        if payment_status == 'succeeded':
            if current_status != 'paid':
                cur.execute(f"""
                    UPDATE {S}orders
                    SET status = 'paid', paid_at = %s, updated_at = %s
                    WHERE id = %s
                """, (now, now, order_id))

                # Пополняем listings_extra если это заказ на объявления
                cur.execute(f"""
                    SELECT user_id, order_type FROM {S}orders WHERE id = %s
                """, (order_id,))
                order_row = cur.fetchone()
                if order_row:
                    order_user_id, order_type = order_row
                    if order_type == 'listings' and order_user_id:
                        # Считаем количество объявлений из order_items
                        cur.execute(f"""
                            SELECT COALESCE(SUM(quantity), 0) FROM {S}order_items WHERE order_id = %s
                        """, (order_id,))
                        qty_row = cur.fetchone()
                        qty = int(qty_row[0]) if qty_row else 0
                        if qty > 0:
                            cur.execute(f"""
                                UPDATE {S}users
                                SET listings_extra = listings_extra + %s
                                WHERE id = %s
                            """, (qty, order_user_id))
                    elif order_type == 'subscription' and order_user_id:
                        # Активируем тариф Клуб: plan = 'pro', status = 'broker'
                        # Если подписка уже активна — продлеваем от текущего end_at, иначе от now
                        cur.execute(f"""
                            SELECT subscription_end_at FROM {S}users WHERE id = %s
                        """, (order_user_id,))
                        sub_row = cur.fetchone()
                        existing_end = sub_row[0] if sub_row and sub_row[0] else None
                        now_dt = datetime.utcnow()
                        if existing_end and existing_end > now_dt:
                            new_end = existing_end + timedelta(days=30)
                        else:
                            new_end = now_dt + timedelta(days=30)
                        grace_end = new_end + timedelta(days=3)
                        cur.execute(f"""
                            UPDATE {S}users
                            SET plan = 'pro', status = 'broker', updated_at = %s,
                                subscription_end_at = %s, grace_period_end_at = %s
                            WHERE id = %s AND is_superadmin = false
                        """, (now, new_end.isoformat(), grace_end.isoformat(), order_user_id))

                        # Начисляем реферальную комиссию рефереру
                        try:
                            # Получаем сумму заказа
                            cur.execute(f"""
                                SELECT amount FROM {S}orders WHERE id = %s
                            """, (order_id,))
                            amount_row = cur.fetchone()
                            payment_amount = float(amount_row[0]) if amount_row else 0.0

                            if payment_amount > 0:
                                # Ищем реферера (1-я линия)
                                cur.execute(f"""
                                    SELECT referrer_id FROM {S}referrals
                                    WHERE referred_id = %s
                                """, (order_user_id,))
                                ref_row = cur.fetchone()

                                if ref_row:
                                    referrer_id = ref_row[0]

                                    # Получаем уровень реферера
                                    cur.execute(f"""
                                        SELECT referral_level FROM {S}users WHERE id = %s
                                    """, (referrer_id,))
                                    lvl_row = cur.fetchone()
                                    level_override = lvl_row[0] if lvl_row else None

                                    # Считаем количество рефералов для определения уровня
                                    cur.execute(f"""
                                        SELECT COUNT(*) FROM {S}referrals WHERE referrer_id = %s
                                    """, (referrer_id,))
                                    cnt_row = cur.fetchone()
                                    ref_count = int(cnt_row[0]) if cnt_row else 0

                                    # Определяем % комиссии
                                    LEVEL_MAP = {
                                        'Адвокат': (10, 2), 'Амбасадор': (10, 0),
                                        'Бизнес': (7, 0), 'Партнёр': (7, 0), 'Друг': (5, 0),
                                    }
                                    if level_override and level_override in LEVEL_MAP:
                                        pct1, pct2 = LEVEL_MAP[level_override]
                                    elif ref_count >= 100:
                                        pct1, pct2 = 10, 2
                                    elif ref_count >= 30:
                                        pct1, pct2 = 10, 0
                                    elif ref_count >= 10:
                                        pct1, pct2 = 7, 0
                                    elif ref_count >= 3:
                                        pct1, pct2 = 7, 0
                                    else:
                                        pct1, pct2 = 5, 0

                                    commission1 = round(payment_amount * pct1 / 100, 2)

                                    # Записываем комиссию 1-й линии
                                    if commission1 > 0:
                                        cur.execute(f"""
                                            INSERT INTO {S}referral_bonuses
                                                (referrer_id, referred_id, bonus_type, amount, description, order_id)
                                            VALUES (%s, %s, %s, %s, %s, %s)
                                        """, (referrer_id, order_user_id, 'commission_line1', commission1,
                                              f'Комиссия {pct1}% за оплату тарифа ({payment_amount} ₽)', order_id))

                                    # Комиссия 2-й линии (для Адвоката)
                                    if pct2 > 0:
                                        cur.execute(f"""
                                            SELECT referrer_id FROM {S}referrals WHERE referred_id = %s
                                        """, (referrer_id,))
                                        ref2_row = cur.fetchone()
                                        if ref2_row:
                                            referrer2_id = ref2_row[0]
                                            commission2 = round(payment_amount * pct2 / 100, 2)
                                            if commission2 > 0:
                                                cur.execute(f"""
                                                    INSERT INTO {S}referral_bonuses
                                                        (referrer_id, referred_id, bonus_type, amount, description, order_id)
                                                    VALUES (%s, %s, %s, %s, %s, %s)
                                                """, (referrer2_id, order_user_id, 'commission_line2', commission2,
                                                      f'Комиссия 2-й линии {pct2}% за оплату тарифа ({payment_amount} ₽)', order_id))
                        except Exception:
                            pass  # комиссия не критична

                conn.commit()

        elif payment_status == 'canceled':
            if current_status not in ('paid', 'canceled'):
                cur.execute(f"""
                    UPDATE {S}orders
                    SET status = 'canceled', updated_at = %s
                    WHERE id = %s
                """, (now, order_id))
                conn.commit()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({'status': 'ok'})
        }

    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Internal error'})
        }
    finally:
        conn.close()