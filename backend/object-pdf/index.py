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
import urllib.parse

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

# Подписи полей extra_fields на русском
FIELD_LABELS = {
    "deal_type": "Тип сделки", "subtype": "Подтип", "type": "Тип",
    "floor": "Этаж", "floors_total": "Этажей в здании",
    "ceiling": "Высота потолков, м", "rooms": "Комнат",
    "living_area": "Жилая площадь, м²", "land_area": "Площадь участка",
    "build_year": "Год постройки", "building_type": "Тип здания",
    "condition": "Состояние", "layout": "Планировка",
    "bathroom": "Санузел", "balcony": "Балкон/Лоджия",
    "view": "Вид из окон", "parking": "Парковка", "elevator": "Лифт",
    "housing_class": "Класс жилья", "class": "Класс объекта",
    "utilities": "Коммунальные платежи", "wall_material": "Материал стен",
    "heating": "Отопление", "gas": "Газ", "water": "Водоснабжение",
    "sewage": "Канализация", "electricity": "Электричество",
    "security": "Охрана", "concierge": "Консьерж",
    "land_category": "Категория земли", "cadastral": "Кадастровый номер",
    "permits": "Разрешения", "snp": "СНТ/КП",
    "total_area": "Общая площадь, м²",
    "management_company": "Управляющая компания",
    "terrace": "Терраса", "finishing": "Отделка", "mortgage": "Ипотека",
    "furniture": "Мебель", "appliances": "Техника",
    "pets": "Животные", "children": "Дети",
    "deposit": "Залог", "lease_term": "Срок аренды",
    "check_in": "Условия заселения", "wifi": "WiFi",
    "avg_check": "Средний чек", "min_nights": "Минимум ночей",
    "occupancy": "Загрузка, %", "self_checkin": "Самозаезд",
    "workplaces": "Рабочих мест", "reception": "Ресепшн",
    "access": "Доступ", "power": "Электромощность, кВт",
    "tenant": "Арендатор", "frontage": "Витрина, м",
    "entrance": "Вход", "traffic": "Трафик, чел/день",
    "wet_point": "Мокрая точка", "ventilation": "Вентиляция",
    "gates": "Ворота", "ramp": "Пандус",
    "floor_load": "Нагрузка на пол, т/м²",
    "temp_regime": "Температурный режим",
    "railway": "Ж/Д ветка", "crane": "Кран-балка, т",
    "truck_access": "Подъезд для фур", "neighbors": "Окружение",
    "rent_price_sqm": "Ставка аренды, ₽/м²/мес",
    "opex": "Эксплуатационные расходы",
    "lease_from": "Аренда от, м²", "indexing": "Индексация",
    "owner_fee": "Комиссия", "deal_stage": "Стадия сделки",
    "yield": "Доходность, %/год", "roi": "ROI, %",
    "payback": "Срок окупаемости, лет",
    "rent": "Арендный доход, ₽/мес",
    "strategy": "Стратегия", "encumbrance": "Обременения",
    "complex": "Комплекс", "developer": "Застройщик",
    "delivery": "Срок сдачи", "corpus": "Корпус/секция",
    "units": "Юнитов",
}

CATEGORY_LABELS = {
    "commercial": "Коммерческая недвижимость",
    "residential": "Жилая недвижимость",
    "investment": "Инвестиционный объект",
    "newbuild": "Новостройка",
    "resort": "Курортная недвижимость",
    "auction": "Торги/аукцион",
    "land": "Земельный участок",
}

VALUE_LABELS = {
    "rent": "Аренда", "sale": "Продажа", "sublease": "Субаренда",
    "investment": "Инвестиция", "shortterm": "Посуточная аренда",
}


def label_for_key(k: str) -> str:
    return FIELD_LABELS.get(k, k.replace("_", " ").capitalize())


def label_for_value(v) -> str:
    if isinstance(v, str):
        return VALUE_LABELS.get(v, v)
    return str(v)


def fmt_price(v: str) -> str:
    """Превращает '684000' в '684 000 руб'."""
    if not v:
        return ""
    digits = "".join(ch for ch in str(v) if ch.isdigit())
    if not digits:
        return f"{v} руб"
    n = int(digits)
    grouped = f"{n:,}".replace(",", " ")
    return f"{grouped} руб"

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
            "yield_percent, extra_fields, photos, user_id, pdf_options "
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
            "user_id": str(row[12]) if row[12] else "",
            "pdf_options": row[13] or {},
        }
    finally:
        conn.close()


def fetch_user(user_id: str) -> dict:
    if not user_id:
        return {}
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()
        cur.execute(
            "SELECT name, phone, company, avatar_url, bio, experience, "
            "specializations, first_name, last_name, middle_name, email "
            f"FROM users WHERE id = '{user_id}'"
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {}
        full_name = " ".join([x for x in [row[8] or "", row[7] or "", row[9] or ""] if x]).strip()
        return {
            "name": full_name or row[0] or "",
            "phone": row[1] or "",
            "company": row[2] or "",
            "avatar_url": row[3] or "",
            "bio": row[4] or "",
            "experience": row[5] or "",
            "specializations": list(row[6] or []),
            "email": row[10] or "",
        }
    except Exception:
        return {}


def download_image(url: str) -> bytes:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read()
    except Exception:
        return b""


def geocode(address: str):
    """OSM Nominatim → (lat, lon) или None."""
    try:
        q = urllib.parse.quote(address)
        url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=1"
        req = urllib.request.Request(url, headers={
            "User-Agent": "realty-pdf-bot/1.0 (realty-app@poehali.dev)"
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        if not data:
            return None
        return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        return None


def fetch_static_map(lat: float, lon: float) -> bytes:
    """Статическая карта OSM с меткой."""
    sources = [
        f"https://staticmap.openstreetmap.de/staticmap.php?center={lat},{lon}&zoom=15&size=720x480&markers={lat},{lon},red",
        f"https://static-maps.yandex.ru/1.x/?ll={lon},{lat}&z=15&l=map&size=600,450&pt={lon},{lat},pm2rdm",
    ]
    for src in sources:
        try:
            req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=12) as r:
                data = r.read()
            if len(data) > 2000:
                return data
        except Exception:
            continue
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


BRAND_R, BRAND_G, BRAND_B = 0.1, 0.15, 0.3  # тёмно-синий
STRIP_H = 56  # ~2 см полоса
TOP_AREA = PAGE_H - STRIP_H  # верхняя граница рабочей зоны на обычных страницах
BOT_AREA = STRIP_H            # нижняя граница рабочей зоны


def draw_strips(c, font, contact_text: str = ""):
    """Рисует верхнюю и нижнюю цветные полосы."""
    c.setFillColorRGB(BRAND_R, BRAND_G, BRAND_B)
    c.rect(0, PAGE_H - STRIP_H, PAGE_W, STRIP_H, stroke=0, fill=1)
    c.rect(0, 0, PAGE_W, STRIP_H, stroke=0, fill=1)
    if contact_text:
        c.setFillColorRGB(1, 1, 1)
        c.setFont(font, 11)
        c.drawCentredString(PAGE_W / 2, STRIP_H / 2 - 4, contact_text[:140])
    c.setFillColorRGB(0, 0, 0)


def new_page(c, font, contact_text: str = ""):
    c.showPage()
    draw_strips(c, font, contact_text)


def build_pdf(obj: dict) -> bytes:
    font = ensure_font()
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)

    opts = obj.get("pdf_options") or {}
    show_contacts = bool(opts.get("show_contacts"))
    show_card = bool(opts.get("show_card"))
    user = obj.get("user") or {}

    contact_text = ""
    if show_contacts and user:
        parts = []
        if user.get("name"):    parts.append(user["name"])
        if user.get("phone"):   parts.append(user["phone"])
        if user.get("company"): parts.append(user["company"])
        contact_text = "  ·  ".join(parts)

    # ── ОБЛОЖКА ────────────────────────────────────────────────────────
    HEADER_H = 170
    FOOTER_H = STRIP_H  # 2 см

    # Верхняя цветная зона с заголовком
    c.setFillColorRGB(BRAND_R, BRAND_G, BRAND_B)
    c.rect(0, PAGE_H - HEADER_H, PAGE_W, HEADER_H, stroke=0, fill=1)
    c.setFillColorRGB(1, 1, 1)
    c.setFont(font, 22)
    c.drawString(MARGIN, PAGE_H - 60, (obj.get("title") or "Объект")[:60])
    c.setFont(font, 13)
    cat_label = CATEGORY_LABELS.get(obj.get("category", ""), obj.get("category", ""))
    subtitle = " · ".join([x for x in [cat_label, obj.get("city")] if x])
    if subtitle:
        c.drawString(MARGIN, PAGE_H - 90, subtitle[:80])
    if obj.get("price"):
        c.setFont(font, 17)
        c.drawString(MARGIN, PAGE_H - 130, f"Цена: {fmt_price(obj['price'])}")

    # Главное фото на всю ширину между header и footer
    photos = obj.get("photos") or []
    photo_top = PAGE_H - HEADER_H - 10
    photo_bottom = FOOTER_H + 10
    if photos:
        img_data = download_image(photos[0])
        if img_data:
            try:
                img = ImageReader(io.BytesIO(img_data))
                c.drawImage(img, 0, photo_bottom, PAGE_W, photo_top - photo_bottom,
                            preserveAspectRatio=True, anchor="c", mask='auto')
            except Exception:
                pass

    # Нижняя цветная полоса
    c.setFillColorRGB(BRAND_R, BRAND_G, BRAND_B)
    c.rect(0, 0, PAGE_W, FOOTER_H, stroke=0, fill=1)
    if contact_text:
        c.setFillColorRGB(1, 1, 1)
        c.setFont(font, 11)
        c.drawCentredString(PAGE_W / 2, FOOTER_H / 2 - 4, contact_text[:140])
    c.setFillColorRGB(0, 0, 0)

    # ── СТРАНИЦА: ХАРАКТЕРИСТИКИ + ОПИСАНИЕ ────────────────────────────
    new_page(c, font, contact_text)
    y = TOP_AREA - 30
    c.setFillColorRGB(0, 0, 0)
    c.setFont(font, 18)
    c.drawString(MARGIN, y, "Характеристики")
    y -= 28
    c.setFont(font, 11)
    specs = []
    if obj.get("area"):          specs.append(("Площадь", f"{obj['area']} м²"))
    if obj.get("price"):         specs.append(("Цена", fmt_price(obj["price"])))
    if obj.get("yield_percent"): specs.append(("Доходность", f"{obj['yield_percent']}%"))
    if obj.get("address"):       specs.append(("Адрес", obj["address"]))
    if obj.get("city"):          specs.append(("Город", obj["city"]))
    if obj.get("category"):
        specs.append(("Категория", CATEGORY_LABELS.get(obj["category"], obj["category"])))
    for k, v in (obj.get("extra_fields") or {}).items():
        if v in (None, "", [], {}):
            continue
        specs.append((label_for_key(str(k)), label_for_value(v)))

    for k, v in specs:
        if y < BOT_AREA + 30:
            new_page(c, font, contact_text)
            y = TOP_AREA - 30
            c.setFont(font, 11)
        c.drawString(MARGIN, y, f"{k}:")
        c.drawString(MARGIN + 150, y, str(v)[:80])
        y -= 16

    y -= 15
    if obj.get("description"):
        if y < BOT_AREA + 120:
            new_page(c, font, contact_text)
            y = TOP_AREA - 30
        c.setFont(font, 18)
        c.drawString(MARGIN, y, "Описание")
        y -= 24
        c.setFont(font, 11)
        words = (obj["description"] or "").split()
        line = ""
        max_w = PAGE_W - 2 * MARGIN
        for w in words:
            cand = (line + " " + w).strip()
            if c.stringWidth(cand, font, 11) <= max_w:
                line = cand
            else:
                c.drawString(MARGIN, y, line)
                y -= 15
                line = w
                if y < BOT_AREA + 30:
                    new_page(c, font, contact_text)
                    y = TOP_AREA - 30
                    c.setFont(font, 11)
        if line:
            c.drawString(MARGIN, y, line)

    # ── ФОТОГАЛЕРЕЯ (до 25 фото, по 4 на страницу) ─────────────────────
    extras = photos[1:25]
    if extras:
        cell_w = (PAGE_W - 2 * MARGIN - 15) / 2
        gallery_top = TOP_AREA - 30
        cell_h = (gallery_top - BOT_AREA - 30 - 15) / 2
        positions = [
            (MARGIN, gallery_top - cell_h),
            (MARGIN + cell_w + 15, gallery_top - cell_h),
            (MARGIN, gallery_top - 2 * cell_h - 15),
            (MARGIN + cell_w + 15, gallery_top - 2 * cell_h - 15),
        ]
        for i, url in enumerate(extras):
            slot = i % 4
            if slot == 0:
                new_page(c, font, contact_text)
                c.setFont(font, 18)
                c.drawString(MARGIN, TOP_AREA - 24, "Фотогалерея")
            data = download_image(url)
            if not data:
                continue
            px, py = positions[slot]
            try:
                img = ImageReader(io.BytesIO(data))
                c.drawImage(img, px, py, cell_w, cell_h,
                            preserveAspectRatio=True, anchor="c", mask='auto')
            except Exception:
                continue

    # ── КАРТА РАСПОЛОЖЕНИЯ ─────────────────────────────────────────────
    map_addr = obj.get("address") or obj.get("city") or ""
    if map_addr:
        coords = geocode(map_addr)
        if coords:
            map_bytes = fetch_static_map(coords[0], coords[1])
            if map_bytes:
                new_page(c, font, contact_text)
                c.setFont(font, 18)
                c.drawString(MARGIN, TOP_AREA - 24, "Расположение")
                c.setFont(font, 11)
                c.drawString(MARGIN, TOP_AREA - 44, map_addr[:120])
                try:
                    img = ImageReader(io.BytesIO(map_bytes))
                    map_top = TOP_AREA - 60
                    map_h = map_top - BOT_AREA - 20
                    c.drawImage(img, MARGIN, BOT_AREA + 20,
                                PAGE_W - 2 * MARGIN, map_h,
                                preserveAspectRatio=True, anchor="c", mask='auto')
                except Exception:
                    pass

    # ── ВИЗИТКА ─────────────────────────────────────────────────────────
    if show_card and user and (user.get("name") or user.get("phone")):
        new_page(c, font, contact_text)
        cy = TOP_AREA - 40
        c.setFont(font, 22)
        c.drawString(MARGIN, cy, "Ваш персональный менеджер")
        cy -= 40

        # Аватар слева
        avatar_size = 140
        avatar_x = MARGIN
        avatar_y = cy - avatar_size
        if user.get("avatar_url"):
            ad = download_image(user["avatar_url"])
            if ad:
                try:
                    img = ImageReader(io.BytesIO(ad))
                    c.drawImage(img, avatar_x, avatar_y, avatar_size, avatar_size,
                                preserveAspectRatio=True, anchor="c", mask='auto')
                except Exception:
                    pass

        # Текст справа от аватара
        tx = avatar_x + avatar_size + 25
        ty = cy - 5
        c.setFont(font, 18)
        c.drawString(tx, ty, (user.get("name") or "")[:60])
        ty -= 26
        if user.get("company"):
            c.setFont(font, 13)
            c.setFillColorRGB(0.4, 0.4, 0.4)
            c.drawString(tx, ty, user["company"][:60])
            c.setFillColorRGB(0, 0, 0)
            ty -= 20
        if user.get("phone"):
            c.setFont(font, 13)
            c.drawString(tx, ty, f"Тел: {user['phone']}")
            ty -= 18
        if user.get("email"):
            c.setFont(font, 11)
            c.drawString(tx, ty, user["email"][:50])
            ty -= 16

        cy = avatar_y - 30

        # Специализации
        specs_list = user.get("specializations") or []
        if specs_list:
            c.setFont(font, 14)
            c.drawString(MARGIN, cy, "Специализация")
            cy -= 20
            c.setFont(font, 11)
            for s in specs_list[:8]:
                if cy < BOT_AREA + 40:
                    break
                c.drawString(MARGIN + 10, cy, f"• {s}")
                cy -= 16
            cy -= 10

        # Опыт
        if user.get("experience"):
            if cy > BOT_AREA + 60:
                c.setFont(font, 14)
                c.drawString(MARGIN, cy, "Опыт")
                cy -= 20
                c.setFont(font, 11)
                exp_words = user["experience"].split()
                line = ""
                max_w = PAGE_W - 2 * MARGIN
                for w in exp_words:
                    cand = (line + " " + w).strip()
                    if c.stringWidth(cand, font, 11) <= max_w:
                        line = cand
                    else:
                        c.drawString(MARGIN, cy, line)
                        cy -= 15
                        line = w
                        if cy < BOT_AREA + 30:
                            line = ""
                            break
                if line and cy > BOT_AREA + 30:
                    c.drawString(MARGIN, cy, line)
                    cy -= 15

        # Био
        if user.get("bio") and cy > BOT_AREA + 60:
            c.setFont(font, 14)
            c.drawString(MARGIN, cy, "О себе")
            cy -= 20
            c.setFont(font, 11)
            bio_words = user["bio"].split()
            line = ""
            max_w = PAGE_W - 2 * MARGIN
            for w in bio_words:
                cand = (line + " " + w).strip()
                if c.stringWidth(cand, font, 11) <= max_w:
                    line = cand
                else:
                    c.drawString(MARGIN, cy, line)
                    cy -= 15
                    line = w
                    if cy < BOT_AREA + 30:
                        line = ""
                        break
            if line and cy > BOT_AREA + 30:
                c.drawString(MARGIN, cy, line)

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

    # Перезаписываем pdf_options если пришли в body
    incoming_opts = body.get("pdf_options")
    if isinstance(incoming_opts, dict):
        obj["pdf_options"] = incoming_opts
        try:
            conn = psycopg2.connect(os.environ["DATABASE_URL"])
            cur = conn.cursor()
            opts_json = json.dumps(incoming_opts).replace("'", "''")
            cur.execute(f"UPDATE objects SET pdf_options = '{opts_json}'::jsonb WHERE id = '{object_id}'")
            conn.commit()
            cur.close()
            conn.close()
        except Exception:
            pass

    obj["user"] = fetch_user(obj.get("user_id", ""))

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