import urllib.request
import base64

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def handler(event: dict, context) -> dict:
    """Прокси для тайлов OpenStreetMap"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    x = params.get("x", "0")
    y = params.get("y", "0")
    z = params.get("z", "0")

    url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"

    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = resp.read()

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "image/png", "Cache-Control": "public, max-age=86400"},
        "body": base64.b64encode(data).decode(),
        "isBase64Encoded": True,
    }