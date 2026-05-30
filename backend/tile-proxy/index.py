import urllib.request
import urllib.error
import base64
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def handler(event: dict, context) -> dict:
    """Прокси для тайлов карты"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    x = params.get("x", "0")
    y = params.get("y", "0")
    z = params.get("z", "0")

    url = f"https://tile1.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1"
    logger.info(f"Fetching tile: {url}")

    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            logger.info(f"OK {len(data)} bytes")
    except urllib.error.HTTPError as e:
        logger.error(f"HTTPError {e.code}: {e.reason} for {url}")
        return {"statusCode": 502, "headers": CORS, "body": f"Upstream error: {e.code}"}
    except Exception as e:
        logger.error(f"Error: {e}")
        return {"statusCode": 502, "headers": CORS, "body": str(e)}

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "image/png", "Cache-Control": "public, max-age=86400"},
        "body": base64.b64encode(data).decode(),
        "isBase64Encoded": True,
    }