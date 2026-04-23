import json
import os
import secrets
from datetime import datetime, timedelta, timezone
import psycopg2
import psycopg2.extras

ROLE_LEVEL = {
    'founder': 110,
    'director': 100,
    'rop': 80,
    'broker': 60,
    'manager': 40,
    'marketer': 40,
    'accountant': 40,
    'lawyer': 40,
    'mortgage_broker': 40,
}
ROLE_TITLES = {
    'founder': 'Учредитель',
    'director': 'Директор',
    'rop': 'Руководитель отдела продаж',
    'broker': 'Брокер',
    'manager': 'Менеджер',
    'marketer': 'Маркетолог',
    'accountant': 'Бухгалтер',
    'lawyer': 'Юрист',
    'mortgage_broker': 'Ипотечный брокер',
}

# Роли с правами управления (founder + director)
ADMIN_ROLES = ('founder', 'director')
INVITE_TTL_HOURS = 168  # 7 дней


def _cors(body, status=200):
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Org-Id',
            'Access-Control-Max-Age': '86400',
            'Content-Type': 'application/json',
        },
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def _conn():
    schema = os.environ['MAIN_DB_SCHEMA']
    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={schema}')
    return conn


def _user_id(event):
    headers = event.get('headers') or {}
    return headers.get('X-User-Id') or headers.get('x-user-id')


def _org_id(event):
    headers = event.get('headers') or {}
    return headers.get('X-Org-Id') or headers.get('x-org-id')


def _membership(cur, user_id, org_id):
    cur.execute(
        "SELECT id, role_code, department_id, status FROM org_memberships "
        "WHERE user_id=%s AND organization_id=%s AND status='active'",
        (user_id, org_id),
    )
    return cur.fetchone()


def _audit_safe(text):
    return str(text).replace("'", "''") if text else ''


# ── Organizations CRUD ─────────────────────────────────────────────────

def list_my_orgs(user_id):
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "SELECT o.id, o.name, o.logo_url, o.inn, o.description, "
            "m.role_code, m.department_id "
            "FROM organizations o "
            "JOIN org_memberships m ON m.organization_id=o.id "
            "WHERE m.user_id=%s AND m.status='active' "
            "ORDER BY o.created_at DESC",
            (user_id,),
        )
        rows = cur.fetchall()
        for r in rows:
            r['role_title'] = ROLE_TITLES.get(r['role_code'], r['role_code'])
        return _cors(rows)


def create_org(user_id, body):
    name = (body.get('name') or '').strip()
    if not name:
        return _cors({'error': 'Название обязательно'}, 400)
    inn = (body.get('inn') or '').strip() or None
    logo_url = (body.get('logo_url') or '').strip() or None
    description = (body.get('description') or '').strip()

    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "INSERT INTO organizations(name, inn, logo_url, admin_id, description) "
            "VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (name, inn, logo_url, user_id, description),
        )
        org_id = cur.fetchone()['id']
        cur.execute(
            "INSERT INTO org_memberships(user_id, organization_id, role_code) "
            "VALUES (%s,%s,'founder')",
            (user_id, org_id),
        )
        cur.execute("UPDATE users SET status='agency' WHERE id=%s", (user_id,))
        conn.commit()
        return _cors({
            'id': str(org_id),
            'name': name,
            'logo_url': logo_url,
            'inn': inn,
            'description': description,
            'role_code': 'founder',
            'role_title': ROLE_TITLES['founder'],
        }, 201)


def get_org(user_id, org_id):
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        cur.execute(
            "SELECT id, name, inn, logo_url, description, admin_id, created_at "
            "FROM organizations WHERE id=%s",
            (org_id,),
        )
        org = cur.fetchone()
        if not org:
            return _cors({'error': 'Не найдено'}, 404)
        org['my_role'] = m['role_code']
        org['my_role_title'] = ROLE_TITLES.get(m['role_code'], m['role_code'])
        org['my_department_id'] = m['department_id']
        return _cors(org)


def update_org(user_id, org_id, body):
    with _conn() as conn, conn.cursor() as cur:
        m = _membership(cur, user_id, org_id)
        if not m or m[1] not in ADMIN_ROLES:
            return _cors({'error': 'Нужна роль учредителя или директора'}, 403)
        fields, params = [], []
        allowed_fields = (
            'name', 'inn', 'logo_url', 'description',
            'city', 'website', 'telegram_username', 'vk_username',
            'bio', 'experience', 'license_number', 'founded_year', 'is_public',
        )
        for k in allowed_fields:
            if k in body:
                fields.append(f"{k}=%s")
                params.append(body[k])
        # specializations — массив
        if 'specializations' in body and isinstance(body['specializations'], list):
            fields.append("specializations=%s")
            params.append(body['specializations'])
        if not fields:
            return _cors({'error': 'Нечего обновлять'}, 400)
        fields.append("updated_at=NOW()")
        params.append(org_id)
        cur.execute(f"UPDATE organizations SET {', '.join(fields)} WHERE id=%s", params)
        conn.commit()
        return _cors({'ok': True})


def get_org_full(user_id, org_id):
    """Детальная карточка АН со всеми полями (как в Клубе + АН)."""
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        cur.execute(
            "SELECT id, name, inn, logo_url, description, admin_id, created_at, "
            "city, website, telegram_username, vk_username, specializations, "
            "bio, experience, license_number, founded_year, is_public, "
            "agents_count, deals_count, rating "
            "FROM organizations WHERE id=%s",
            (org_id,),
        )
        org = cur.fetchone()
        if not org:
            return _cors({'error': 'Не найдено'}, 404)
        # Реальный счётчик агентов
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM org_memberships WHERE organization_id=%s AND status='active'",
            (org_id,),
        )
        org['agents_count'] = cur.fetchone()['cnt']
        # Счётчик сделок
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM agency_deals WHERE organization_id=%s AND status='closed'",
            (org_id,),
        )
        org['deals_count'] = cur.fetchone()['cnt']
        # Рейтинг
        cur.execute(
            "SELECT ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS review_count "
            "FROM agency_reviews WHERE organization_id=%s",
            (org_id,),
        )
        rev = cur.fetchone()
        org['rating'] = float(rev['avg_rating'] or 0)
        org['review_count'] = int(rev['review_count'] or 0)
        org['my_role'] = m['role_code']
        org['my_role_title'] = ROLE_TITLES.get(m['role_code'], m['role_code'])
        return _cors(org)


# ── Employees ──────────────────────────────────────────────────────────

def list_employees(user_id, org_id, qs=None):
    qs = qs or {}
    filter_dept = qs.get('department_id')
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        role = m['role_code']

        sql = (
            "SELECT u.id AS user_id, u.name AS full_name, u.email, u.phone, u.avatar_url, "
            "m.role_code, m.department_id, m.status, m.joined_at "
            "FROM org_memberships m JOIN users u ON u.id=m.user_id "
            "WHERE m.organization_id=%s"
        )
        params = [org_id]

        if role == 'rop' and m['department_id']:
            sql += " AND (m.department_id=%s OR m.user_id=%s)"
            params.extend([m['department_id'], user_id])
        elif ROLE_LEVEL.get(role, 0) < ROLE_LEVEL['rop']:
            sql += " AND m.user_id=%s"
            params.append(user_id)

        if filter_dept:
            if filter_dept == 'none':
                sql += " AND m.department_id IS NULL"
            else:
                sql += " AND m.department_id=%s"
                params.append(filter_dept)

        sql += " ORDER BY m.joined_at DESC"
        cur.execute(sql, params)
        rows = cur.fetchall()
        for r in rows:
            r['role_title'] = ROLE_TITLES.get(r['role_code'], r['role_code'])
        return _cors(rows)


def update_employee(user_id, org_id, target_user_id, body):
    with _conn() as conn, conn.cursor() as cur:
        m = _membership(cur, user_id, org_id)
        if not m or m[1] not in ADMIN_ROLES:
            return _cors({'error': 'Нужна роль учредителя или директора'}, 403)

        new_role = body.get('role_code')
        new_dept = body.get('department_id')
        new_status = body.get('status')

        if new_role and new_role not in ROLE_LEVEL:
            return _cors({'error': 'Неизвестная роль'}, 400)

        # Запреты для директора (не учредителя): не трогать учредителя/директора
        if m[1] == 'director':
            cur.execute(
                "SELECT role_code FROM org_memberships WHERE user_id=%s AND organization_id=%s",
                (target_user_id, org_id),
            )
            trow = cur.fetchone()
            target_role = trow[0] if trow else None
            if target_role in ADMIN_ROLES:
                return _cors({'error': 'Директор не может изменять учредителя или другого директора'}, 403)
            if new_role in ADMIN_ROLES:
                return _cors({'error': 'Директор не может назначать роль учредителя или директора'}, 403)

        fields, params = [], []
        if new_role:
            fields.append("role_code=%s")
            params.append(new_role)
        if 'department_id' in body:
            fields.append("department_id=%s")
            params.append(new_dept)
        if new_status:
            fields.append("status=%s")
            params.append(new_status)

        if not fields:
            return _cors({'error': 'Нечего обновлять'}, 400)

        params.extend([target_user_id, org_id])
        cur.execute(
            f"UPDATE org_memberships SET {', '.join(fields)} "
            f"WHERE user_id=%s AND organization_id=%s",
            params,
        )
        conn.commit()
        return _cors({'ok': True})


# ── Departments ────────────────────────────────────────────────────────

def list_departments(user_id, org_id):
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        cur.execute(
            "SELECT d.id, d.name, d.head_id, u.name AS head_name, "
            "(SELECT COUNT(*) FROM org_memberships WHERE department_id=d.id AND status='active') AS members_count "
            "FROM departments d LEFT JOIN users u ON u.id=d.head_id "
            "WHERE d.organization_id=%s ORDER BY d.created_at",
            (org_id,),
        )
        return _cors(cur.fetchall())


def create_department(user_id, org_id, body):
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m or m['role_code'] not in ADMIN_ROLES:
            return _cors({'error': 'Нужна роль учредителя или директора'}, 403)
        name = (body.get('name') or '').strip()
        if not name:
            return _cors({'error': 'Название обязательно'}, 400)
        head_id = body.get('head_id') or None
        cur.execute(
            "INSERT INTO departments(organization_id, name, head_id) VALUES (%s,%s,%s) RETURNING id",
            (org_id, name, head_id),
        )
        dept_id = cur.fetchone()['id']
        if head_id:
            cur.execute(
                "UPDATE org_memberships SET department_id=%s, role_code='rop' "
                "WHERE user_id=%s AND organization_id=%s",
                (dept_id, head_id, org_id),
            )
        conn.commit()
        return _cors({'id': str(dept_id), 'name': name, 'head_id': head_id}, 201)


def update_department(user_id, org_id, body):
    dept_id = body.get('department_id')
    if not dept_id:
        return _cors({'error': 'department_id обязателен'}, 400)
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m or m['role_code'] not in ADMIN_ROLES:
            return _cors({'error': 'Нужна роль учредителя или директора'}, 403)

        cur.execute(
            "SELECT id, head_id FROM departments WHERE id=%s AND organization_id=%s",
            (dept_id, org_id),
        )
        dept = cur.fetchone()
        if not dept:
            return _cors({'error': 'Отдел не найден'}, 404)

        fields, params = [], []
        if 'name' in body and body['name']:
            fields.append("name=%s")
            params.append(body['name'].strip())
        new_head = body.get('head_id') if 'head_id' in body else None
        head_changed = 'head_id' in body
        if head_changed:
            fields.append("head_id=%s")
            params.append(new_head or None)

        if fields:
            params.extend([dept_id, org_id])
            cur.execute(
                f"UPDATE departments SET {', '.join(fields)} "
                f"WHERE id=%s AND organization_id=%s",
                params,
            )

        # Переключение ROP: старому — broker (если не director), новому — rop
        if head_changed:
            old_head = dept['head_id']
            if old_head and str(old_head) != str(new_head or ''):
                cur.execute(
                    "UPDATE org_memberships SET role_code='broker' "
                    "WHERE user_id=%s AND organization_id=%s AND role_code='rop'",
                    (old_head, org_id),
                )
            if new_head:
                cur.execute(
                    "UPDATE org_memberships SET department_id=%s, role_code='rop' "
                    "WHERE user_id=%s AND organization_id=%s",
                    (dept_id, new_head, org_id),
                )

        conn.commit()
        return _cors({'ok': True})


def delete_department(user_id, org_id, body):
    dept_id = body.get('department_id')
    if not dept_id:
        return _cors({'error': 'department_id обязателен'}, 400)
    with _conn() as conn, conn.cursor() as cur:
        m = _membership(cur, user_id, org_id)
        if not m or m[1] not in ADMIN_ROLES:
            return _cors({'error': 'Нужна роль учредителя или директора'}, 403)
        # Отвязываем сотрудников от отдела (без удаления сотрудников!)
        cur.execute(
            "UPDATE org_memberships SET department_id=NULL "
            "WHERE department_id=%s AND organization_id=%s",
            (dept_id, org_id),
        )
        # Помечаем отдел как архивный через переименование
        cur.execute(
            "UPDATE departments SET name=name||' (архив)', head_id=NULL "
            "WHERE id=%s AND organization_id=%s",
            (dept_id, org_id),
        )
        conn.commit()
        return _cors({'ok': True, 'archived': True})


# ── Invites ────────────────────────────────────────────────────────────

def create_invite(user_id, org_id, body):
    full_name = (body.get('full_name') or '').strip()
    email = (body.get('email') or '').strip().lower()
    phone = (body.get('phone') or '').strip() or None
    role_code = body.get('role_code', 'broker')
    dept_id = body.get('department_id') or None

    if not full_name or not email:
        return _cors({'error': 'Укажите ФИО и email'}, 400)
    if role_code not in ROLE_LEVEL:
        return _cors({'error': 'Неизвестная роль'}, 400)

    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        if ROLE_LEVEL.get(m['role_code'], 0) < ROLE_LEVEL['rop']:
            return _cors({'error': 'Приглашать могут только учредитель, директор и ROP'}, 403)
        if m['role_code'] == 'rop':
            if dept_id and dept_id != str(m['department_id']):
                return _cors({'error': 'ROP приглашает только в свой отдел'}, 403)
            dept_id = m['department_id']
            if ROLE_LEVEL[role_code] >= ROLE_LEVEL['rop']:
                return _cors({'error': 'ROP не может приглашать равных или выше'}, 403)
        # Приглашать учредителя/директора может только учредитель
        if role_code in ADMIN_ROLES and m['role_code'] != 'founder':
            return _cors({'error': 'Только учредитель может приглашать на роль директора'}, 403)
        # Второго учредителя назначать нельзя через приглашение
        if role_code == 'founder':
            return _cors({'error': 'Нельзя назначать второго учредителя'}, 403)

        token = secrets.token_urlsafe(24)
        expires = datetime.now(timezone.utc) + timedelta(hours=INVITE_TTL_HOURS)

        cur.execute(
            "INSERT INTO org_invites(organization_id, invited_by, email, phone, full_name, "
            "role_code, department_id, token, expires_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (org_id, user_id, email, phone, full_name, role_code, dept_id, token, expires),
        )
        invite_id = cur.fetchone()['id']

        cur.execute(
            "SELECT id FROM users WHERE lower(email)=%s OR (phone IS NOT NULL AND phone=%s) LIMIT 1",
            (email, phone or ''),
        )
        existing = cur.fetchone()
        auto_joined = False
        if existing:
            cur.execute(
                "INSERT INTO org_memberships(user_id, organization_id, department_id, role_code) "
                "VALUES (%s,%s,%s,%s) ON CONFLICT (user_id, organization_id) DO NOTHING",
                (existing['id'], org_id, dept_id, role_code),
            )
            cur.execute("UPDATE org_invites SET status='accepted' WHERE id=%s", (invite_id,))
            auto_joined = True

        conn.commit()
        return _cors({
            'invite_id': str(invite_id),
            'token': token,
            'invite_url': f"/invite/{token}",
            'expires_at': expires.isoformat(),
            'auto_joined': auto_joined,
        }, 201)


def list_invites(user_id, org_id):
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        if ROLE_LEVEL.get(m['role_code'], 0) < ROLE_LEVEL['rop']:
            return _cors([])
        cur.execute(
            "SELECT id, email, phone, full_name, role_code, department_id, status, "
            "token, expires_at, created_at "
            "FROM org_invites WHERE organization_id=%s ORDER BY created_at DESC",
            (org_id,),
        )
        return _cors(cur.fetchall())


def lookup_invite(token):
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "SELECT i.id, i.email, i.full_name, i.role_code, i.status, i.expires_at, "
            "o.id AS organization_id, o.name AS organization_name, o.logo_url "
            "FROM org_invites i JOIN organizations o ON o.id=i.organization_id "
            "WHERE i.token=%s",
            (token,),
        )
        row = cur.fetchone()
        if not row:
            return _cors({'error': 'Приглашение не найдено'}, 404)
        if row['status'] != 'pending':
            return _cors({'error': 'Приглашение уже использовано или отозвано', 'status': row['status']}, 410)
        if row['expires_at'] < datetime.now(timezone.utc):
            return _cors({'error': 'Срок действия приглашения истёк'}, 410)
        row['role_title'] = ROLE_TITLES.get(row['role_code'], row['role_code'])
        return _cors(row)


def accept_invite(user_id, body):
    token = body.get('token')
    if not token:
        return _cors({'error': 'token обязателен'}, 400)
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "SELECT * FROM org_invites WHERE token=%s AND status='pending' AND expires_at > now()",
            (token,),
        )
        inv = cur.fetchone()
        if not inv:
            return _cors({'error': 'Приглашение недействительно'}, 410)
        cur.execute(
            "INSERT INTO org_memberships(user_id, organization_id, department_id, role_code) "
            "VALUES (%s,%s,%s,%s) ON CONFLICT (user_id, organization_id) DO NOTHING",
            (user_id, inv['organization_id'], inv['department_id'], inv['role_code']),
        )
        cur.execute("UPDATE org_invites SET status='accepted' WHERE id=%s", (inv['id'],))
        conn.commit()
        return _cors({'ok': True, 'organization_id': str(inv['organization_id'])})


# ── Analytics ──────────────────────────────────────────────────────────

def org_analytics(user_id, org_id):
    """Сводная аналитика агентства: объекты и лиды по отделам и сотрудникам."""
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        role = m['role_code']

        # Ограничиваем scope для ROP
        dept_filter_sql = ''
        dept_params = [org_id]
        if role == 'rop' and m['department_id']:
            dept_filter_sql = ' AND department_id=%s'
            dept_params.append(m['department_id'])
        elif ROLE_LEVEL.get(role, 0) < ROLE_LEVEL['rop']:
            # broker и ниже видят только свои данные
            dept_filter_sql = ' AND o_user_id=%s'
            dept_params.append(user_id)

        # Статистика объектов по отделам
        cur.execute(
            "SELECT d.id AS dept_id, d.name AS dept_name, "
            "COUNT(o.id) AS total, "
            "SUM(CASE WHEN o.published=true THEN 1 ELSE 0 END) AS published, "
            "SUM(CASE WHEN o.status='Активен' THEN 1 ELSE 0 END) AS active "
            "FROM departments d "
            "LEFT JOIN objects o ON o.department_id=d.id AND o.org_id=%s "
            "WHERE d.organization_id=%s "
            "GROUP BY d.id, d.name ORDER BY d.name",
            (org_id, org_id),
        )
        dept_objects = cur.fetchall()

        # Статистика лидов по отделам
        cur.execute(
            "SELECT d.id AS dept_id, d.name AS dept_name, "
            "COUNT(l.id) AS total, "
            "SUM(CASE WHEN l.stage='Сделка' THEN 1 ELSE 0 END) AS deals, "
            "SUM(CASE WHEN l.stage='Лид' THEN 1 ELSE 0 END) AS new_leads "
            "FROM departments d "
            "LEFT JOIN leads l ON l.department_id=d.id AND l.org_id=%s "
            "WHERE d.organization_id=%s "
            "GROUP BY d.id, d.name ORDER BY d.name",
            (org_id, org_id),
        )
        dept_leads = cur.fetchall()

        # Топ сотрудников по объектам
        cur.execute(
            "SELECT u.id AS user_id, u.name AS full_name, u.avatar_url, "
            "m2.role_code, m2.department_id, "
            "COUNT(o.id) AS objects_count "
            "FROM org_memberships m2 "
            "JOIN users u ON u.id=m2.user_id "
            "LEFT JOIN objects o ON o.user_id=m2.user_id AND o.org_id=%s "
            "WHERE m2.organization_id=%s AND m2.status='active' "
            "GROUP BY u.id, u.name, u.avatar_url, m2.role_code, m2.department_id "
            "ORDER BY objects_count DESC LIMIT 10",
            (org_id, org_id),
        )
        top_by_objects = cur.fetchall()
        for r in top_by_objects:
            r['role_title'] = ROLE_TITLES.get(r['role_code'], r['role_code'])

        # Топ сотрудников по лидам
        cur.execute(
            "SELECT u.id AS user_id, u.name AS full_name, "
            "m2.role_code, m2.department_id, "
            "COUNT(l.id) AS leads_count, "
            "SUM(CASE WHEN l.stage='Сделка' THEN 1 ELSE 0 END) AS deals_count "
            "FROM org_memberships m2 "
            "JOIN users u ON u.id=m2.user_id "
            "LEFT JOIN leads l ON l.owner_id=m2.user_id AND l.org_id=%s "
            "WHERE m2.organization_id=%s AND m2.status='active' "
            "GROUP BY u.id, u.name, m2.role_code, m2.department_id "
            "ORDER BY leads_count DESC LIMIT 10",
            (org_id, org_id),
        )
        top_by_leads = cur.fetchall()
        for r in top_by_leads:
            r['role_title'] = ROLE_TITLES.get(r['role_code'], r['role_code'])

        # Итоги по всему агентству
        cur.execute(
            "SELECT COUNT(*) AS total_objects, "
            "SUM(CASE WHEN published=true THEN 1 ELSE 0 END) AS published_objects "
            "FROM objects WHERE org_id=%s",
            (org_id,),
        )
        obj_total = cur.fetchone()

        cur.execute(
            "SELECT COUNT(*) AS total_leads, "
            "SUM(CASE WHEN stage='Сделка' THEN 1 ELSE 0 END) AS total_deals "
            "FROM leads WHERE org_id=%s",
            (org_id,),
        )
        lead_total = cur.fetchone()

        return _cors({
            'summary': {
                'total_objects': int(obj_total['total_objects'] or 0),
                'published_objects': int(obj_total['published_objects'] or 0),
                'total_leads': int(lead_total['total_leads'] or 0),
                'total_deals': int(lead_total['total_deals'] or 0),
            },
            'dept_objects': list(dept_objects),
            'dept_leads': list(dept_leads),
            'top_by_objects': list(top_by_objects),
            'top_by_leads': list(top_by_leads),
        })


# ── Deals ──────────────────────────────────────────────────────────────

def list_deals(user_id, org_id, qs=None):
    """Список сделок агентства."""
    qs = qs or {}
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        role = m['role_code']
        sql = (
            "SELECT d.id, d.title, d.deal_type, d.amount, d.commission_total, "
            "d.commission_agent_pct, d.commission_agency_pct, "
            "d.commission_agent, d.commission_agency, "
            "d.status, d.client_name, d.client_phone, d.notes, "
            "d.closed_at, d.created_at, d.agent_id, "
            "u.name AS agent_name, u.avatar_url AS agent_avatar "
            "FROM agency_deals d "
            "JOIN users u ON u.id=d.agent_id "
            "WHERE d.organization_id=%s"
        )
        params = [org_id]
        if ROLE_LEVEL.get(role, 0) < ROLE_LEVEL['rop']:
            sql += " AND d.agent_id=%s"
            params.append(user_id)
        status_filter = qs.get('status')
        if status_filter:
            sql += " AND d.status=%s"
            params.append(status_filter)
        sql += " ORDER BY d.created_at DESC LIMIT 100"
        cur.execute(sql, params)
        return _cors(cur.fetchall())


def create_deal(user_id, org_id, body):
    """Создать сделку."""
    title = (body.get('title') or '').strip()
    if not title:
        return _cors({'error': 'Название сделки обязательно'}, 400)
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        agent_id = body.get('agent_id') or user_id
        amount = body.get('amount')
        comm_total = body.get('commission_total')
        agent_pct = float(body.get('commission_agent_pct', 50))
        agency_pct = 100 - agent_pct
        comm_agent = round(float(comm_total) * agent_pct / 100, 2) if comm_total else None
        comm_agency = round(float(comm_total) * agency_pct / 100, 2) if comm_total else None
        cur.execute(
            "INSERT INTO agency_deals(organization_id, agent_id, object_id, title, deal_type, "
            "amount, commission_total, commission_agent_pct, commission_agency_pct, "
            "commission_agent, commission_agency, status, client_name, client_phone, notes) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (org_id, agent_id, body.get('object_id') or None, title,
             body.get('deal_type', 'sale'), amount, comm_total,
             agent_pct, agency_pct, comm_agent, comm_agency,
             body.get('status', 'active'),
             body.get('client_name', ''), body.get('client_phone', ''),
             body.get('notes', '')),
        )
        deal_id = cur.fetchone()['id']
        conn.commit()
        return _cors({'id': str(deal_id)}, 201)


def update_deal(user_id, org_id, body):
    """Обновить сделку (статус, сумму и т.д.)."""
    deal_id = body.get('deal_id')
    if not deal_id:
        return _cors({'error': 'deal_id обязателен'}, 400)
    with _conn() as conn, conn.cursor() as cur:
        m = _membership(cur, user_id, org_id)
        if not m:
            return _cors({'error': 'Нет доступа'}, 403)
        fields, params = [], []
        updatable = ('title', 'deal_type', 'amount', 'commission_total',
                     'commission_agent_pct', 'status', 'client_name', 'client_phone', 'notes')
        for k in updatable:
            if k in body:
                fields.append(f"{k}=%s")
                params.append(body[k])
        if body.get('status') == 'closed':
            fields.append("closed_at=NOW()")
        if not fields:
            return _cors({'error': 'Нечего обновлять'}, 400)
        fields.append("updated_at=NOW()")
        params.extend([deal_id, org_id])
        cur.execute(
            f"UPDATE agency_deals SET {', '.join(fields)} WHERE id=%s AND organization_id=%s",
            params,
        )
        conn.commit()
        return _cors({'ok': True})


# ── Reviews ─────────────────────────────────────────────────────────────

def list_reviews(org_id):
    """Публичный список отзывов об АН."""
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "SELECT id, author_name, rating, text, deal_type, created_at "
            "FROM agency_reviews WHERE organization_id=%s ORDER BY created_at DESC LIMIT 50",
            (org_id,),
        )
        rows = cur.fetchall()
        cur.execute(
            "SELECT ROUND(AVG(rating)::numeric,2) AS avg, COUNT(*) AS cnt "
            "FROM agency_reviews WHERE organization_id=%s",
            (org_id,),
        )
        stat = cur.fetchone()
        return _cors({'reviews': rows, 'avg_rating': float(stat['avg'] or 0), 'count': int(stat['cnt'] or 0)})


def create_review(user_id, org_id, body):
    """Оставить отзыв об АН."""
    rating = int(body.get('rating', 0))
    if rating < 1 or rating > 5:
        return _cors({'error': 'Оценка от 1 до 5'}, 400)
    author_name = (body.get('author_name') or '').strip()
    if not author_name and user_id:
        with _conn() as conn, conn.cursor() as cur:
            cur.execute("SELECT name FROM users WHERE id=%s", (user_id,))
            row = cur.fetchone()
            author_name = row[0] if row else 'Аноним'
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "INSERT INTO agency_reviews(organization_id, author_id, author_name, rating, text, deal_type) "
            "VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
            (org_id, user_id or None, author_name, rating,
             body.get('text', ''), body.get('deal_type', '')),
        )
        review_id = cur.fetchone()['id']
        conn.commit()
        return _cors({'id': str(review_id)}, 201)


# ── Public agency profile ────────────────────────────────────────────────

def public_agency(org_id):
    """Публичная страница АН для Сети."""
    with _conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name, logo_url, description, city, website, "
            "telegram_username, vk_username, specializations, bio, experience, "
            "founded_year, is_public, created_at "
            "FROM organizations WHERE id=%s AND is_public=true",
            (org_id,),
        )
        org = cur.fetchone()
        if not org:
            return _cors({'error': 'АН не найдено'}, 404)
        cur.execute(
            "SELECT u.id, u.name, u.avatar_url, m.role_code "
            "FROM org_memberships m JOIN users u ON u.id=m.user_id "
            "WHERE m.organization_id=%s AND m.status='active' "
            "ORDER BY m.joined_at LIMIT 20",
            (org_id,),
        )
        members = cur.fetchall()
        for mb in members:
            mb['role_title'] = ROLE_TITLES.get(mb['role_code'], mb['role_code'])
        cur.execute(
            "SELECT ROUND(AVG(rating)::numeric,2) AS avg, COUNT(*) AS cnt "
            "FROM agency_reviews WHERE organization_id=%s",
            (org_id,),
        )
        rev = cur.fetchone()
        org['members'] = list(members)
        org['agents_count'] = len(members)
        org['rating'] = float(rev['avg'] or 0)
        org['review_count'] = int(rev['cnt'] or 0)
        return _cors(org)


# ── Router ─────────────────────────────────────────────────────────────

def handler(event, context) -> dict:
    """Кабинет агентства: организации, сотрудники, отделы, приглашения, RBAC."""
    if isinstance(event, str):
        event = json.loads(event)

    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _cors({}, 200)

    path = event.get('path') or event.get('rawPath') or ''
    qs = event.get('queryStringParameters') or {}
    raw_body = event.get('body')
    body = {}
    if raw_body:
        try:
            parsed = raw_body
            while isinstance(parsed, str):
                parsed = json.loads(parsed) if parsed else {}
            if isinstance(parsed, dict):
                body = parsed
        except Exception:
            body = {}

    action = (qs.get('action') or body.get('action') or '').strip()
    user_id = _user_id(event)
    org_id = _org_id(event) or qs.get('org_id') or body.get('org_id')
    token = qs.get('token') or body.get('token')

    try:
        if action == 'lookup_invite':
            if not token:
                return _cors({'error': 'token обязателен'}, 400)
            return lookup_invite(token)
        if action == 'public_agency':
            if not org_id:
                return _cors({'error': 'org_id обязателен'}, 400)
            return public_agency(org_id)
        if action == 'list_reviews':
            if not org_id:
                return _cors({'error': 'org_id обязателен'}, 400)
            return list_reviews(org_id)

        if not user_id:
            return _cors({'error': 'Не авторизован'}, 401)

        if action == 'list_my_orgs':
            return list_my_orgs(user_id)
        if action == 'create_org':
            return create_org(user_id, body)
        if action == 'get_org':
            return get_org(user_id, org_id)
        if action == 'get_org_full':
            return get_org_full(user_id, org_id)
        if action == 'update_org':
            return update_org(user_id, org_id, body)
        if action == 'list_employees':
            return list_employees(user_id, org_id, qs)
        if action == 'update_employee':
            return update_employee(user_id, org_id, body.get('user_id'), body)
        if action == 'list_departments':
            return list_departments(user_id, org_id)
        if action == 'create_department':
            return create_department(user_id, org_id, body)
        if action == 'update_department':
            return update_department(user_id, org_id, body)
        if action == 'delete_department':
            return delete_department(user_id, org_id, body)
        if action == 'create_invite':
            return create_invite(user_id, org_id, body)
        if action == 'list_invites':
            return list_invites(user_id, org_id)
        if action == 'accept_invite':
            return accept_invite(user_id, body)
        if action == 'org_analytics':
            return org_analytics(user_id, org_id)
        if action == 'list_deals':
            return list_deals(user_id, org_id, qs)
        if action == 'create_deal':
            return create_deal(user_id, org_id, body)
        if action == 'update_deal':
            return update_deal(user_id, org_id, body)
        if action == 'create_review':
            return create_review(user_id, org_id, body)

        return _cors({'error': f'Неизвестное действие: {action}'}, 400)

    except Exception as e:
        import traceback
        print(f"AGENCY ERROR action={action} user_id={user_id}: {type(e).__name__}: {e}")
        print(traceback.format_exc())
        return _cors({'error': 'internal', 'detail': f'{type(e).__name__}: {str(e)}'}, 500)