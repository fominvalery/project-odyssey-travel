"""Withdrawal history handler — история заявок на вывод пользователя."""
from utils.db import query, get_schema, escape
from utils.http import response, error

ENTITY_LABELS = {'ip': 'ИП', 'selfemployed': 'Самозанятый', 'ooo': 'ООО'}
STATUS_LABELS = {'pending': 'На рассмотрении', 'approved': 'Одобрена', 'paid': 'Выплачено', 'rejected': 'Отклонена'}


def handle(event: dict, origin: str = '*') -> dict:
    """Вернуть историю заявок на вывод для пользователя."""
    params = event.get('queryStringParameters') or {}
    user_id = str(params.get('user_id', '')).strip()

    if not user_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()

    rows = query(f"""
        SELECT id, entity_type, full_name, inn, bank_name, bik, account,
               amount, comment, status, created_at
        FROM {S}withdrawal_requests
        WHERE user_id = {escape(user_id)}
        ORDER BY created_at DESC
        LIMIT 50
    """)

    requests = []
    for row in rows:
        rid, entity_type, full_name, inn, bank_name, bik, account, \
            amount, comment, status, created_at = row
        requests.append({
            'id': rid,
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
        })

    return response(200, {'requests': requests, 'total': len(requests)}, origin)
