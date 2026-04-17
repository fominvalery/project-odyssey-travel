import jsPDF from "jspdf"

export interface HighlightItem {
  icon?: string
  title: string
  text: string
}

export interface PresentationContent {
  object_title: string
  headline: string
  tagline: string
  hero_stat?: { value: string; label: string }
  summary: string
  highlights: (HighlightItem | string)[]
  specs: Record<string, string>
  investment_appeal: string
  why_buy?: string[]
  call_to_action: string
  contact: { name: string; phone: string; company: string }
}

// ── Палитра Gamma-style ──────────────────────────────────────────────────────
const PALETTE = {
  bg: [10, 12, 24] as [number, number, number],
  bgAlt: [18, 20, 36] as [number, number, number],
  card: [24, 26, 45] as [number, number, number],
  accent: [139, 92, 246] as [number, number, number],   // violet-500
  accent2: [59, 130, 246] as [number, number, number],  // blue-500
  accent3: [236, 72, 153] as [number, number, number],  // pink-500
  text: [240, 242, 250] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

// ── Рендер текста через canvas (поддержка кириллицы) ─────────────────────────
function textToImage(
  text: string,
  opts: {
    fontSize: number
    fontWeight?: string
    color?: string
    maxWidth: number
    lineHeight?: number
    align?: "left" | "center" | "right"
  }
): { dataUrl: string; height: number; lines: number; width: number } {
  const { fontSize, fontWeight = "400", color = "#111", maxWidth, lineHeight = 1.35, align = "left" } = opts
  const dpr = 2
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!
  const font = `${fontWeight} ${fontSize * dpr}px Inter, "Helvetica Neue", Arial, sans-serif`
  ctx.font = font

  // Перенос по словам + жёсткий перенос длинных слов
  const words = text.split(/(\s+)/)
  const lines: string[] = []
  let current = ""
  for (const raw of words) {
    if (raw === "") continue
    const test = current + raw
    if (ctx.measureText(test).width > maxWidth * dpr && current.trim()) {
      lines.push(current.trim())
      current = raw.trim() ? raw : ""
    } else {
      current = test
    }
  }
  if (current.trim()) lines.push(current.trim())
  if (lines.length === 0) lines.push("")

  const lh = fontSize * lineHeight
  canvas.width = Math.ceil(maxWidth * dpr)
  canvas.height = Math.ceil(lines.length * lh * dpr + 4 * dpr)

  ctx.font = font
  ctx.fillStyle = color
  ctx.textBaseline = "top"
  ctx.textAlign = align
  const x = align === "center" ? canvas.width / 2 : align === "right" ? canvas.width : 0
  lines.forEach((line, i) => {
    ctx.fillText(line, x, i * lh * dpr + 2 * dpr)
  })

  return { dataUrl: canvas.toDataURL("image/png"), height: lines.length * lh + 4, lines: lines.length, width: maxWidth }
}

// ── Градиентный фон страницы ─────────────────────────────────────────────────
function gradientBackground(doc: jsPDF, color1: [number, number, number], color2: [number, number, number]) {
  const W = 210, H = 297
  const steps = 60
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const r = Math.round(color1[0] + (color2[0] - color1[0]) * t)
    const g = Math.round(color1[1] + (color2[1] - color1[1]) * t)
    const b = Math.round(color1[2] + (color2[2] - color1[2]) * t)
    doc.setFillColor(r, g, b)
    doc.rect(0, (H / steps) * i, W, H / steps + 0.5, "F")
  }
}

// ── Декоративные круги (эффект Gamma) ────────────────────────────────────────
function decorCircles(doc: jsPDF) {
  // Большой фиолетовый круг сверху справа
  doc.setFillColor(139, 92, 246)
  doc.setGState((doc as unknown as { GState: new (o: object) => unknown }).GState ? new (doc as unknown as { GState: new (o: object) => unknown }).GState({ opacity: 0.15 }) as never : undefined as never)
  try { doc.circle(195, 15, 40, "F") } catch { /* noop */ }

  // Синий круг снизу слева
  doc.setFillColor(59, 130, 246)
  try { doc.circle(15, 280, 50, "F") } catch { /* noop */ }
}

// ── Страница: обложка ────────────────────────────────────────────────────────
async function renderCover(doc: jsPDF, data: PresentationContent, photos: string[]) {
  const W = 210, H = 297
  gradientBackground(doc, [15, 15, 35], [45, 20, 75])

  // Фото-героя (если есть) — верхние 55% с градиентным затемнением
  if (photos.length > 0) {
    try {
      const img = await loadImageAsDataUrl(photos[0])
      doc.addImage(img, "JPEG", 0, 0, W, 170, undefined, "MEDIUM")
      // Градиентное затемнение снизу
      for (let i = 0; i < 40; i++) {
        const alpha = (i / 40)
        const y = 130 + i
        doc.setFillColor(10, 12, 24)
        try {
          const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
          if (GStateCtor) doc.setGState(new GStateCtor({ opacity: alpha }) as never)
        } catch { /* noop */ }
        doc.rect(0, y, W, 1.2, "F")
      }
      // Сбрасываем прозрачность
      try {
        const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
        if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 1 }) as never)
      } catch { /* noop */ }
    } catch { /* фото недоступно */ }
  }

  // Цветная акцентная полоса слева
  doc.setFillColor(...PALETTE.accent)
  doc.rect(0, 0, 6, H, "F")

  // Метка вверху
  const labelImg = textToImage("КОММЕРЧЕСКАЯ НЕДВИЖИМОСТЬ", {
    fontSize: 9, fontWeight: "700", color: "#C4B5FD", maxWidth: 180,
  })
  doc.addImage(labelImg.dataUrl, "PNG", 20, 180, 180, labelImg.height)

  // Крупный заголовок
  const headlineImg = textToImage(data.headline, {
    fontSize: 34, fontWeight: "800", color: "#FFFFFF", maxWidth: 170, lineHeight: 1.1,
  })
  doc.addImage(headlineImg.dataUrl, "PNG", 20, 190, 170, headlineImg.height)

  // Тагалайн
  const tagY = 190 + headlineImg.height + 4
  const taglineImg = textToImage(data.tagline, {
    fontSize: 14, fontWeight: "400", color: "#CBD5E1", maxWidth: 170, lineHeight: 1.35,
  })
  doc.addImage(taglineImg.dataUrl, "PNG", 20, tagY, 170, taglineImg.height)

  // Hero-stat карточка
  if (data.hero_stat?.value) {
    const cardY = H - 55
    doc.setFillColor(255, 255, 255)
    try {
      const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
      if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 0.1 }) as never)
    } catch { /* noop */ }
    doc.roundedRect(20, cardY, 170, 30, 4, 4, "F")
    try {
      const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
      if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 1 }) as never)
    } catch { /* noop */ }

    const valImg = textToImage(data.hero_stat.value, {
      fontSize: 22, fontWeight: "700", color: "#FFFFFF", maxWidth: 160,
    })
    doc.addImage(valImg.dataUrl, "PNG", 28, cardY + 5, 160, valImg.height)

    const lblImg = textToImage(data.hero_stat.label, {
      fontSize: 9, fontWeight: "500", color: "#A78BFA", maxWidth: 160,
    })
    doc.addImage(lblImg.dataUrl, "PNG", 28, cardY + 5 + valImg.height + 1, 160, lblImg.height)
  }

  // Номер страницы
  const pageImg = textToImage("01", { fontSize: 8, fontWeight: "600", color: "#64748B", maxWidth: 20, align: "right" })
  doc.addImage(pageImg.dataUrl, "PNG", W - 25, H - 10, 20, pageImg.height)
}

// ── Страница: описание + фото ─────────────────────────────────────────────────
async function renderSummary(doc: jsPDF, data: PresentationContent, photos: string[]) {
  doc.addPage()
  const W = 210, H = 297
  doc.setFillColor(...PALETTE.bg)
  doc.rect(0, 0, W, H, "F")

  // Шапка страницы
  doc.setFillColor(...PALETTE.accent)
  doc.rect(0, 0, W, 2, "F")

  // Номер страницы
  doc.setFillColor(...PALETTE.card)
  doc.circle(195, 15, 8, "F")
  const numImg = textToImage("02", { fontSize: 9, fontWeight: "700", color: "#FFFFFF", maxWidth: 20, align: "center" })
  doc.addImage(numImg.dataUrl, "PNG", 185, 11, 20, numImg.height)

  // Секция: Описание
  let y = 30
  const tagImg = textToImage("О ОБЪЕКТЕ", {
    fontSize: 10, fontWeight: "700", color: "#A78BFA", maxWidth: 170,
  })
  doc.addImage(tagImg.dataUrl, "PNG", 20, y, 170, tagImg.height)
  y += tagImg.height + 6

  const titleImg = textToImage(data.object_title, {
    fontSize: 20, fontWeight: "700", color: "#FFFFFF", maxWidth: 170, lineHeight: 1.2,
  })
  doc.addImage(titleImg.dataUrl, "PNG", 20, y, 170, titleImg.height)
  y += titleImg.height + 8

  // Цветная полоса-разделитель
  doc.setFillColor(...PALETTE.accent)
  doc.rect(20, y, 30, 1, "F")
  y += 8

  const summaryImg = textToImage(data.summary, {
    fontSize: 11, fontWeight: "400", color: "#CBD5E1", maxWidth: 170, lineHeight: 1.55,
  })
  doc.addImage(summaryImg.dataUrl, "PNG", 20, y, 170, summaryImg.height)
  y += summaryImg.height + 15

  // Сетка фото 2×2
  if (photos.length > 0) {
    const galleryPhotos = photos.slice(0, 4)
    const gap = 4
    const gridW = (W - 40 - gap) / 2
    const gridH = 45
    for (let i = 0; i < galleryPhotos.length; i++) {
      const gx = 20 + (i % 2) * (gridW + gap)
      const gy = y + Math.floor(i / 2) * (gridH + gap)
      try {
        const img = await loadImageAsDataUrl(galleryPhotos[i])
        doc.addImage(img, "JPEG", gx, gy, gridW, gridH, undefined, "MEDIUM")
      } catch {
        doc.setFillColor(...PALETTE.card)
        doc.roundedRect(gx, gy, gridW, gridH, 2, 2, "F")
      }
    }
  }
}

// ── Страница: Преимущества 2×2 с иконками-кружками ──────────────────────────
function renderHighlights(doc: jsPDF, data: PresentationContent) {
  doc.addPage()
  const W = 210, H = 297
  gradientBackground(doc, [15, 20, 40], [25, 15, 45])

  doc.setFillColor(...PALETTE.accent)
  doc.rect(0, 0, W, 2, "F")

  doc.setFillColor(...PALETTE.card)
  doc.circle(195, 15, 8, "F")
  const numImg = textToImage("03", { fontSize: 9, fontWeight: "700", color: "#FFFFFF", maxWidth: 20, align: "center" })
  doc.addImage(numImg.dataUrl, "PNG", 185, 11, 20, numImg.height)

  // Заголовок
  let y = 30
  const tagImg = textToImage("КЛЮЧЕВЫЕ ПРЕИМУЩЕСТВА", {
    fontSize: 10, fontWeight: "700", color: "#A78BFA", maxWidth: 170,
  })
  doc.addImage(tagImg.dataUrl, "PNG", 20, y, 170, tagImg.height)
  y += tagImg.height + 4

  const hTitleImg = textToImage("Что делает объект привлекательным", {
    fontSize: 22, fontWeight: "700", color: "#FFFFFF", maxWidth: 170, lineHeight: 1.15,
  })
  doc.addImage(hTitleImg.dataUrl, "PNG", 20, y, 170, hTitleImg.height)
  y += hTitleImg.height + 12

  // Нормализуем highlights в объекты
  const items: HighlightItem[] = (data.highlights || []).slice(0, 4).map((h, i) => {
    if (typeof h === "string") {
      const defaults: HighlightItem[] = [
        { icon: "⬢", title: "Локация", text: h },
        { icon: "▲", title: "Планировка", text: h },
        { icon: "●", title: "Доходность", text: h },
        { icon: "■", title: "Стабильность", text: h },
      ]
      return defaults[i] ?? { title: `Пункт ${i + 1}`, text: h }
    }
    return h
  })

  // Сетка 2×2 карточек
  const gap = 6
  const cardW = (W - 40 - gap) / 2
  const cardH = 55
  const accentColors: [number, number, number][] = [
    PALETTE.accent,
    PALETTE.accent2,
    PALETTE.accent3,
    [34, 197, 94],
  ]
  const iconChars = ["◆", "▲", "●", "■"]

  items.forEach((item, i) => {
    const cx = 20 + (i % 2) * (cardW + gap)
    const cy = y + Math.floor(i / 2) * (cardH + gap)
    const color = accentColors[i % accentColors.length]

    // Карточка
    doc.setFillColor(255, 255, 255)
    try {
      const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
      if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 0.06 }) as never)
    } catch { /* noop */ }
    doc.roundedRect(cx, cy, cardW, cardH, 4, 4, "F")
    try {
      const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
      if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 1 }) as never)
    } catch { /* noop */ }

    // Левая цветная полоса
    doc.setFillColor(...color)
    doc.roundedRect(cx, cy, 2, cardH, 1, 1, "F")

    // Иконка (круг + символ)
    doc.setFillColor(...color)
    try {
      const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
      if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 0.2 }) as never)
    } catch { /* noop */ }
    doc.circle(cx + 12, cy + 12, 5, "F")
    try {
      const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
      if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 1 }) as never)
    } catch { /* noop */ }

    const iconImg = textToImage(iconChars[i % iconChars.length], {
      fontSize: 10, fontWeight: "700",
      color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
      maxWidth: 10, align: "center",
    })
    doc.addImage(iconImg.dataUrl, "PNG", cx + 7, cy + 8.5, 10, iconImg.height)

    // Заголовок карточки
    const tI = textToImage(item.title, {
      fontSize: 12, fontWeight: "700", color: "#FFFFFF", maxWidth: cardW - 10,
    })
    doc.addImage(tI.dataUrl, "PNG", cx + 22, cy + 8, cardW - 26, tI.height)

    // Текст
    const txtI = textToImage(item.text, {
      fontSize: 8.5, fontWeight: "400", color: "#CBD5E1",
      maxWidth: cardW - 10, lineHeight: 1.4,
    })
    doc.addImage(txtI.dataUrl, "PNG", cx + 6, cy + 22, cardW - 12, Math.min(txtI.height, cardH - 25))
  })
}

// ── Страница: Характеристики + Инвест ─────────────────────────────────────────
function renderSpecsAndWhyBuy(doc: jsPDF, data: PresentationContent) {
  doc.addPage()
  const W = 210, H = 297
  doc.setFillColor(...PALETTE.bg)
  doc.rect(0, 0, W, H, "F")

  doc.setFillColor(...PALETTE.accent2)
  doc.rect(0, 0, W, 2, "F")

  doc.setFillColor(...PALETTE.card)
  doc.circle(195, 15, 8, "F")
  const numImg = textToImage("04", { fontSize: 9, fontWeight: "700", color: "#FFFFFF", maxWidth: 20, align: "center" })
  doc.addImage(numImg.dataUrl, "PNG", 185, 11, 20, numImg.height)

  let y = 30
  const tagImg = textToImage("ХАРАКТЕРИСТИКИ", {
    fontSize: 10, fontWeight: "700", color: "#60A5FA", maxWidth: 170,
  })
  doc.addImage(tagImg.dataUrl, "PNG", 20, y, 170, tagImg.height)
  y += tagImg.height + 4

  const hImg = textToImage("Ключевые параметры", {
    fontSize: 22, fontWeight: "700", color: "#FFFFFF", maxWidth: 170,
  })
  doc.addImage(hImg.dataUrl, "PNG", 20, y, 170, hImg.height)
  y += hImg.height + 12

  // Таблица specs: 2 колонки вертикально
  const specs = Object.entries(data.specs).filter(([, v]) => v)
  const rowH = 12
  specs.forEach(([key, val], i) => {
    const ry = y + i * rowH
    // Чередование фона
    if (i % 2 === 0) {
      doc.setFillColor(...PALETTE.card)
      doc.roundedRect(20, ry - 1, W - 40, rowH - 1, 2, 2, "F")
    }
    const kImg = textToImage(key, { fontSize: 10, fontWeight: "500", color: "#94A3B8", maxWidth: 80 })
    doc.addImage(kImg.dataUrl, "PNG", 25, ry + 2, 80, kImg.height)
    const vImg = textToImage(val, { fontSize: 11, fontWeight: "700", color: "#FFFFFF", maxWidth: 100, align: "right" })
    doc.addImage(vImg.dataUrl, "PNG", 110, ry + 2, W - 135, vImg.height)
  })
  y += specs.length * rowH + 10

  // Секция: Инвестиционная привлекательность
  if (data.investment_appeal) {
    // Градиентная карточка
    doc.setFillColor(...PALETTE.accent)
    try {
      const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
      if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 0.15 }) as never)
    } catch { /* noop */ }
    const iaText = textToImage(data.investment_appeal, {
      fontSize: 11, fontWeight: "400", color: "#F1F5F9", maxWidth: W - 60, lineHeight: 1.55,
    })
    const cardH = iaText.height + 22
    doc.roundedRect(20, y, W - 40, cardH, 4, 4, "F")
    try {
      const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
      if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 1 }) as never)
    } catch { /* noop */ }

    // Акцентная полоса
    doc.setFillColor(...PALETTE.accent)
    doc.roundedRect(20, y, 3, cardH, 1.5, 1.5, "F")

    const iaTag = textToImage("ИНВЕСТИЦИОННАЯ ПРИВЛЕКАТЕЛЬНОСТЬ", {
      fontSize: 8, fontWeight: "700", color: "#A78BFA", maxWidth: W - 60,
    })
    doc.addImage(iaTag.dataUrl, "PNG", 30, y + 6, W - 60, iaTag.height)
    doc.addImage(iaText.dataUrl, "PNG", 30, y + 6 + iaTag.height + 2, W - 60, iaText.height)
  }
}

// ── Страница: Почему купить + контакты ───────────────────────────────────────
function renderClosing(doc: jsPDF, data: PresentationContent) {
  doc.addPage()
  const W = 210, H = 297
  gradientBackground(doc, [20, 15, 45], [45, 20, 80])

  doc.setFillColor(...PALETTE.accent)
  doc.rect(0, 0, W, 2, "F")

  doc.setFillColor(...PALETTE.card)
  doc.circle(195, 15, 8, "F")
  const numImg = textToImage("05", { fontSize: 9, fontWeight: "700", color: "#FFFFFF", maxWidth: 20, align: "center" })
  doc.addImage(numImg.dataUrl, "PNG", 185, 11, 20, numImg.height)

  let y = 30
  const tagImg = textToImage("ПОЧЕМУ СТОИТ ВЫБРАТЬ", {
    fontSize: 10, fontWeight: "700", color: "#F0ABFC", maxWidth: 170,
  })
  doc.addImage(tagImg.dataUrl, "PNG", 20, y, 170, tagImg.height)
  y += tagImg.height + 6

  const reasons = data.why_buy && data.why_buy.length > 0 ? data.why_buy : []

  if (reasons.length > 0) {
    const hImg = textToImage("5 причин инвестировать", {
      fontSize: 22, fontWeight: "700", color: "#FFFFFF", maxWidth: 170,
    })
    doc.addImage(hImg.dataUrl, "PNG", 20, y, 170, hImg.height)
    y += hImg.height + 12

    reasons.slice(0, 5).forEach((reason, i) => {
      // Номер в кружке
      doc.setFillColor(...PALETTE.accent)
      doc.circle(26, y + 4, 4.5, "F")
      const numI = textToImage(String(i + 1), {
        fontSize: 10, fontWeight: "800", color: "#FFFFFF", maxWidth: 10, align: "center",
      })
      doc.addImage(numI.dataUrl, "PNG", 21, y + 1, 10, numI.height)

      // Текст
      const rImg = textToImage(reason, {
        fontSize: 11, fontWeight: "500", color: "#F1F5F9", maxWidth: W - 50, lineHeight: 1.45,
      })
      doc.addImage(rImg.dataUrl, "PNG", 36, y + 0.5, W - 50, rImg.height)

      y += Math.max(rImg.height, 10) + 4
    })
  }

  // CTA + Контакты (низ страницы)
  const footerY = H - 70
  doc.setFillColor(255, 255, 255)
  try {
    const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
    if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 0.08 }) as never)
  } catch { /* noop */ }
  doc.roundedRect(20, footerY, W - 40, 55, 5, 5, "F")
  try {
    const GStateCtor = (doc as unknown as { GState?: new (o: object) => unknown }).GState
    if (GStateCtor) doc.setGState(new GStateCtor({ opacity: 1 }) as never)
  } catch { /* noop */ }

  const ctaTag = textToImage("ГОТОВЫ ОБСУДИТЬ", {
    fontSize: 9, fontWeight: "700", color: "#A78BFA", maxWidth: W - 60,
  })
  doc.addImage(ctaTag.dataUrl, "PNG", 30, footerY + 8, W - 60, ctaTag.height)

  const ctaImg = textToImage(data.call_to_action, {
    fontSize: 13, fontWeight: "600", color: "#FFFFFF", maxWidth: W - 60, lineHeight: 1.35,
  })
  doc.addImage(ctaImg.dataUrl, "PNG", 30, footerY + 14, W - 60, ctaImg.height)

  // Контакты
  const contactLines: string[] = []
  if (data.contact.name) contactLines.push(data.contact.name)
  if (data.contact.company) contactLines.push(data.contact.company)
  if (data.contact.phone) contactLines.push(data.contact.phone)
  const contactText = contactLines.join("  •  ")
  if (contactText) {
    const cImg = textToImage(contactText, {
      fontSize: 10, fontWeight: "500", color: "#CBD5E1", maxWidth: W - 60,
    })
    doc.addImage(cImg.dataUrl, "PNG", 30, footerY + 45, W - 60, cImg.height)
  }
}

// ── Публичный API ────────────────────────────────────────────────────────────
export async function buildPdf(data: PresentationContent, photoUrls: string[]): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true })
  await renderCover(doc, data, photoUrls)
  await renderSummary(doc, data, photoUrls)
  renderHighlights(doc, data)
  renderSpecsAndWhyBuy(doc, data)
  renderClosing(doc, data)

  const safeName = (data.object_title || "presentation")
    .replace(/[^a-zA-Zа-яА-Я0-9\s]/g, "")
    .trim().replace(/\s+/g, "_")
  doc.save(`${safeName || "presentation"}.pdf`)
}

export async function buildPdfBase64(data: PresentationContent, photoUrls: string[]): Promise<string> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true })
  await renderCover(doc, data, photoUrls)
  await renderSummary(doc, data, photoUrls)
  renderHighlights(doc, data)
  renderSpecsAndWhyBuy(doc, data)
  renderClosing(doc, data)
  return doc.output("datauristring").split(",")[1]
}

// ── Загрузка изображения через прокси-канвас ─────────────────────────────────
async function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const maxSize = 1400
      const ratio = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
      canvas.width = Math.round(img.naturalWidth * ratio)
      canvas.height = Math.round(img.naturalHeight * ratio)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", 0.82))
    }
    img.onerror = reject
    img.src = url
  })
}
