"""Admin withdrawals handler — список всех заявок и смена статуса (только для супер-админа)."""
import json
from utils.db import query_one, query, execute, get_schema, escape
from utils.http import response, error

ENTITY_LABELS = {'ip': 'ИП', 'selfemployed': 'Самозанятый', 'ooo': 'ООО'}
STATUS_LABELS = {
    'pending':  'На рассмотрении',
    'approved': 'Одобрена',
    'paid':     'Выплачено',
    'rejected': 'Отклонена',
}
ALLOWED_STATUSES = {'pending', 'approved', 'paid', 'rejected'}


def _check_admin(actor_id: str, S: str) -> bool:
    row = query_one(f"SELECT is_superadmin FROM {S}users WHERE id = {escape(actor_id)}")
    return bool(row and row[0])


def handle(event: dict, origin: str = '*') -> dict:
    """Список заявок на вывод (GET) или смена статуса (POST) — только супер-админ."""
    method = event.get('httpMethod', 'GET').upper()
    params = event.get('queryStringParameters') or {}
    actor_id = str(params.get('actor_id', '')).strip()

    if not actor_id:
        return error(400, 'actor_id обязателен', origin)

    S = get_schema()

    if not _check_admin(actor_id, S):
        return error(403, 'Доступ только для супер-админа', origin)

    # GET — список всех заявок
    if method == 'GET':
        status_filter = params.get('status', '')
        where = f"AND wr.status = {escape(status_filter)}" if status_filter else ''

        rows = query(f"""
            SELECT wr.id, wr.user_id, u.name, u.email,
                   wr.entity_type, wr.full_name, wr.inn, wr.bank_name, wr.bik, wr.account,
                   wr.amount, wr.comment, wr.status, wr.created_at, wr.updated_at
            FROM {S}withdrawal_requests wr
            JOIN {S}users u ON u.id = wr.user_id
            {where}
            ORDER BY wr.created_at DESC
            LIMIT 200
        """)

        requests = []
        for row in rows:
            rid, uid, uname, uemail, entity_type, full_name, inn, bank_name, bik, account, \
                amount, comment, status, created_at, updated_at = row
            requests.append({
                'id': rid,
                'user_id': str(uid),
                'user_name': uname or '',
                'user_email': uemail or '',
                'entity_type': entity_type,
                'entity_label': ENTITY_LABELS.get(entity_type, entity_type),
                'full_name': full_name or '',
                'inn': inn or '',
                'bank_name': bank_name or '',
                'bik': bik or '',
                'account': account or '',
                'amount': float(amount) if amount is not None else None,
                'comment': comment or '',
                'status': status or 'pending',
                'status_label': STATUS_LABELS.get(status or 'pending', status),
                'created_at': created_at.isoformat() if created_at else None,
                'updated_at': updated_at.isoformat() if updated_at else None,
            })

        # Считаем суммарную статистику
        stats_row = query_one(f"""
            SELECT
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status = 'approved') AS approved,
                COUNT(*) FILTER (WHERE status = 'paid') AS paid,
                COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS total_paid
            FROM {S}withdrawal_requests
        """)
        stats = {}
        if stats_row:
            stats = {
                'pending': int(stats_row[0]),
                'approved': int(stats_row[1]),
                'paid': int(stats_row[2]),
                'total_paid': float(stats_row[3]),
            }

        return response(200, {'requests': requests, 'total': len(requests), 'stats': stats}, origin)

    # POST — смена статуса
    if method == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            return error(400, 'Некорректный JSON', origin)

        request_id = body.get('request_id')
        new_status = str(body.get('status', '')).strip()

        if not request_id:
            return error(400, 'request_id обязателен', origin)
        if new_status not in ALLOWED_STATUSES:
            return error(400, 'Неверный статус', origin)

        execute(f"""
            UPDATE {S}withdrawal_requests
            SET status = {escape(new_status)}, updated_at = NOW()
            WHERE id = {escape(int(request_id))}
        """)

        return response(200, {
            'ok': True,
            'request_id': request_id,
            'status': new_status,
            'status_label': STATUS_LABELS[new_status],
        }, origin)

    return error(405, 'Method not allowed', origin)
