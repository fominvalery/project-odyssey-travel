"""
Онлайн Офис Кабинет-24 — управление внутренней командой.
GET  /                       — список сотрудников + отделов + приглашений
POST / action=dept_create    — создать отдел
POST / action=dept_update    — обновить отдел
POST / action=dept_remove    — удалить отдел (открепляет сотрудников)
POST / action=member_add     — добавить сотрудника (по user_id)
POST / action=member_update  — изменить роль / отдел / должность / статус
POST / action=invite_create  — создать приглашение (по email)
POST / action=invite_revoke  — отозвать приглашение
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "k24admin")

ROLE_LABELS = {
    "owner":     "Владелец",
    "director":  "Директор",
    "head":      "Руководитель отдела",
    "analyst":   "Аналитик",
    "support":   "Поддержка",
    "developer": "Разработчик",
    "marketer":  "Маркетолог",
    "staff":     "Сотрудник",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def is_admin(headers: dict) -> bool:
    return headers.get("X-Admin-Token", "") == ADMIN_TOKEN


def handler(event: dict, context) -> dict:
    """Управление внутренней командой Кабинет-24 (отделы, сотрудники, приглашения)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {**CORS, "Access-Control-Max-Age": "86400"}, "body": ""}

    headers = event.get("headers") or {}
    if not is_admin(headers):
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

    method = event.get("httpMethod", "GET")
    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        cur.execute("""
            SELECT d.id, d.name, d.description, d.head_id, d.color, d.created_at,
                   u.name as head_name,
                   COUNT(m.id) FILTER (WHERE m.status = 'active') as members_count
            FROM office_departments d
            LEFT JOIN users u ON u.id = d.head_id
            LEFT JOIN office_members m ON m.department_id = d.id
            GROUP BY d.id, d.name, d.description, d.head_id, d.color, d.created_at, u.name
            ORDER BY d.created_at
        """)
        departments = []
        for row in cur.fetchall():
            departments.append({
                "id": str(row[0]),
                "name": row[1],
                "description": row[2],
                "head_id": str(row[3]) if row[3] else None,
                "color": row[4],
                "created_at": str(row[5]),
                "head_name": row[6],
                "members_count": row[7] or 0,
            })

        cur.execute("""
            SELECT m.id, m.user_id, m.department_id, m.role_code, m.job_title,
                   m.status, m.joined_at,
                   u.name, u.email, u.phone, u.avatar_url,
                   d.name as dept_name
            FROM office_members m
            JOIN users u ON u.id = m.user_id
            LEFT JOIN office_departments d ON d.id = m.department_id
            ORDER BY m.joined_at
        """)
        members = []
        for row in cur.fetchall():
            members.append({
                "id": str(row[0]),
                "user_id": str(row[1]),
                "department_id": str(row[2]) if row[2] else None,
                "role_code": row[3],
                "role_label": ROLE_LABELS.get(row[3], row[3]),
                "job_title": row[4],
                "status": row[5],
                "joined_at": str(row[6]),
                "name": row[7],
                "email": row[8],
                "phone": row[9] or "",
                "avatar": row[10] or "",
                "dept_name": row[11],
            })

        cur.execute("""
            SELECT i.id, i.email, i.role_code, i.department_id, i.job_title,
                   i.token, i.status, i.expires_at, i.created_at,
                   d.name as dept_name
            FROM office_invites i
            LEFT JOIN office_departments d ON d.id = i.department_id
            ORDER BY i.created_at DESC
        """)
        invites = []
        now = datetime.now(timezone.utc)
        for row in cur.fetchall():
            expires_at = row[7]
            expired = False
            if expires_at:
                exp_aware = expires_at.replace(tzinfo=timezone.utc) if expires_at.tzinfo is None else expires_at
                expired = exp_aware < now
            invites.append({
                "id": str(row[0]),
                "email": row[1],
                "role_code": row[2],
                "role_label": ROLE_LABELS.get(row[2], row[2]),
                "department_id": str(row[3]) if row[3] else None,
                "job_title": row[4],
                "token": row[5],
                "status": "expired" if (row[6] == "pending" and expired) else row[6],
                "expires_at": str(expires_at) if expires_at else None,
                "created_at": str(row[8]),
                "dept_name": row[9],
            })

        conn.close()
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "departments": departments,
                "members": members,
                "invites": invites,
                "roles": [{"id": k, "label": v} for k, v in ROLE_LABELS.items()],
            }, ensure_ascii=False, default=str),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "")

        if action == "dept_create":
            name = body.get("name", "").strip()
            if not name:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "name required"})}
            cur.execute(
                "INSERT INTO office_departments (name, description, color) VALUES (%s, %s, %s) RETURNING id",
                (name, body.get("description", ""), body.get("color", "blue")),
            )
            new_id = str(cur.fetchone()[0])
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "ok": True})}

        if action == "dept_update":
            dept_id = body.get("id", "")
            if not dept_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
            fields, params = ["updated_at = NOW()"], []
            for field in ("name", "description", "color", "head_id"):
                if field in body:
                    fields.append(f"{field} = %s")
                    params.append(body[field] if body[field] else None)
            params.append(dept_id)
            cur.execute(f"UPDATE office_departments SET {', '.join(fields)} WHERE id = %s", params)
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if action == "dept_remove":
            dept_id = body.get("id", "")
            if not dept_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
            cur.execute("UPDATE office_members SET department_id = NULL WHERE department_id = %s", (dept_id,))
            cur.execute("UPDATE office_departments SET name = '[удалён] ' || name, updated_at = NOW() WHERE id = %s", (dept_id,))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if action == "member_add":
            user_id = body.get("user_id", "")
            role_code = body.get("role_code", "staff")
            if not user_id or role_code not in ROLE_LABELS:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id и role_code обязательны"})}
            cur.execute(
                """INSERT INTO office_members (user_id, department_id, role_code, job_title)
                   VALUES (%s, %s, %s, %s)
                   ON CONFLICT (user_id) DO UPDATE SET
                     department_id = EXCLUDED.department_id,
                     role_code = EXCLUDED.role_code,
                     job_title = EXCLUDED.job_title,
                     status = 'active',
                     updated_at = NOW()
                   RETURNING id""",
                (user_id, body.get("department_id") or None, role_code, body.get("job_title", "")),
            )
            new_id = str(cur.fetchone()[0])
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "ok": True})}

        if action == "member_update":
            member_id = body.get("id", "")
            if not member_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
            fields, params = ["updated_at = NOW()"], []
            for field in ("role_code", "job_title", "status", "department_id"):
                if field in body:
                    val = body[field]
                    if field == "role_code" and val and val not in ROLE_LABELS:
                        conn.close()
                        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid role_code"})}
                    fields.append(f"{field} = %s")
                    params.append(val if val else None)
            params.append(member_id)
            cur.execute(f"UPDATE office_members SET {', '.join(fields)} WHERE id = %s", params)
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        if action == "invite_create":
            email = body.get("email", "").strip().lower()
            role_code = body.get("role_code", "staff")
            if not email or role_code not in ROLE_LABELS:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "email и role_code обязательны"})}
            cur.execute(
                """INSERT INTO office_invites (email, role_code, department_id, job_title)
                   VALUES (%s, %s, %s, %s) RETURNING id, token""",
                (email, role_code, body.get("department_id") or None, body.get("job_title", "")),
            )
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": str(row[0]), "token": row[1], "ok": True})}

        if action == "invite_revoke":
            invite_id = body.get("id", "")
            if not invite_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
            cur.execute("UPDATE office_invites SET status = 'expired' WHERE id = %s", (invite_id,))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        conn.close()
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"unknown action: {action}"})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method not allowed"})}