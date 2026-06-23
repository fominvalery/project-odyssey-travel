"""
Подряды: CRUD + фиксации клиентов.
GET    /           — список подрядов (публичный, контакты скрыты для не-менеджеров)
GET    /?id=<uuid> — один подряд
POST   /           — создать подряд (только менеджер/РОП)
PUT    /           — редактировать подряд (только менеджер/РОП)
GET    /?fixations=1 — список фиксаций
POST   / с action=fixation — зафиксировать клиента (брокер)
PUT    / с action=fixation_status — обновить статус фиксации (менеджер/РОП)
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Admin-Token",
}

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def is_admin(event: dict) -> bool:
    headers = event.get("headers") or {}
    token = headers.get("X-Admin-Token") or headers.get("x-admin-token") or ""
    return token == ADMIN_TOKEN and bool(ADMIN_TOKEN)


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {**CORS, "Access-Control-Max-Age": "86400"}, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    headers = event.get("headers") or {}
    user_id = headers.get("X-User-Id") or headers.get("x-user-id") or ""

    conn = get_conn()
    cur = conn.cursor()

    # ── GET ──────────────────────────────────────────────────────────────────
    if method == "GET":
        admin = is_admin(event)

        # Список фиксаций (только для менеджеров/РОП)
        if params.get("fixations") == "1":
            if not admin:
                conn.close()
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}
            cur.execute(
                """SELECT cf.id, cf.contractor_offer_id, co.title as offer_title,
                          cf.broker_id, cf.client_name, cf.client_phone, cf.client_email,
                          cf.notes, cf.status, cf.created_at
                   FROM contractor_fixations cf
                   LEFT JOIN contractor_offers co ON co.id = cf.contractor_offer_id
                   ORDER BY cf.created_at DESC LIMIT 200"""
            )
            cols = ["id", "contractor_offer_id", "offer_title", "broker_id",
                    "client_name", "client_phone", "client_email", "notes", "status", "created_at"]
            rows = cur.fetchall()
            conn.close()
            result = []
            for row in rows:
                r = dict(zip(cols, row))
                r["id"] = str(r["id"]) if r["id"] else None
                r["contractor_offer_id"] = str(r["contractor_offer_id"]) if r["contractor_offer_id"] else None
                r["created_at"] = str(r["created_at"])
                result.append(r)
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"fixations": result}, ensure_ascii=False)}

        # Мои фиксации (брокер)
        if params.get("my_fixations") == "1" and user_id:
            cur.execute(
                """SELECT cf.id, cf.contractor_offer_id, co.title as offer_title,
                          cf.client_name, cf.client_phone, cf.client_email,
                          cf.notes, cf.status, cf.created_at
                   FROM contractor_fixations cf
                   LEFT JOIN contractor_offers co ON co.id = cf.contractor_offer_id
                   WHERE cf.broker_id = %s
                   ORDER BY cf.created_at DESC""",
                (user_id,)
            )
            cols = ["id", "contractor_offer_id", "offer_title",
                    "client_name", "client_phone", "client_email", "notes", "status", "created_at"]
            rows = cur.fetchall()
            conn.close()
            result = []
            for row in rows:
                r = dict(zip(cols, row))
                r["id"] = str(r["id"]) if r["id"] else None
                r["contractor_offer_id"] = str(r["contractor_offer_id"]) if r["contractor_offer_id"] else None
                r["created_at"] = str(r["created_at"])
                result.append(r)
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"fixations": result}, ensure_ascii=False)}

        # Один подряд по ID
        if params.get("id"):
            cur.execute(
                "SELECT id, title, type, company_name, company_phone, company_email, company_website, reward, reward_type, description, region, status, logo_url, photos, created_at FROM contractor_offers WHERE id = %s",
                (params["id"],)
            )
            row = cur.fetchone()
            conn.close()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "not found"})}
            cols = ["id", "title", "type", "company_name", "company_phone", "company_email",
                    "company_website", "reward", "reward_type", "description", "region",
                    "status", "logo_url", "photos", "created_at"]
            o = dict(zip(cols, row))
            o["id"] = str(o["id"])
            o["created_at"] = str(o["created_at"])
            o["photos"] = o["photos"] or []
            # Скрываем контакты для не-менеджеров
            if not admin:
                o.pop("company_phone", None)
                o.pop("company_email", None)
                o.pop("company_website", None)
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"offer": o}, ensure_ascii=False)}

        # Список подрядов
        status_filter = params.get("status", "active")
        type_filter = params.get("type", "")
        where = ["status = %s"]
        args = [status_filter]
        if type_filter:
            where.append("type = %s")
            args.append(type_filter)

        cur.execute(
            f"SELECT id, title, type, company_name, company_phone, company_email, company_website, reward, reward_type, description, region, status, logo_url, photos, created_at FROM contractor_offers WHERE {' AND '.join(where)} ORDER BY created_at DESC LIMIT 100",
            args
        )
        cols = ["id", "title", "type", "company_name", "company_phone", "company_email",
                "company_website", "reward", "reward_type", "description", "region",
                "status", "logo_url", "photos", "created_at"]
        rows = cur.fetchall()

        cur.execute(f"SELECT COUNT(*) FROM contractor_offers WHERE {' AND '.join(where)}", args)
        total = cur.fetchone()[0]
        conn.close()

        result = []
        for row in rows:
            o = dict(zip(cols, row))
            o["id"] = str(o["id"])
            o["created_at"] = str(o["created_at"])
            o["photos"] = o["photos"] or []
            if not admin:
                o.pop("company_phone", None)
                o.pop("company_email", None)
                o.pop("company_website", None)
            result.append(o)
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"offers": result, "total": total}, ensure_ascii=False)}

    # ── POST ─────────────────────────────────────────────────────────────────
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "")

        # Фиксация клиента (брокер)
        if action == "fixation":
            if not user_id:
                conn.close()
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}
            offer_id = body.get("contractor_offer_id") or None
            client_name = (body.get("client_name") or "").strip()
            if not client_name:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "client_name обязателен"})}
            cur.execute(
                "INSERT INTO contractor_fixations (contractor_offer_id, broker_id, client_name, client_phone, client_email, notes, status) VALUES (%s,%s,%s,%s,%s,%s,'pending') RETURNING id",
                (offer_id, user_id, client_name, body.get("client_phone") or None, body.get("client_email") or None, body.get("notes") or None)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": str(new_id)}, ensure_ascii=False)}

        # Создать подряд (менеджер/РОП)
        if not is_admin(event):
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}
        title = (body.get("title") or "").strip()
        type_ = (body.get("type") or "").strip()
        company_name = (body.get("company_name") or "").strip()
        reward = (body.get("reward") or "").strip()
        if not title or not type_ or not company_name or not reward:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "title, type, company_name, reward обязательны"})}
        cur.execute(
            """INSERT INTO contractor_offers (title, type, company_name, company_phone, company_email, company_website, reward, reward_type, description, region, status, logo_url, photos, created_by)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (
                title, type_, company_name,
                body.get("company_phone") or None,
                body.get("company_email") or None,
                body.get("company_website") or None,
                reward,
                body.get("reward_type", "percent"),
                body.get("description") or None,
                body.get("region") or None,
                body.get("status", "active"),
                body.get("logo_url") or None,
                json.dumps(body.get("photos", [])),
                body.get("created_by") or None,
            )
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": str(new_id)}, ensure_ascii=False)}

    # ── PUT ──────────────────────────────────────────────────────────────────
    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "")

        # Обновить статус фиксации
        if action == "fixation_status":
            if not is_admin(event):
                conn.close()
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}
            fix_id = body.get("id")
            new_status = body.get("status")
            if not fix_id or not new_status:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id и status обязательны"})}
            cur.execute("UPDATE contractor_fixations SET status=%s, updated_at=NOW() WHERE id=%s", (new_status, fix_id))
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # Редактировать подряд
        if not is_admin(event):
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}
        offer_id = body.get("id")
        if not offer_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id обязателен"})}
        fields = ["updated_at = NOW()"]
        args = []
        for f in ["title", "type", "company_name", "company_phone", "company_email",
                  "company_website", "reward", "reward_type", "description", "region", "status", "logo_url"]:
            if f in body:
                fields.append(f"{f} = %s")
                args.append(body[f])
        if "photos" in body:
            fields.append("photos = %s")
            args.append(json.dumps(body["photos"]))
        args.append(offer_id)
        cur.execute(f"UPDATE contractor_offers SET {', '.join(fields)} WHERE id = %s", tuple(args))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method not allowed"})}
