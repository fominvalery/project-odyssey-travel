"""
Аналитика и трекинг просмотров объектов.
POST /track    — зафиксировать просмотр объекта (публично)
GET  /metrics  — метрики дашборда: ?user_id=... | ?org_id=...&department_id=...
                  ?period=7|30|90 (дней, по умолчанию 30)
GET  /views    — суммарные просмотры по списку объектов: ?ids=uuid1,uuid2,...
"""
import os
import json
import psycopg2
from datetime import datetime, timedelta, timezone

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema


def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body)}


def parse_period(params):
    try:
        p = int(params.get("period") or 30)
    except (TypeError, ValueError):
        p = 30
    if p not in (7, 30, 90):
        p = 30
    return p


def handler(event: dict, context) -> dict:
    """Аналитика дашборда и трекинг просмотров объектов."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = (event.get("queryStringParameters") or {}).get("action") or ""
    raw_path = event.get("path") or ""
    url = (event.get("url") or "").lower()
    is_track = method == "POST" or "track" in raw_path.lower() or "track" in url
    is_views = "views" in raw_path.lower() or "views" in url
    params = event.get("queryStringParameters") or {}
    if not is_track and params.get("action") == "track":
        is_track = True
    if not is_views and params.get("action") == "views":
        is_views = True

    conn, schema = get_conn()
    cur = conn.cursor()

    try:
        # ---------- POST — зафиксировать просмотр ----------
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            object_id = body.get("object_id")
            if not object_id:
                return resp(400, {"error": "object_id required"})
            viewer_id = body.get("viewer_id") or None
            source = (body.get("source") or "")[:64]
            ua = ((event.get("headers") or {}).get("User-Agent") or "")[:500]
            ip = ((event.get("requestContext") or {}).get("identity") or {}).get("sourceIp") or ""

            cur.execute(
                f"SELECT user_id FROM {schema}.objects WHERE id = %s",
                (object_id,),
            )
            row = cur.fetchone()
            if not row:
                return resp(404, {"error": "object not found"})
            owner_id = str(row[0]) if row[0] else None

            cur.execute(
                f"INSERT INTO {schema}.object_views"
                " (object_id, owner_id, viewer_id, source, ip, user_agent)"
                " VALUES (%s,%s,%s,%s,%s,%s)",
                (object_id, owner_id, viewer_id, source, ip, ua),
            )
            conn.commit()
            return resp(200, {"ok": True})

        # ---------- GET /views — счётчики просмотров по объектам ----------
        if is_views:
            ids_raw = params.get("ids") or ""
            ids = [x.strip() for x in ids_raw.split(",") if x.strip()]
            if not ids:
                return resp(200, {"counts": {}})
            placeholders = ",".join(["%s"] * len(ids))
            cur.execute(
                f"SELECT object_id::text, COUNT(*) FROM {schema}.object_views"
                f" WHERE object_id IN ({placeholders}) GROUP BY object_id",
                tuple(ids),
            )
            counts = {str(r[0]): int(r[1]) for r in cur.fetchall()}
            return resp(200, {"counts": counts})

        # ---------- GET /metrics — сводка для аналитики ----------
        period = parse_period(params)
        user_id = params.get("user_id")
        org_id = params.get("org_id")
        dept_id = params.get("department_id")
        caller_id = (event.get("headers") or {}).get("X-User-Id", "")

        # Определяем фильтр по объектам
        if org_id:
            if not caller_id:
                return resp(403, {"error": "forbidden"})
            cur.execute(
                f"SELECT 1 FROM {schema}.org_memberships"
                " WHERE user_id=%s AND organization_id=%s AND status='active' LIMIT 1",
                (caller_id, org_id),
            )
            if not cur.fetchone():
                return resp(403, {"error": "forbidden"})
            if dept_id:
                obj_filter = "org_id = %s AND department_id = %s"
                obj_args = (org_id, dept_id)
                lead_filter = (
                    "l.org_id = %s AND ("
                    " l.department_id = %s OR EXISTS ("
                    f"  SELECT 1 FROM {schema}.org_memberships om"
                    "   WHERE om.user_id = l.owner_id AND om.organization_id = %s"
                    "   AND om.department_id = %s AND om.status = 'active'"
                    " ))"
                )
                lead_args = (org_id, dept_id, org_id, dept_id)
            else:
                obj_filter = "org_id = %s"
                obj_args = (org_id,)
                lead_filter = "l.org_id = %s"
                lead_args = (org_id,)
        elif user_id:
            obj_filter = "user_id = %s"
            obj_args = (user_id,)
            lead_filter = "l.owner_id = %s"
            lead_args = (user_id,)
        else:
            return resp(400, {"error": "user_id or org_id required"})

        # Объекты пользователя/агентства
        cur.execute(
            f"SELECT id FROM {schema}.objects WHERE {obj_filter}",
            obj_args,
        )
        obj_ids = [str(r[0]) for r in cur.fetchall()]
        objects_count = len(obj_ids)

        since = datetime.now(timezone.utc) - timedelta(days=period)

        # Просмотры за период
        if obj_ids:
            placeholders = ",".join(["%s"] * len(obj_ids))
            cur.execute(
                f"SELECT COUNT(*) FROM {schema}.object_views"
                f" WHERE object_id IN ({placeholders}) AND created_at >= %s",
                tuple(obj_ids) + (since,),
            )
            total_views = int(cur.fetchone()[0] or 0)
            cur.execute(
                f"SELECT DATE(created_at AT TIME ZONE 'UTC') AS d, COUNT(*)"
                f" FROM {schema}.object_views"
                f" WHERE object_id IN ({placeholders}) AND created_at >= %s"
                " GROUP BY d",
                tuple(obj_ids) + (since,),
            )
            views_by_day = {str(r[0]): int(r[1]) for r in cur.fetchall()}
        else:
            total_views = 0
            views_by_day = {}

        # Лиды и заявки за период
        cur.execute(
            f"SELECT stage, DATE(created_at AT TIME ZONE 'UTC') AS d, COUNT(*)"
            f" FROM {schema}.leads l"
            f" WHERE {lead_filter} AND l.created_at >= %s"
            " GROUP BY stage, d",
            lead_args + (since,),
        )
        leads_total = 0
        requests_total = 0
        leads_by_day = {}
        requests_by_day = {}
        for stage, d, cnt in cur.fetchall():
            d_str = str(d)
            cnt = int(cnt)
            requests_total += cnt
            requests_by_day[d_str] = requests_by_day.get(d_str, 0) + cnt
            if stage not in ("Отказ",):
                leads_total += cnt
                leads_by_day[d_str] = leads_by_day.get(d_str, 0) + cnt

        # Сделки (закрытые лиды или agency_deals)
        deals_total = 0
        try:
            cur.execute(
                f"SELECT COUNT(*) FROM {schema}.leads l"
                f" WHERE {lead_filter} AND l.stage = 'Сделка' AND l.created_at >= %s",
                lead_args + (since,),
            )
            deals_total = int(cur.fetchone()[0] or 0)
        except Exception:
            conn.rollback()
            deals_total = 0

        conversion = round((requests_total / total_views * 100), 1) if total_views > 0 else 0.0

        # График по дням
        activity = []
        for i in range(period - 1, -1, -1):
            day = (datetime.now(timezone.utc) - timedelta(days=i)).date()
            day_str = str(day)
            label = day.strftime("%d.%m")
            activity.append({
                "date": label,
                "просмотры": views_by_day.get(day_str, 0),
                "заявки": requests_by_day.get(day_str, 0),
                "лиды": leads_by_day.get(day_str, 0),
            })

        return resp(200, {
            "period": period,
            "views": total_views,
            "leads": leads_total,
            "requests": requests_total,
            "deals": deals_total,
            "objects": objects_count,
            "conversion": conversion,
            "activity": activity,
        })

    except Exception as e:
        conn.rollback()
        return resp(500, {"error": str(e)})
    finally:
        cur.close()
        conn.close()
