"""
Простой PDF-генератор презентации объекта недвижимости.
POST /  body: {"object_id": "uuid"}
Возвращает: {"pdf_url": "https://cdn..."}
"""
import json
import os
import io
import uuid
import urllib.request

import boto3
import psycopg2

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    "Content-Type": "application/json",
}

PAGE_W, PAGE_H = A4
MARGIN = 40

FONT_S3_KEY = "fonts/DejaVuSans.ttf"
FONT_SOURCES = [
    "https://github.com/prawnpdf/prawn/raw/master/data/fonts/DejaVuSans.ttf",
    "https://raw.githubusercontent.com/prawnpdf/prawn/master/data/fonts/DejaVuSans.ttf",
    "https://sourceforge.net/projects/dejavu/files/dejavu/2.37/dejavu-fonts-ttf-2.37.zip/download",
]
FONT_REGISTERED = False


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def _download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read()


def ensure_font():
    """Регистрирует DejaVu Sans (кириллица). Кешируется в S3 и /tmp."""
    global FONT_REGISTERED
    if FONT_REGISTERED:
        return "DejaVu"

    font_path = "/tmp/dejavu.ttf"

    if not (os.path.exists(font_path) and os.path.getsize(font_path) > 100000):
        s3 = _s3_client()
        loaded = False
        try:
            obj = s3.get_object(Bucket="files", Key=FONT_S3_KEY)
            data = obj["Body"].read()
            if len(data) > 100000:
                with open(font_path, "wb") as f:
                    f.write(data)
                loaded = True
        except Exception:
            pass

        if not loaded:
            data = b""
            for src in FONT_SOURCES[:2]:
                try:
                    candidate = _download(src)
                    if len(candidate) > 100000 and candidate[:4] in (b"\x00\x01\x00\x00", b"OTTO", b"true"):
                        data = candidate
                        break
                except Exception:
                    continue
            if len(data) < 100000:
                return "Helvetica"
            with open(font_path, "wb") as f:
                f.write(data)
            try:
                s3.put_object(Bucket="files", Key=FONT_S3_KEY, Body=data,
                              ContentType="font/ttf")
            except Exception:
                pass

    try:
        pdfmetrics.registerFont(TTFont("DejaVu", font_path))
        FONT_REGISTERED = True
        return "DejaVu"
    except Exception:
        return "Helvetica"


def fetch_object(object_id: str) -> dict:
    dsn = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(dsn)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, category, type, title, city, address, price, area, description, "
            "yield_percent, extra_fields, photos "
            f"FROM objects WHERE id = '{object_id}'"
        )
        row = cur.fetchone()
        cur.close()
        if not row:
            return {}
        return {
            "id": str(row[0]),
            "category": row[1] or "",
            "type": row[2] or "",
            "title": row[3] or "",
            "city": row[4] or "",
            "address": row[5] or "",
            "price": row[6] or "",
            "area": row[7] or "",
            "description": row[8] or "",
            "yield_percent": row[9] or "",
            "extra_fields": row[10] or {},
            "photos": list(row[11] or []),
        }
    finally:
        conn.close()


def download_image(url: str) -> bytes:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read()
    except Exception:
        return b""


def draw_wrapped(c, text, x, y, max_width, font, size, leading):
    c.setFont(font, size)
    words = (text or "").split()
    line = ""
    for w in words:
        candidate = (line + " " + w).strip()
        if c.stringWidth(candidate, font, size) <= max_width:
            line = candidate
        else:
            c.drawString(x, y, line)
            y -= leading
            line = w
            if y < MARGIN + 60:
                c.showPage()
                c.setFont(font, size)
                y = PAGE_H - MARGIN
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def build_pdf(obj: dict) -> bytes:
    font = ensure_font()
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    # ── Обложка ─────────────────────────────────────────────────────────
    c.setFillColorRGB(0.1, 0.15, 0.3)
    c.rect(0, PAGE_H - 200, PAGE_W, 200, stroke=0, fill=1)
    c.setFillColorRGB(1, 1, 1)
    c.setFont(font, 24)
    c.drawString(MARGIN, PAGE_H - 90, obj.get("title", "Объект"))
    c.setFont(font, 14)
    subtitle = " · ".join([x for x in [obj.get("category"), obj.get("city")] if x])
    if subtitle:
        c.drawString(MARGIN, PAGE_H - 120, subtitle)
    if obj.get("price"):
        c.setFont(font, 18)
        c.drawString(MARGIN, PAGE_H - 160, f"Цена: {obj['price']} ₽")

    c.setFillColorRGB(0, 0, 0)
    y = PAGE_H - 240

    # ── Главное фото ────────────────────────────────────────────────────
    photos = obj.get("photos") or []
    if photos:
        img_data = download_image(photos[0])
        if img_data:
            try:
                img = ImageReader(io.BytesIO(img_data))
                img_w = PAGE_W - 2 * MARGIN
                img_h = 280
                c.drawImage(img, MARGIN, y - img_h, img_w, img_h,
                            preserveAspectRatio=True, anchor="c", mask='auto')
                y -= img_h + 20
            except Exception:
                pass

    # ── Характеристики ──────────────────────────────────────────────────
    c.setFont(font, 16)
    c.drawString(MARGIN, y, "Характеристики")
    y -= 25
    c.setFont(font, 11)
    specs = []
    if obj.get("area"):          specs.append(("Площадь", f"{obj['area']} м²"))
    if obj.get("price"):         specs.append(("Цена", f"{obj['price']} ₽"))
    if obj.get("yield_percent"): specs.append(("Доходность", f"{obj['yield_percent']}%"))
    if obj.get("address"):       specs.append(("Адрес", obj["address"]))
    if obj.get("city"):          specs.append(("Город", obj["city"]))
    if obj.get("category"):      specs.append(("Категория", obj["category"]))
    for k, v in (obj.get("extra_fields") or {}).items():
        if v:
            specs.append((str(k), str(v)))

    for k, v in specs:
        if y < MARGIN + 60:
            c.showPage()
            y = PAGE_H - MARGIN
            c.setFont(font, 11)
        c.drawString(MARGIN, y, f"{k}:")
        c.drawString(MARGIN + 130, y, str(v)[:80])
        y -= 16

    y -= 15

    # ── Описание ────────────────────────────────────────────────────────
    if obj.get("description"):
        if y < 200:
            c.showPage()
            y = PAGE_H - MARGIN
        c.setFont(font, 16)
        c.drawString(MARGIN, y, "Описание")
        y -= 22
        y = draw_wrapped(c, obj["description"], MARGIN, y, PAGE_W - 2 * MARGIN, font, 11, 15)

    # ── Доп фото на новой странице ──────────────────────────────────────
    extras = photos[1:5]
    if extras:
        c.showPage()
        c.setFont(font, 16)
        c.drawString(MARGIN, PAGE_H - MARGIN, "Фотогалерея")
        cell_w = (PAGE_W - 2 * MARGIN - 15) / 2
        cell_h = 220
        positions = [
            (MARGIN, PAGE_H - MARGIN - 30 - cell_h),
            (MARGIN + cell_w + 15, PAGE_H - MARGIN - 30 - cell_h),
            (MARGIN, PAGE_H - MARGIN - 30 - 2 * cell_h - 15),
            (MARGIN + cell_w + 15, PAGE_H - MARGIN - 30 - 2 * cell_h - 15),
        ]
        for url, (px, py) in zip(extras, positions):
            data = download_image(url)
            if not data:
                continue
            try:
                img = ImageReader(io.BytesIO(data))
                c.drawImage(img, px, py, cell_w, cell_h,
                            preserveAspectRatio=True, anchor="c", mask='auto')
            except Exception:
                continue

    c.showPage()
    c.save()
    return buf.getvalue()


def upload_to_s3(pdf_bytes: bytes, object_id: str) -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    key = f"presentations/{object_id or uuid.uuid4().hex}/object.pdf"
    s3.put_object(
        Bucket="files",
        Key=key,
        Body=pdf_bytes,
        ContentType="application/pdf",
        ContentDisposition="inline",
    )
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    """Создаёт PDF-презентацию объекта по его id и возвращает ссылку."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    object_id = (body.get("object_id") or "").strip()

    if not object_id:
        # Тестовый прогон без object_id
        demo = {
            "id": "demo",
            "title": "Тестовый объект",
            "category": "Офис",
            "city": "Москва",
            "address": "ул. Тверская, 1",
            "price": "12 500 000",
            "area": "85",
            "description": "Демо-описание объекта для проверки PDF-генератора.",
            "yield_percent": "9",
            "extra_fields": {},
            "photos": [],
        }
        pdf = build_pdf(demo)
        url = upload_to_s3(pdf, "demo")
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"pdf_url": url, "demo": True}, ensure_ascii=False)}

    obj = fetch_object(object_id)
    if not obj:
        return {"statusCode": 404, "headers": CORS,
                "body": json.dumps({"error": "object not found"})}

    pdf = build_pdf(obj)
    url = upload_to_s3(pdf, object_id)

    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()
        safe_url = url.replace("'", "''")
        cur.execute(f"UPDATE objects SET presentation_url = '{safe_url}' WHERE id = '{object_id}'")
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        pass

    return {"statusCode": 200, "headers": CORS,
            "body": json.dumps({"pdf_url": url}, ensure_ascii=False)}