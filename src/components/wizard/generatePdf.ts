import jsPDF from "jspdf"

export interface PresentationContent {
  object_title: string
  headline: string
  tagline: string
  summary: string
  highlights: string[]
  specs: Record<string, string>
  investment_appeal: string
  call_to_action: string
  contact: { name: string; phone: string; company: string }
}

// Кириллица в jsPDF без внешних шрифтов работает только через base64.
// Используем встроенный helvetica + транслит для надёжности,
// но применяем трюк: рисуем текст через canvas → base64 image.
// Это гарантирует полную поддержку кириллицы без загрузки шрифтов.

function textToImage(
  text: string,
  options: {
    fontSize: number
    fontWeight?: string
    color?: string
    maxWidth: number
    lineHeight?: number
  }
): { dataUrl: string; height: number; lines: number } {
  const { fontSize, fontWeight = "normal", color = "#111111", maxWidth, lineHeight = 1.4 } = options
  const canvas = document.createElement("canvas")
  const dpr = 2
  const ctx = canvas.getContext("2d")!
  const font = `${fontWeight} ${fontSize * dpr}px Inter, system-ui, sans-serif`
  ctx.font = font

  // Разбиваем текст на строки
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth * dpr) {
      if (current) lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)

  const lh = fontSize * lineHeight
  canvas.width = maxWidth * dpr
  canvas.height = Math.max(1, lines.length) * lh * dpr + 4 * dpr
  canvas.style.width = `${maxWidth}px`
  canvas.style.height = `${Math.max(1, lines.length) * lh + 4}px`

  ctx.font = font
  ctx.fillStyle = color
  ctx.textBaseline = "top"
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, i * lh * dpr + 2 * dpr)
  })

  return {
    dataUrl: canvas.toDataURL("image/png"),
    height: Math.max(1, lines.length) * lh + 4,
    lines: lines.length,
  }
}

export async function buildPdf(data: PresentationContent, photoUrls: string[]): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  const W = 210
  const H = 297
  const margin = 15
  const contentW = W - margin * 2

  let y = 0

  // ── ОБЛОЖКА ──────────────────────────────────────────────────────────────────

  // Тёмный фон шапки
  doc.setFillColor(15, 15, 25)
  doc.rect(0, 0, W, 80, "F")

  // Логотип / бренд-полоска
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, 4, 80, "F")

  // Заголовок через canvas
  y = 14
  const headlineImg = textToImage(data.headline, { fontSize: 20, fontWeight: "700", color: "#ffffff", maxWidth: contentW - 10 })
  doc.addImage(headlineImg.dataUrl, "PNG", margin + 6, y, contentW - 10, headlineImg.height)
  y += headlineImg.height + 3

  const taglineImg = textToImage(data.tagline, { fontSize: 11, fontWeight: "400", color: "#94a3b8", maxWidth: contentW - 10 })
  doc.addImage(taglineImg.dataUrl, "PNG", margin + 6, y, contentW - 10, taglineImg.height)

  // Бейджи характеристик внизу шапки
  y = 63
  let bx = margin + 6
  const badgeItems = Object.entries(data.specs).slice(0, 4)
  for (const [k, v] of badgeItems) {
    const label = `${k}: ${v}`
    const bImg = textToImage(label, { fontSize: 8, fontWeight: "600", color: "#60a5fa", maxWidth: 90 })
    const bW = Math.min(bImg.height * 5.5, 55)
    doc.setFillColor(30, 58, 138)
    doc.roundedRect(bx - 2, y - 2, bW + 4, 8, 1.5, 1.5, "F")
    doc.addImage(bImg.dataUrl, "PNG", bx, y, bW, 6)
    bx += bW + 8
    if (bx > W - margin - 20) break
  }

  y = 82

  // ── ФОТО (до 3 штук) ──────────────────────────────────────────────────────
  const photosToShow = photoUrls.slice(0, 3)
  if (photosToShow.length > 0) {
    const ph = 52
    const pw = photosToShow.length === 1 ? contentW : photosToShow.length === 2 ? (contentW - 3) / 2 : (contentW - 6) / 3
    let px = margin
    for (const url of photosToShow) {
      try {
        // Загружаем через canvas для кросс-доменности
        const imgData = await loadImageAsDataUrl(url)
        doc.addImage(imgData, "JPEG", px, y, pw, ph, undefined, "MEDIUM")
      } catch {
        doc.setFillColor(30, 30, 40)
        doc.rect(px, y, pw, ph, "F")
      }
      px += pw + 3
    }
    y += ph + 6
  }

  // ── ОПИСАНИЕ ─────────────────────────────────────────────────────────────────
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, contentW, 2, 0.5, 0.5, "F")
  y += 5

  const summaryLabel = textToImage("О ОБЪЕКТЕ", { fontSize: 7, fontWeight: "700", color: "#3b82f6", maxWidth: contentW })
  doc.addImage(summaryLabel.dataUrl, "PNG", margin, y, contentW, summaryLabel.height)
  y += summaryLabel.height + 2

  const summaryImg = textToImage(data.summary, { fontSize: 9.5, fontWeight: "400", color: "#1e293b", maxWidth: contentW })
  doc.addImage(summaryImg.dataUrl, "PNG", margin, y, contentW, summaryImg.height)
  y += summaryImg.height + 7

  // ── ПРЕИМУЩЕСТВА ─────────────────────────────────────────────────────────────
  const hlLabel = textToImage("КЛЮЧЕВЫЕ ПРЕИМУЩЕСТВА", { fontSize: 7, fontWeight: "700", color: "#3b82f6", maxWidth: contentW })
  doc.addImage(hlLabel.dataUrl, "PNG", margin, y, contentW, hlLabel.height)
  y += hlLabel.height + 3

  const highlights = data.highlights.slice(0, 6)
  const colW = (contentW - 5) / 2
  for (let i = 0; i < highlights.length; i += 2) {
    const row = [highlights[i], highlights[i + 1]].filter(Boolean)
    let maxRowH = 0
    const rowImgs = row.map(h => {
      const img = textToImage(`• ${h}`, { fontSize: 9, fontWeight: "400", color: "#334155", maxWidth: colW - 4 })
      if (img.height > maxRowH) maxRowH = img.height
      return img
    })
    // Фон строки
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, y - 1, contentW, maxRowH + 4, 2, 2, "F")
    rowImgs.forEach((img, ri) => {
      doc.addImage(img.dataUrl, "PNG", margin + 4 + ri * (colW + 5), y + 1, colW - 4, img.height)
    })
    y += maxRowH + 7
  }

  y += 2

  // ── ИНВЕСТИЦИОННАЯ ПРИВЛЕКАТЕЛЬНОСТЬ ─────────────────────────────────────────
  if (y < H - 50) {
    doc.setFillColor(239, 246, 255)
    const iaImg = textToImage(data.investment_appeal, { fontSize: 9, fontWeight: "400", color: "#1e3a5f", maxWidth: contentW - 10 })
    doc.roundedRect(margin, y, contentW, iaImg.height + 10, 3, 3, "F")
    doc.setFillColor(59, 130, 246)
    doc.rect(margin, y, 3, iaImg.height + 10, "F")
    doc.addImage(iaImg.dataUrl, "PNG", margin + 7, y + 5, contentW - 10, iaImg.height)
    y += iaImg.height + 16
  }

  // ── КОНТАКТЫ (нижняя полоса) ──────────────────────────────────────────────────
  const footerY = H - 24
  doc.setFillColor(15, 15, 25)
  doc.rect(0, footerY, W, 24, "F")
  doc.setFillColor(59, 130, 246)
  doc.rect(0, footerY, 4, 24, "F")

  // CTA
  const ctaImg = textToImage(data.call_to_action, { fontSize: 8.5, fontWeight: "600", color: "#ffffff", maxWidth: contentW * 0.55 })
  doc.addImage(ctaImg.dataUrl, "PNG", margin + 6, footerY + 4, contentW * 0.55, ctaImg.height)

  // Контакты
  const contact = data.contact
  const contactLines = [contact.company, contact.name, contact.phone].filter(Boolean).join("  |  ")
  if (contactLines) {
    const cImg = textToImage(contactLines, { fontSize: 8, fontWeight: "400", color: "#94a3b8", maxWidth: contentW * 0.4 })
    doc.addImage(cImg.dataUrl, "PNG", margin + 6, footerY + 13, contentW * 0.4, cImg.height)
  }

  const safeName = (data.object_title || "presentation").replace(/[^a-zA-Zа-яА-Я0-9\s]/g, "").trim().replace(/\s+/g, "_")
  doc.save(`${safeName || "presentation"}.pdf`)
}

/** Собирает PDF и возвращает base64-строку (без скачивания) */
export async function buildPdfBase64(data: PresentationContent, photoUrls: string[]): Promise<string> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  const W = 210
  const H = 297
  const margin = 15
  const contentW = W - margin * 2

  let y = 0

  doc.setFillColor(15, 15, 25)
  doc.rect(0, 0, W, 80, "F")
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, 4, 80, "F")

  y = 14
  const headlineImg = textToImage(data.headline, { fontSize: 20, fontWeight: "700", color: "#ffffff", maxWidth: contentW - 10 })
  doc.addImage(headlineImg.dataUrl, "PNG", margin + 6, y, contentW - 10, headlineImg.height)
  y += headlineImg.height + 3

  const taglineImg = textToImage(data.tagline, { fontSize: 11, fontWeight: "400", color: "#94a3b8", maxWidth: contentW - 10 })
  doc.addImage(taglineImg.dataUrl, "PNG", margin + 6, y, contentW - 10, taglineImg.height)

  y = 63
  let bx = margin + 6
  for (const [k, v] of Object.entries(data.specs).slice(0, 4)) {
    const label = `${k}: ${v}`
    const bImg = textToImage(label, { fontSize: 8, fontWeight: "600", color: "#60a5fa", maxWidth: 90 })
    const bW = Math.min(bImg.height * 5.5, 55)
    doc.setFillColor(30, 58, 138)
    doc.roundedRect(bx - 2, y - 2, bW + 4, 8, 1.5, 1.5, "F")
    doc.addImage(bImg.dataUrl, "PNG", bx, y, bW, 6)
    bx += bW + 8
    if (bx > W - margin - 20) break
  }

  y = 82

  const photosToShow = photoUrls.slice(0, 3)
  if (photosToShow.length > 0) {
    const ph = 52
    const pw = photosToShow.length === 1 ? contentW : photosToShow.length === 2 ? (contentW - 3) / 2 : (contentW - 6) / 3
    let px = margin
    for (const url of photosToShow) {
      try {
        const imgData = await loadImageAsDataUrl(url)
        doc.addImage(imgData, "JPEG", px, y, pw, ph, undefined, "MEDIUM")
      } catch {
        doc.setFillColor(30, 30, 40)
        doc.rect(px, y, pw, ph, "F")
      }
      px += pw + 3
    }
    y += ph + 6
  }

  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, contentW, 2, 0.5, 0.5, "F")
  y += 5

  const summaryLabel = textToImage("О ОБЪЕКТЕ", { fontSize: 7, fontWeight: "700", color: "#3b82f6", maxWidth: contentW })
  doc.addImage(summaryLabel.dataUrl, "PNG", margin, y, contentW, summaryLabel.height)
  y += summaryLabel.height + 2

  const summaryImg = textToImage(data.summary, { fontSize: 9.5, fontWeight: "400", color: "#1e293b", maxWidth: contentW })
  doc.addImage(summaryImg.dataUrl, "PNG", margin, y, contentW, summaryImg.height)
  y += summaryImg.height + 7

  const hlLabel = textToImage("КЛЮЧЕВЫЕ ПРЕИМУЩЕСТВА", { fontSize: 7, fontWeight: "700", color: "#3b82f6", maxWidth: contentW })
  doc.addImage(hlLabel.dataUrl, "PNG", margin, y, contentW, hlLabel.height)
  y += hlLabel.height + 3

  const colW = (contentW - 5) / 2
  for (let i = 0; i < data.highlights.slice(0, 6).length; i += 2) {
    const row = [data.highlights[i], data.highlights[i + 1]].filter(Boolean)
    let maxRowH = 0
    const rowImgs = row.map(h => {
      const img = textToImage(`• ${h}`, { fontSize: 9, fontWeight: "400", color: "#334155", maxWidth: colW - 4 })
      if (img.height > maxRowH) maxRowH = img.height
      return img
    })
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, y - 1, contentW, maxRowH + 4, 2, 2, "F")
    rowImgs.forEach((img, ri) => {
      doc.addImage(img.dataUrl, "PNG", margin + 4 + ri * (colW + 5), y + 1, colW - 4, img.height)
    })
    y += maxRowH + 7
  }

  y += 2

  if (y < H - 50) {
    doc.setFillColor(239, 246, 255)
    const iaImg = textToImage(data.investment_appeal, { fontSize: 9, fontWeight: "400", color: "#1e3a5f", maxWidth: contentW - 10 })
    doc.roundedRect(margin, y, contentW, iaImg.height + 10, 3, 3, "F")
    doc.setFillColor(59, 130, 246)
    doc.rect(margin, y, 3, iaImg.height + 10, "F")
    doc.addImage(iaImg.dataUrl, "PNG", margin + 7, y + 5, contentW - 10, iaImg.height)
  }

  const footerY = H - 24
  doc.setFillColor(15, 15, 25)
  doc.rect(0, footerY, W, 24, "F")
  doc.setFillColor(59, 130, 246)
  doc.rect(0, footerY, 4, 24, "F")

  const ctaImg = textToImage(data.call_to_action, { fontSize: 8.5, fontWeight: "600", color: "#ffffff", maxWidth: contentW * 0.55 })
  doc.addImage(ctaImg.dataUrl, "PNG", margin + 6, footerY + 4, contentW * 0.55, ctaImg.height)

  const contact = data.contact
  const contactLines = [contact.company, contact.name, contact.phone].filter(Boolean).join("  |  ")
  if (contactLines) {
    const cImg = textToImage(contactLines, { fontSize: 8, fontWeight: "400", color: "#94a3b8", maxWidth: contentW * 0.4 })
    doc.addImage(cImg.dataUrl, "PNG", margin + 6, footerY + 13, contentW * 0.4, cImg.height)
  }

  // Возвращаем base64 без data:URI prefix
  return doc.output("datauristring").split(",")[1]
}

async function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth || 800
      canvas.height = img.naturalHeight || 600
      canvas.getContext("2d")!.drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/jpeg", 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}