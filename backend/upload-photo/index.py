import json
import os
import base64
import uuid
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Загрузка фото объекта в S3. Принимает base64-строку, возвращает CDN-URL."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = event.get("body") or "{}"
    while isinstance(body, str):
        body = json.loads(body) if body else {}

    image_data = body.get("image")
    content_type = body.get("content_type", "image/jpeg")

    if not image_data:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет данных изображения"})}

    # Убираем data:image/...;base64, префикс если есть
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_data)
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Ошибка декодирования изображения"})}

    ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    key = f"objects/{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=image_bytes, ContentType=content_type)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"url": cdn_url}),
    }
