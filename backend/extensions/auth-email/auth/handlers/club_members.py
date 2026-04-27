"""Club members handler — список участников Клуба (broker/agency)."""
from utils.db import query, get_schema, escape
from utils.http import response, error


def handle(event: dict, origin: str = '*') -> dict:
    """Вернуть список участников Клуба для раздела Клуб."""
    params = event.get('queryStringParameters') or {}
    requester_id = str(params.get('user_id', '')).strip()
    city_filter = str(params.get('city', '')).strip()
    spec_filter = str(params.get('specialization', '')).strip()
    exp_filter = str(params.get('experience', '')).strip()

    if not requester_id:
        return error(400, 'user_id обязателен', origin)

    S = get_schema()

    from utils.db import query_one
    row = query_one(f"SELECT status, is_superadmin FROM {S}users WHERE id = {escape(requester_id)}")
    if not row:
        return error(404, 'Пользователь не найден', origin)

    req_status, is_superadmin = row

    # Проверяем членство в агентстве (сотрудники агентства тоже имеют доступ)
    is_agency_member = False
    if req_status not in ('broker', 'agency') and not is_superadmin:
        member_row = query_one(
            f"SELECT 1 FROM {S}org_memberships WHERE user_id = {escape(requester_id)} AND status = 'active' LIMIT 1"
        )
        if member_row:
            is_agency_member = True
        else:
            return error(403, 'Только участники Клуба', origin)

    extra_filters = []
    if city_filter:
        extra_filters.append(f"u.city ILIKE {escape('%' + city_filter + '%')}")
    if spec_filter:
        extra_filters.append(f"{escape(spec_filter)} = ANY(u.specializations)")
    if exp_filter:
        extra_filters.append(f"u.experience = {escape(exp_filter)}")

    extra_sql = (" AND " + " AND ".join(extra_filters)) if extra_filters else ""

    rows = query(f"""
        SELECT DISTINCT u.id, u.name, u.first_name, u.last_name, u.middle_name,
               u.company, u.city, u.status, u.avatar_url,
               u.specializations, u.bio, u.experience
        FROM {S}users u
        WHERE (
            u.status IN ('broker', 'agency')
            OR EXISTS (
                SELECT 1 FROM {S}org_memberships om
                WHERE om.user_id = u.id AND om.status = 'active'
            )
        )
        {extra_sql}
        ORDER BY u.updated_at DESC NULLS LAST
        LIMIT 200
    """)

    members = []
    for r in rows:
        (uid, name, first_name, last_name, middle_name,
         company, city, status, avatar_url,
         specializations, bio, experience) = r

        display_name = ' '.join(filter(None, [last_name, first_name, middle_name])) or name or ''

        members.append({
            'id': str(uid),
            'name': display_name,
            'company': company or '',
            'city': city or '',
            'status': status or 'broker',
            'avatar_url': avatar_url,
            'specializations': list(specializations) if specializations else [],
            'bio': bio or '',
            'experience': experience or '',
        })

    return response(200, {'members': members}, origin)