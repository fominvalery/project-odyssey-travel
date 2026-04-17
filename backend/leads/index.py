"""
Заявки от покупателей владельцам объектов.
POST   /                      — создать заявку (публично или вручную)
GET    /?owner_id={uuid}      — список заявок владельца (для CRM)
GET    /?org_id={uuid}        — список заявок агентства (с опц. department_id)
PUT    /                      — обновить стадию/поля (только владелец)
DELETE /?id={uuid}&owner_id={uuid} — удалить заявку (только владелец)
"""
import os
import json
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema


def row_to_lead(r):
    return {
        "id": str(r[0]),
        "owner_id": str(r[1]) if r[1] else None,
        "object_id": str(r[2]) if r[2] else None,
        "object_title": r[3] or "",
        "name": r[4] or "",
        "phone": r[5] or "",
        "email": r[6] or "",
        "message": r[7] or "",
        "source": r[8] or "",
        "stage": r[9] or "Лид",
        "created_at": r[10].isoformat() if r[10] else "",
        "budget_from": r[11],
        "budget_to": r[12],
        "area_from": float(r[13]) if r[13] is not None else None,
        "area_to": float(r[14]) if r[14] is not None else None,
        "preferred_type": r[15] or "",
        "preferred_city": r[16] or "",
        "preferred_category": r[17] or "",
        "org_id": str(r[18]) if len(r) > 18 and r[18] else None,
        "department_id": str(r[19]) if len(r) > 19 and r[19] else None,
    }


def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body)}


SELECT_COLS = (
    "id, owner_id, object_id, object_title, name, phone, email, "
    "message, source, stage, created_at, "
    "budget_from, budget_to, area_from, area_to, "
    "preferred_type, preferred_city, preferred_category, "
    "org_id, department_id"
)


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    conn, schema = get_conn()
    cur = conn.cursor()

    try:
        # ---------- POST — новая заявка ----------
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            owner_id = body.get("owner_id")
            name = (body.get("name") or "").strip()
            phone = (body.get("phone") or "").strip()

            if not owner_id or not name or not phone:
                return resp(400, {"error": "owner_id, name, phone required"})

            object_id = body.get("object_id") or None
            org_id = body.get("org_id") or None
            dept_id = body.get("department_id") or None

            sql = (
                "INSERT INTO " + schema + ".leads"
                " (owner_id, object_id, object_title, name, phone, email, message, source, stage,"
                "  budget_from, budget_to, area_from, area_to,"
                "  preferred_type, preferred_city, preferred_category, org_id, department_id)"
                " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
                " RETURNING " + SELECT_COLS
            )
            cur.execute(sql, (
                owner_id, object_id,
                body.get("object_title", ""), name, phone,
                body.get("email", ""), body.get("message", ""),
                body.get("source", "Маркетплейс"), body.get("stage", "Лид"),
                body.get("budget_from") or None, body.get("budget_to") or None,
                body.get("area_from") or None, body.get("area_to") or None,
                body.get("preferred_type", ""), body.get("preferred_city", ""),
                body.get("preferred_category", ""), org_id, dept_id,
            ))
            row = cur.fetchone()
            conn.commit()
            return resp(200, {"ok": True, "lead": row_to_lead(row)})

        # ---------- GET — список заявок владельца или агентства ----------
        if method == "GET":
            params = event.get("queryStringParameters") or {}
            owner_id = params.get("owner_id")
            org_id = params.get("org_id")
            dept_id = params.get("department_id")

            if org_id:
                if dept_id:
                    cur.execute(
                        "SELECT " + SELECT_COLS + " FROM " + schema + ".leads"
                        " WHERE org_id = %s AND department_id = %s ORDER BY created_at DESC",
                        (org_id, dept_id),
                    )
                else:
                    cur.execute(
                        "SELECT " + SELECT_COLS + " FROM " + schema + ".leads"
                        " WHERE org_id = %s ORDER BY created_at DESC",
                        (org_id,),
                    )
                rows = cur.fetchall()
                return resp(200, {"leads": [row_to_lead(r) for r in rows]})

            if not owner_id:
                return resp(400, {"error": "owner_id or org_id required"})

            cur.execute(
                "SELECT " + SELECT_COLS + " FROM " + schema + ".leads"
                " WHERE owner_id = %s ORDER BY created_at DESC",
                (owner_id,),
            )
            rows = cur.fetchall()
            return resp(200, {"leads": [row_to_lead(r) for r in rows]})

        # ---------- PUT — обновление полей ----------
        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            lead_id = body.get("id")
            owner_id = body.get("owner_id")
            if not lead_id or not owner_id:
                return resp(400, {"error": "id and owner_id required"})

            cur.execute(
                f"SELECT owner_id FROM {schema}.leads WHERE id = %s",
                (lead_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "not found"})
            if str(row[0]) != str(owner_id):
                return resp(403, {"error": "forbidden"})

            cur.execute(
                f"""
                UPDATE {schema}.leads
                SET stage = %s, message = %s, name = %s, phone = %s, email = %s,
                    object_title = %s,
                    budget_from = %s, budget_to = %s,
                    area_from = %s, area_to = %s,
                    preferred_type = %s, preferred_city = %s, preferred_category = %s
                WHERE id = %s
                RETURNING {SELECT_COLS}
                """,
                (
                    body.get("stage", "Лид"),
                    body.get("message", ""),
                    body.get("name", ""),
                    body.get("phone", ""),
                    body.get("email", ""),
                    body.get("object_title", ""),
                    body.get("budget_from") or None,
                    body.get("budget_to") or None,
                    body.get("area_from") or None,
                    body.get("area_to") or None,
                    body.get("preferred_type", ""),
                    body.get("preferred_city", ""),
                    body.get("preferred_category", ""),
                    lead_id,
                ),
            )
            updated = cur.fetchone()
            conn.commit()
            return resp(200, {"ok": True, "lead": row_to_lead(updated)})

        # ---------- DELETE ----------
        if method == "DELETE":
            params = event.get("queryStringParameters") or {}
            lead_id = params.get("id")
            owner_id = params.get("owner_id")
            if not lead_id or not owner_id:
                return resp(400, {"error": "id and owner_id required"})

            cur.execute(
                f"SELECT owner_id FROM {schema}.leads WHERE id = %s",
                (lead_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "not found"})
            if str(row[0]) != str(owner_id):
                return resp(403, {"error": "forbidden"})

            cur.execute(f"DELETE FROM {schema}.leads WHERE id = %s", (lead_id,))
            conn.commit()
            return resp(200, {"ok": True})

        return resp(405, {"error": "Method not allowed"})
    finally:
        cur.close()
        conn.close()