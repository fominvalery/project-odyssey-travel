"""
Супер-админ API: список пользователей, поиск, удаление.
Также — инструменты для тестирования системы сроков размещения объектов.
Защищён секретным токеном ADMIN_SECRET.
"""
import os
import json
import urllib.request
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

SUBSCRIPTION_CHECKER_URL = "https://functions.poehali.dev/34cd0693-d330-408d-a6fe-1bdce31950d8"


def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, default=str)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    schema = os.environ["MAIN_DB_SCHEMA"]
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # Авторизация: либо X-Admin-Token, либо X-User-Id суперадмина
    headers_lower = {str(k).lower(): v for k, v in (event.get("headers") or {}).items()}
    admin_secret = os.environ.get("ADMIN_SECRET", "")
    token = headers_lower.get("x-admin-token", "")
    user_id_hdr = headers_lower.get("x-user-id", "")

    authorized = False
    if token and admin_secret and token == admin_secret:
        authorized = True
    elif user_id_hdr:
        try:
            cur.execute(
                f"SELECT is_superadmin FROM {schema}.users WHERE id=%s",
                (user_id_hdr,),
            )
            row = cur.fetchone()
            if row and bool(row[0]):
                authorized = True
        except Exception:
            conn.rollback()

    if not authorized:
        cur.close()
        conn.close()
        return resp(403, {"error": "Forbidden"})

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    qs = event.get("queryStringParameters") or {}

    try:
        # ─────────── DELETE /users/{id} ───────────
        if method == "DELETE" and "/users/" in path:
            user_id = path.split("/users/")[-1].strip("/")
            cur.execute(f"DELETE FROM {schema}.users WHERE id = %s", (user_id,))
            conn.commit()
            return resp(200, {"ok": True})

        # ─────────── POST: actions для тестирования сроков ───────────
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            action = body.get("action")

            # Симуляция понижения broker → basic
            if action == "force_downgrade":
                user_id = body.get("user_id")
                if not user_id:
                    return resp(400, {"error": "user_id required"})

                # Проверяем — не в АН ли пользователь
                cur.execute(
                    f"SELECT 1 FROM {schema}.org_memberships"
                    f" WHERE user_id=%s AND status='active' LIMIT 1",
                    (user_id,),
                )
                in_org = cur.fetchone() is not None

                # Сбрасываем тариф
                cur.execute(
                    f"UPDATE {schema}.users SET status='basic', plan='basic',"
                    f" subscription_end_at=NULL, grace_period_end_at=NULL,"
                    f" updated_at=NOW() WHERE id=%s",
                    (user_id,),
                )

                downgraded_objects = 0
                if not in_org:
                    cur.execute(
                        f"WITH ranked AS ("
                        f"  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn"
                        f"  FROM {schema}.objects"
                        f"  WHERE user_id=%s AND published=TRUE AND status='Активен'"
                        f")"
                        f" UPDATE {schema}.objects o"
                        f" SET expires_at = CASE WHEN r.rn <= 3 THEN NOW() + INTERVAL '30 days' ELSE NOW() + INTERVAL '3 days' END,"
                        f"     requires_payment = CASE WHEN r.rn <= 3 THEN FALSE ELSE TRUE END,"
                        f"     auto_unpublished=FALSE, expiry_notified_at=NULL"
                        f" FROM ranked r WHERE o.id = r.id"
                        f" RETURNING o.id",
                        (user_id,),
                    )
                    downgraded_objects = len(cur.fetchall() or [])

                conn.commit()
                return resp(200, {
                    "ok": True,
                    "in_org": in_org,
                    "downgraded_objects": downgraded_objects,
                    "message": "Член АН — объекты не урезаны" if in_org else f"Урезано объектов: {downgraded_objects}",
                })

            # Восстановить broker (для отката теста)
            if action == "restore_broker":
                user_id = body.get("user_id")
                days = int(body.get("days", 30))
                if not user_id:
                    return resp(400, {"error": "user_id required"})

                cur.execute(
                    f"UPDATE {schema}.users SET status='broker', plan='pro',"
                    f" subscription_end_at = NOW() + (%s::int * INTERVAL '1 day'),"
                    f" grace_period_end_at = NOW() + (%s::int * INTERVAL '1 day') + INTERVAL '3 days',"
                    f" updated_at=NOW() WHERE id=%s",
                    (days, days, user_id),
                )
                cur.execute(
                    f"UPDATE {schema}.objects"
                    f" SET expires_at=NULL, requires_payment=FALSE, auto_unpublished=FALSE,"
                    f"     published = CASE WHEN status='Активен' THEN TRUE ELSE published END,"
                    f"     expiry_notified_at=NULL"
                    f" WHERE user_id=%s",
                    (user_id,),
                )
                conn.commit()
                return resp(200, {"ok": True, "message": f"Клуб восстановлен на {days} дней"})

            # Установить expires_at объекту
            if action == "set_expiry":
                obj_id = body.get("object_id")
                days = body.get("days")
                if not obj_id:
                    return resp(400, {"error": "object_id required"})
                if days is None:
                    cur.execute(
                        f"UPDATE {schema}.objects SET expires_at=NULL,"
                        f" auto_unpublished=FALSE, expiry_notified_at=NULL WHERE id=%s",
                        (obj_id,),
                    )
                else:
                    cur.execute(
                        f"UPDATE {schema}.objects"
                        f" SET expires_at = NOW() + (%s::int * INTERVAL '1 day'),"
                        f"     auto_unpublished=FALSE, expiry_notified_at=NULL"
                        f" WHERE id=%s",
                        (int(days), obj_id),
                    )
                conn.commit()
                return resp(200, {"ok": True})

            # Снять флаг requires_payment
            if action == "clear_requires_payment":
                obj_id = body.get("object_id")
                if not obj_id:
                    return resp(400, {"error": "object_id required"})
                cur.execute(
                    f"UPDATE {schema}.objects SET requires_payment=FALSE WHERE id=%s",
                    (obj_id,),
                )
                conn.commit()
                return resp(200, {"ok": True})

            # Запуск cron вручную
            if action == "run_cron":
                try:
                    req = urllib.request.Request(SUBSCRIPTION_CHECKER_URL, method="GET")
                    with urllib.request.urlopen(req, timeout=25) as r:
                        data = json.loads(r.read().decode("utf-8"))
                    return resp(200, {"ok": True, "result": data})
                except Exception as e:
                    return resp(500, {"error": f"cron failed: {str(e)}"})

            return resp(400, {"error": f"Unknown action: {action}"})

        # ─────────── GET ───────────
        # GET /?action=expiry_status — сводка по срокам
        if method == "GET" and qs.get("action") == "expiry_status":
            cur.execute(f"""
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE expires_at IS NULL) AS unlimited,
                    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at > NOW() AND auto_unpublished=FALSE) AS active_with_expiry,
                    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= NOW() + INTERVAL '3 days' AND expires_at > NOW() AND auto_unpublished=FALSE) AS expiring_soon,
                    COUNT(*) FILTER (WHERE requires_payment = TRUE) AS requires_payment,
                    COUNT(*) FILTER (WHERE auto_unpublished = TRUE) AS auto_unpublished
                FROM {schema}.objects
            """)
            row = cur.fetchone()
            summary = {
                "total": int(row[0] or 0),
                "unlimited": int(row[1] or 0),
                "active_with_expiry": int(row[2] or 0),
                "expiring_soon": int(row[3] or 0),
                "requires_payment": int(row[4] or 0),
                "auto_unpublished": int(row[5] or 0),
            }

            # Топ-20 объектов с ближайшим истечением
            cur.execute(f"""
                SELECT o.id, o.title, o.user_id, u.email, u.status, o.expires_at,
                       o.requires_payment, o.auto_unpublished, o.published
                FROM {schema}.objects o
                LEFT JOIN {schema}.users u ON u.id = o.user_id
                WHERE o.expires_at IS NOT NULL OR o.requires_payment = TRUE OR o.auto_unpublished = TRUE
                ORDER BY o.expires_at NULLS LAST
                LIMIT 20
            """)
            objects = [
                {
                    "id": str(r[0]),
                    "title": r[1] or "Без названия",
                    "user_id": str(r[2]) if r[2] else None,
                    "user_email": r[3] or "",
                    "user_status": r[4] or "",
                    "expires_at": r[5].isoformat() if r[5] else None,
                    "requires_payment": bool(r[6]),
                    "auto_unpublished": bool(r[7]),
                    "published": bool(r[8]),
                }
                for r in cur.fetchall()
            ]

            return resp(200, {"summary": summary, "objects": objects})

        # GET /users — список всех пользователей (старый функционал)
        cur.execute(f"""
            SELECT id, name, email, phone, company, plan, status, avatar_url, created_at
            FROM {schema}.users
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        users = [
            {
                "id": str(r[0]),
                "name": r[1],
                "email": r[2],
                "phone": r[3],
                "company": r[4] or "",
                "plan": r[5] or "green",
                "status": r[6] or "resident",
                "avatar": r[7] or "",
                "created_at": r[8].isoformat() if r[8] else "",
            }
            for r in rows
        ]
        return resp(200, {"users": users})

    finally:
        cur.close()
        conn.close()