import os
import psycopg2

SITE_URL = "https://kabinet-24.ru"

STATIC_URLS = [
    ("/", "1.0", "weekly"),
    ("/ecosystem", "0.9", "weekly"),
    ("/club", "0.9", "weekly"),
    ("/marketplace", "0.8", "daily"),
    ("/referral", "0.6", "monthly"),
    ("/terms", "0.3", "yearly"),
    ("/privacy", "0.3", "yearly"),
    ("/offer", "0.3", "yearly"),
]


def handler(event: dict, context) -> dict:
    """Динамическая карта сайта со всеми опубликованными объектами для SEO"""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    parts = ['<?xml version="1.0" encoding="UTF-8"?>']
    parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

    for path, prio, freq in STATIC_URLS:
        parts.append(f'  <url><loc>{SITE_URL}{path}</loc><changefreq>{freq}</changefreq><priority>{prio}</priority></url>')

    try:
        dsn = os.environ.get('DATABASE_URL')
        if dsn:
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            cur.execute(
                "SELECT id, created_at FROM objects "
                "WHERE published = true AND COALESCE(status, '') NOT IN ('Продан', 'Сдан') "
                "ORDER BY created_at DESC LIMIT 5000"
            )
            for row in cur.fetchall():
                obj_id = str(row[0])
                lastmod = row[1].strftime('%Y-%m-%d') if row[1] else ''
                lastmod_tag = f'<lastmod>{lastmod}</lastmod>' if lastmod else ''
                parts.append(
                    f'  <url><loc>{SITE_URL}/object/{obj_id}</loc>'
                    f'{lastmod_tag}<changefreq>weekly</changefreq><priority>0.7</priority></url>'
                )
            cur.close()
            conn.close()
    except Exception:
        pass

    parts.append('</urlset>')
    body = '\n'.join(parts)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/xml; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
        },
        'body': body,
    }
