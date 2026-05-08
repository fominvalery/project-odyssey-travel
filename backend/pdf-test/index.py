import json
import io
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4


def handler(event: dict, context) -> dict:
    """Тестовая генерация простого PDF через reportlab"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setFont('Helvetica', 20)
    c.drawString(100, 750, 'PDF test page')
    c.setFont('Helvetica', 12)
    c.drawString(100, 700, 'reportlab works inside Cloud Function')
    c.showPage()
    c.save()

    pdf_bytes = buffer.getvalue()
    pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
        'body': json.dumps({
            'success': True,
            'size_bytes': len(pdf_bytes),
            'pdf_base64_preview': pdf_b64[:80],
        })
    }
