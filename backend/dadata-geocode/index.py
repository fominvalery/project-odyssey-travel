import os
import json
import urllib.request
import urllib.parse

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Прокси для DaData геокодера — подсказки адресов с координатами"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    api_key = os.environ["DADATA_API_KEY"]  # v2
    secret_key = os.environ.get("DADATA_SECRET_KEY", "")
    params = event.get("queryStringParameters") or {}
    query = params.get("q", "")

    if not query:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "q required"})}

    url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address"
    payload = json.dumps({"query": query, "count": 5}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Token {api_key}",
            "X-Secret": secret_key,
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())

    suggestions = []
    for s in data.get("suggestions", []):
        geo = s.get("data", {})
        lat = geo.get("geo_lat")
        lon = geo.get("geo_lon")
        print(f"[DADATA] value={s.get('value')} lat={lat} lon={lon}")
        suggestions.append({
            "display_name": s.get("value", ""),
            "lat": lat,
            "lon": lon,
        })

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"suggestions": suggestions}),
    }