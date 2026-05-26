"""
Фиксации клиентов агрегатора.
GET  /         — список фиксаций (admin: все + отделы + сотрудники, user: свои)
GET  /?meta=1  — только отделы и сотрудники (для фильтров)
POST /         — создать фиксацию (+ клиента)
PUT  /         — обновить статус/заметки фиксации (admin может любую)
"""
import json
import os
import psycopg2
from datetime import datetime, timedelta


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Admin-Token",
}

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "k24admin")

STATUSES = {
    "pending": "Ожидает ответа",
    "fixed": "Зафиксирован",
    "invalid": "Неактуален",
    "showing": "Показ",
    "booking": "Бронь",
    "negotiation": "Переговоры",
    "deal": "Сделка",
    "docs": "Подготовка документов",
    "payment": "Оплата",
}


def is_admin(headers: dict) -> bool:
    return headers.get("X-Admin-Token", "") == ADMIN_TOKEN


def handler(event: dict, context) -> dict:
    """Фиксации агрегатора — CRM-воронка с фильтрами по отделам и сотрудникам."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {**CORS, "Access-Control-Max-Age": "86400"}, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    user_id = headers.get("X-User-Id", "")
    admin = is_admin(headers)
    qs = event.get("queryStringParameters") or {}

    if not user_id and not admin:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        # Получить метаданные (отделы + сотрудники) для фильтров
        departments = []
        brokers = []
        if admin:
            cur.execute(
                """SELECT d.id, d.name, d.head_id,
                          u.name as head_name,
                          COUNT(m.id) FILTER (WHERE m.status = 'active') as members_count
                   FROM office_departments d
                   LEFT JOIN users u ON u.id = d.head_id
                   LEFT JOIN office_members m ON m.department_id = d.id
                   GROUP BY d.id, d.name, d.head_id, u.name
                   ORDER BY d.name"""
            )
            for row in cur.fetchall():
                departments.append({
                    "id": str(row[0]),
                    "name": row[1],
                    "head_id": str(row[2]) if row[2] else None,
                    "head_name": row[3],
                    "members_count": row[4],
                })

            cur.execute(
                """SELECT DISTINCT u.id, u.name, om.department_id, d.name as dept_name
                   FROM agg_fixations f
                   JOIN users u ON u.id::text = f.user_id
                   LEFT JOIN office_members om ON om.user_id = u.id AND om.status = 'active'
                   LEFT JOIN office_departments d ON d.id = om.department_id
                   ORDER BY u.name"""
            )
            for row in cur.fetchall():
                brokers.append({
                    "id": str(row[0]),
                    "name": row[1],
                    "department_id": str(row[2]) if row[2] else None,
                    "department_name": row[3],
                })

        if qs.get("meta") == "1":
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"departments": departments, "brokers": brokers}, ensure_ascii=False)}

        # Получить фиксации
        dept_filter = qs.get("department_id", "")
        broker_filter = qs.get("broker_id", "")

        if admin:
            where_clauses = []
            params = []
            if dept_filter:
                where_clauses.append("om.department_id = %s")
                params.append(dept_filter)
            if broker_filter:
                where_clauses.append("f.user_id = %s")
                params.append(broker_filter)

            where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

            cur.execute(
                f"""SELECT f.id, f.offer_id, f.user_id, f.agency_id, f.status,
                          f.expires_at, f.notes, f.created_at, f.updated_at,
                          o.title as offer_title, o.city, o.category,
                          c.full_name, c.phone, c.email,
                          u.name as broker_name, u.email as broker_email,
                          om.department_id, d.name as dept_name
                   FROM agg_fixations f
                   JOIN agg_offers o ON o.id = f.offer_id
                   JOIN agg_clients c ON c.id = f.client_id
                   LEFT JOIN users u ON u.id::text = f.user_id
                   LEFT JOIN office_members om ON om.user_id = u.id AND om.status = 'active'
                   LEFT JOIN office_departments d ON d.id = om.department_id
                   {where_sql}
                   ORDER BY f.created_at DESC""",
                params if params else None,
            )
        else:
            cur.execute(
                """SELECT f.id, f.offer_id, f.user_id, f.agency_id, f.status,
                          f.expires_at, f.notes, f.created_at, f.updated_at,
                          o.title as offer_title, o.city, o.category,
                          c.full_name, c.phone, c.email,
                          NULL as broker_name, NULL as broker_email,
                          NULL as department_id, NULL as dept_name
                   FROM agg_fixations f
                   JOIN agg_offers o ON o.id = f.offer_id
                   JOIN agg_clients c ON c.id = f.client_id
                   WHERE f.user_id = %s
                   ORDER BY f.created_at DESC""",
                (user_id,),
            )
        rows = cur.fetchall()
        conn.close()
        cols = ["id", "offer_id", "user_id", "agency_id", "status",
                "expires_at", "notes", "created_at", "updated_at",
                "offer_title", "city", "category",
                "client_name", "client_phone", "client_email",
                "broker_name", "broker_email", "department_id", "dept_name"]
        fixations = []
        for row in rows:
            f = dict(zip(cols, row))
            f["id"] = str(f["id"])
            f["offer_id"] = str(f["offer_id"])
            f["department_id"] = str(f["department_id"]) if f["department_id"] else None
            f["status_label"] = STATUSES.get(f["status"], f["status"])
            f["expires_at"] = str(f["expires_at"]) if f["expires_at"] else None
            f["created_at"] = str(f["created_at"])
            f["updated_at"] = str(f["updated_at"])
            fixations.append(f)
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(
            {"fixations": fixations, "departments": departments, "brokers": brokers},
            ensure_ascii=False
        )}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        offer_id = body.get("offer_id", "")
        full_name = body.get("full_name", "").strip()
        phone = body.get("phone", "").strip()
        email = body.get("email", "").strip()
        notes = body.get("notes", "")
        agency_id = body.get("agency_id", "")

        if not offer_id or not full_name:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "offer_id и full_name обязательны"})}

        cur.execute(
            "INSERT INTO agg_clients (user_id, full_name, phone, email, notes) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (user_id, full_name, phone, email, notes),
        )
        client_id = cur.fetchone()[0]

        expires_at = datetime.now() + timedelta(days=30)
        cur.execute(
            "INSERT INTO agg_fixations (offer_id, client_id, user_id, agency_id, status, expires_at, notes) VALUES (%s, %s, %s, %s, 'pending', %s, %s) RETURNING id",
            (offer_id, client_id, user_id, agency_id or None, expires_at, notes),
        )
        fix_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"fixation_id": str(fix_id), "client_id": str(client_id)}, ensure_ascii=False)}

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        fix_id = body.get("id", "")
        new_status = body.get("status", "")
        notes = body.get("notes")

        if not fix_id or new_status not in STATUSES:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid params"})}

        if admin:
            if notes is not None:
                cur.execute(
                    "UPDATE agg_fixations SET status = %s, notes = %s, updated_at = NOW() WHERE id = %s",
                    (new_status, notes, fix_id),
                )
            else:
                cur.execute(
                    "UPDATE agg_fixations SET status = %s, updated_at = NOW() WHERE id = %s",
                    (new_status, fix_id),
                )
        else:
            if notes is not None:
                cur.execute(
                    "UPDATE agg_fixations SET status = %s, notes = %s, updated_at = NOW() WHERE id = %s AND user_id = %s",
                    (new_status, notes, fix_id, user_id),
                )
            else:
                cur.execute(
                    "UPDATE agg_fixations SET status = %s, updated_at = NOW() WHERE id = %s AND user_id = %s",
                    (new_status, fix_id, user_id),
                )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method not allowed"})}