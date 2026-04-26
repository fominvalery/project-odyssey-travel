"""
Совместные сделки (СЗ) между агентами/брокерами.

GET    /?user_id={uuid}   — список всех СЗ пользователя (initiator или partner),
                            включает имена initiator_name и partner_name (JOIN с users).
POST   /                  — создать СЗ и proposal типа 'create'.
                            Body: {initiator_id, partner_id, deal_type, transaction_type,
                                   object_description, initiator_role, commission_initiator,
                                   commission_partner, commission_base, comment}
PUT    /                  — ответить на proposal (принять или отклонить).
                            Body: {proposal_id, user_id, response: "accept"|"reject"}
                            Если proposal_type='create' и accept → статус deal → 'В работе'.
                            Если proposal_type='status' и accept → статус deal → new_status.
                            Если reject → proposal.response='reject', статус не меняется.
PATCH  /                  — предложить смену статуса сделки.
                            Body: {deal_id, user_id, new_status}
                            Создаёт proposal типа 'status'.
"""
import json
import os

import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    schema = os.environ["MAIN_DB_SCHEMA"]
    return conn, schema


def resp(status, body):
    return {
        "statusCode": status,
        "headers": CORS,
        "body": json.dumps(body, default=str, ensure_ascii=False),
    }


def row_to_deal(r):
    """Преобразует строку из БД в словарь сделки (включая имена участников)."""
    return {
        "id": str(r[0]),
        "initiator_id": str(r[1]) if r[1] else None,
        "partner_id": str(r[2]) if r[2] else None,
        "deal_type": r[3] or "",
        "transaction_type": r[4] or "",
        "object_description": r[5] or "",
        "initiator_role": r[6] or "",
        "commission_initiator": float(r[7]) if r[7] is not None else None,
        "commission_partner": float(r[8]) if r[8] is not None else None,
        "commission_base": r[9] or "",
        "comment": r[10] or "",
        "status": r[11] or "Ожидает подтверждения",
        "created_at": r[12].isoformat() if r[12] else "",
        "updated_at": r[13].isoformat() if r[13] else "",
        "initiator_name": r[14] or "",
        "partner_name": r[15] or "",
    }


def row_to_proposal(r):
    """Преобразует строку из БД в словарь proposal."""
    return {
        "id": str(r[0]),
        "deal_id": str(r[1]) if r[1] else None,
        "proposal_type": r[2] or "",
        "proposed_by": str(r[3]) if r[3] else None,
        "new_status": r[4] or "",
        "response": r[5] or "pending",
        "created_at": r[6].isoformat() if r[6] else "",
    }


DEAL_SELECT = """
    SELECT
        d.id,
        d.initiator_id,
        d.partner_id,
        d.deal_type,
        d.transaction_type,
        d.object_description,
        d.initiator_role,
        d.commission_initiator,
        d.commission_partner,
        d.commission_base,
        d.comment,
        d.status,
        d.created_at,
        d.updated_at,
        ui.name AS initiator_name,
        up.name AS partner_name
    FROM {schema}.joint_deals d
    LEFT JOIN {schema}.users ui ON ui.id = d.initiator_id
    LEFT JOIN {schema}.users up ON up.id = d.partner_id
"""

PROPOSAL_SELECT = """
    SELECT id, deal_id, proposal_type, proposed_by, new_status, response, created_at
    FROM {schema}.joint_deal_proposals
"""


def handler(event: dict, context) -> dict:
    """Обработчик совместных сделок: CRUD сделок и управление proposal."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    conn, schema = get_conn()
    cur = conn.cursor()

    try:
        # ── GET — список СЗ пользователя ──────────────────────────────────────
        if method == "GET":
            params = event.get("queryStringParameters") or {}
            user_id = params.get("user_id")
            if not user_id:
                return resp(400, {"error": "user_id required"})

            sql = (
                DEAL_SELECT.format(schema=schema)
                + " WHERE d.initiator_id = %s OR d.partner_id = %s"
                + " ORDER BY d.created_at DESC"
            )
            cur.execute(sql, (user_id, user_id))
            rows = cur.fetchall()
            return resp(200, {"deals": [row_to_deal(r) for r in rows]})

        # ── POST — создать СЗ + proposal типа 'create' ───────────────────────
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            initiator_id = body.get("initiator_id")
            partner_id = body.get("partner_id")
            deal_type = (body.get("deal_type") or "").strip()
            transaction_type = (body.get("transaction_type") or "").strip()

            if not initiator_id or not partner_id or not deal_type or not transaction_type:
                return resp(
                    400,
                    {"error": "initiator_id, partner_id, deal_type, transaction_type required"},
                )

            # Создаём сделку
            cur.execute(
                f"""
                INSERT INTO {schema}.joint_deals
                    (initiator_id, partner_id, deal_type, transaction_type,
                     object_description, initiator_role,
                     commission_initiator, commission_partner, commission_base,
                     comment, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    initiator_id,
                    partner_id,
                    deal_type,
                    transaction_type,
                    (body.get("object_description") or "").strip(),
                    (body.get("initiator_role") or "").strip(),
                    body.get("commission_initiator") or None,
                    body.get("commission_partner") or None,
                    (body.get("commission_base") or "").strip(),
                    (body.get("comment") or "").strip(),
                    "Ожидает подтверждения",
                ),
            )
            deal_id = cur.fetchone()[0]

            # Создаём proposal типа 'create'
            cur.execute(
                f"""
                INSERT INTO {schema}.joint_deal_proposals
                    (deal_id, proposal_type, proposed_by, new_status, response)
                VALUES (%s, 'create', %s, %s, 'pending')
                RETURNING id, deal_id, proposal_type, proposed_by, new_status, response, created_at
                """,
                (deal_id, initiator_id, "В работе"),
            )
            proposal_row = cur.fetchone()

            # Загружаем сделку с JOIN
            sql_deal = (
                DEAL_SELECT.format(schema=schema)
                + " WHERE d.id = %s"
            )
            cur.execute(sql_deal, (deal_id,))
            deal_row = cur.fetchone()

            conn.commit()
            return resp(
                200,
                {
                    "ok": True,
                    "deal": row_to_deal(deal_row),
                    "proposal": row_to_proposal(proposal_row),
                },
            )

        # ── PUT — ответить на proposal ────────────────────────────────────────
        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            proposal_id = body.get("proposal_id")
            user_id = body.get("user_id")
            response = body.get("response")

            if not proposal_id or not user_id or response not in ("accept", "reject"):
                return resp(
                    400,
                    {"error": "proposal_id, user_id and response ('accept'|'reject') required"},
                )

            # Загружаем proposal
            cur.execute(
                f"""
                SELECT id, deal_id, proposal_type, proposed_by, new_status, response, created_at
                FROM {schema}.joint_deal_proposals
                WHERE id = %s
                """,
                (proposal_id,),
            )
            proposal_row = cur.fetchone()
            if not proposal_row:
                return resp(404, {"error": "proposal not found"})

            if str(proposal_row[3]) == str(user_id):
                return resp(403, {"error": "Нельзя отвечать на собственное предложение"})

            if proposal_row[5] != "pending":
                return resp(409, {"error": "proposal уже обработан"})

            deal_id = proposal_row[1]
            proposal_type = proposal_row[2]
            new_status = proposal_row[4]

            # Обновляем proposal
            cur.execute(
                f"""
                UPDATE {schema}.joint_deal_proposals
                SET response = %s
                WHERE id = %s
                RETURNING id, deal_id, proposal_type, proposed_by, new_status, response, created_at
                """,
                (response, proposal_id),
            )

            if response == "accept":
                # Определяем целевой статус сделки
                if proposal_type == "create":
                    target_status = "В работе"
                elif proposal_type == "status":
                    target_status = new_status
                else:
                    target_status = new_status

                cur.execute(
                    f"""
                    UPDATE {schema}.joint_deals
                    SET status = %s, updated_at = NOW()
                    WHERE id = %s
                    """,
                    (target_status, deal_id),
                )

            # Загружаем итоговую сделку с JOIN
            sql_deal = DEAL_SELECT.format(schema=schema) + " WHERE d.id = %s"
            cur.execute(sql_deal, (deal_id,))
            deal_row = cur.fetchone()

            conn.commit()
            return resp(200, {"ok": True, "deal": row_to_deal(deal_row)})

        # ── PATCH — предложить смену статуса ─────────────────────────────────
        if method == "PATCH":
            body = json.loads(event.get("body") or "{}")
            deal_id = body.get("deal_id")
            user_id = body.get("user_id")
            new_status = (body.get("new_status") or "").strip()

            if not deal_id or not user_id or not new_status:
                return resp(400, {"error": "deal_id, user_id, new_status required"})

            # Проверяем, что пользователь участник сделки
            cur.execute(
                f"""
                SELECT id, initiator_id, partner_id
                FROM {schema}.joint_deals
                WHERE id = %s
                """,
                (deal_id,),
            )
            deal_check = cur.fetchone()
            if not deal_check:
                return resp(404, {"error": "deal not found"})

            if str(deal_check[1]) != str(user_id) and str(deal_check[2]) != str(user_id):
                return resp(403, {"error": "Нет доступа к этой сделке"})

            # Создаём proposal типа 'status'
            cur.execute(
                f"""
                INSERT INTO {schema}.joint_deal_proposals
                    (deal_id, proposal_type, proposed_by, new_status, response)
                VALUES (%s, 'status', %s, %s, 'pending')
                RETURNING id, deal_id, proposal_type, proposed_by, new_status, response, created_at
                """,
                (deal_id, user_id, new_status),
            )
            proposal_row = cur.fetchone()
            conn.commit()
            return resp(200, {"ok": True, "proposal": row_to_proposal(proposal_row)})

        return resp(405, {"error": "method not allowed"})

    except Exception as e:
        conn.rollback()
        return resp(500, {"error": str(e)})
    finally:
        cur.close()
        conn.close()
