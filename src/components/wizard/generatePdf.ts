import jsPDF from "jspdf"
import html2canvas from "html2canvas"

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

const PAGE_W = 794
const PAGE_H = 1123

function normalizeHighlights(items: (HighlightItem | string)[]): HighlightItem[] {
  const defaults = [
    { emoji: "📍", title: "Локация" },
    { emoji: "🏢", title: "Планировка" },
    { emoji: "📈", title: "Доходность" },
    { emoji: "🛡", title: "Стабильность" },
  ]
  return items.slice(0, 4).map((h, i) => {
    if (typeof h === "string") {
      return { icon: defaults[i].emoji, title: defaults[i].title, text: h }
    }
    return {
      icon: h.icon || defaults[i].emoji,
      title: h.title || defaults[i].title,
      text: h.text || "",
    }
  })
}

function createPageContainer(): HTMLDivElement {
  const div = document.createElement("div")
  div.style.position = "fixed"
  div.style.left = "-99999px"
  div.style.top = "0"
  div.style.width = `${PAGE_W}px`
  div.style.height = `${PAGE_H}px`
  div.style.fontFamily = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
  div.style.color = "#fff"
  div.style.overflow = "hidden"
  document.body.appendChild(div)
  return div
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))
}

function pageCover(data: PresentationContent, heroPhoto?: string): string {
  const heroBg = heroPhoto
    ? `background-image: linear-gradient(to bottom, rgba(15,15,35,0.3) 0%, rgba(15,15,35,0.55) 50%, rgba(10,12,24,0.98) 100%), url('${heroPhoto}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #6d28d9 100%);`
  const stat = data.hero_stat
  return `
    <div style="width:100%;height:100%;${heroBg};position:relative;display:flex;flex-direction:column;justify-content:flex-end;padding:60px 56px 56px;box-sizing:border-box;">
      <div style="position:absolute;top:40px;left:56px;display:flex;align-items:center;gap:10px;">
        <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#8b5cf6,#ec4899);"></div>
        <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.9);letter-spacing:1px;">КОММЕРЧЕСКАЯ НЕДВИЖИМОСТЬ</div>
      </div>
      <div style="position:absolute;top:40px;right:56px;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:3px;">01 / 05</div>

      <div style="display:inline-block;padding:6px 14px;background:rgba(139,92,246,0.25);border:1px solid rgba(167,139,250,0.4);border-radius:999px;font-size:11px;font-weight:600;color:#c4b5fd;letter-spacing:2px;margin-bottom:24px;width:fit-content;">
        ПРЕМИУМ-ОБЪЕКТ
      </div>

      <h1 style="font-size:56px;font-weight:800;line-height:1.05;margin:0 0 20px;color:#fff;letter-spacing:-1px;max-width:620px;">${escapeHtml(data.headline)}</h1>

      <p style="font-size:20px;font-weight:400;line-height:1.4;color:rgba(226,232,240,0.9);margin:0 0 40px;max-width:620px;">${escapeHtml(data.tagline)}</p>

      ${stat?.value ? `
        <div style="display:inline-flex;align-items:baseline;gap:16px;padding:20px 28px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:16px;width:fit-content;">
          <div style="font-size:40px;font-weight:800;color:#fff;line-height:1;">${escapeHtml(stat.value)}</div>
          <div style="font-size:13px;color:#a78bfa;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(stat.label)}</div>
        </div>
      ` : ""}
    </div>
  `
}

function pageSummary(data: PresentationContent, photos: string[]): string {
  const gallery = photos.slice(1, 5)
  return `
    <div style="width:100%;height:100%;background:#0a0c18;padding:64px 56px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,#8b5cf6,#ec4899);"></div>
      <div style="position:absolute;top:30px;right:56px;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:3px;">02 / 05</div>

      <div style="font-size:12px;font-weight:700;color:#a78bfa;letter-spacing:3px;margin-bottom:12px;">О ОБЪЕКТЕ</div>
      <h2 style="font-size:34px;font-weight:700;color:#fff;margin:0 0 8px;line-height:1.15;letter-spacing:-0.5px;">${escapeHtml(data.object_title)}</h2>
      <div style="width:48px;height:3px;background:linear-gradient(90deg,#8b5cf6,#ec4899);border-radius:2px;margin-bottom:24px;"></div>

      <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 36px;max-width:720px;">${escapeHtml(data.summary)}</p>

      ${gallery.length > 0 ? `
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
          ${gallery.map(url => `
            <div style="aspect-ratio:16/10;background-image:url('${url}');background-size:cover;background-position:center;border-radius:12px;border:1px solid rgba(255,255,255,0.08);"></div>
          `).join("")}
        </div>
      ` : ""}

      <div style="position:absolute;bottom:40px;left:56px;right:56px;display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.3);">
        <div>${escapeHtml(data.contact.company || "")}</div>
        <div>${escapeHtml(data.contact.phone || "")}</div>
      </div>
    </div>
  `
}

function pageHighlights(data: PresentationContent): string {
  const items = normalizeHighlights(data.highlights)
  const colors = [
    { grad: "linear-gradient(135deg,#8b5cf6,#6366f1)", bar: "#8b5cf6" },
    { grad: "linear-gradient(135deg,#3b82f6,#06b6d4)", bar: "#3b82f6" },
    { grad: "linear-gradient(135deg,#ec4899,#f43f5e)", bar: "#ec4899" },
    { grad: "linear-gradient(135deg,#10b981,#059669)", bar: "#10b981" },
  ]
  return `
    <div style="width:100%;height:100%;background:linear-gradient(135deg,#0f0f2a 0%,#1a1438 100%);padding:64px 56px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,#8b5cf6,#ec4899);"></div>
      <div style="position:absolute;top:30px;right:56px;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:3px;">03 / 05</div>

      <div style="font-size:12px;font-weight:700;color:#a78bfa;letter-spacing:3px;margin-bottom:12px;">ПРЕИМУЩЕСТВА</div>
      <h2 style="font-size:34px;font-weight:700;color:#fff;margin:0 0 6px;line-height:1.15;letter-spacing:-0.5px;">Что делает объект привлекательным</h2>
      <div style="width:48px;height:3px;background:linear-gradient(90deg,#8b5cf6,#ec4899);border-radius:2px;margin-bottom:32px;"></div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
        ${items.map((item, i) => {
          const c = colors[i % colors.length]
          return `
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;position:relative;overflow:hidden;">
              <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${c.bar};"></div>
              <div style="width:48px;height:48px;border-radius:12px;background:${c.grad};display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:16px;">${escapeHtml(item.icon || "◆")}</div>
              <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:10px;line-height:1.2;">${escapeHtml(item.title)}</div>
              <div style="font-size:13px;line-height:1.55;color:#cbd5e1;">${escapeHtml(item.text)}</div>
            </div>
          `
        }).join("")}
      </div>
    </div>
  `
}

function pageSpecs(data: PresentationContent): string {
  const specs = Object.entries(data.specs).filter(([, v]) => v)
  return `
    <div style="width:100%;height:100%;background:#0a0c18;padding:64px 56px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,#3b82f6,#06b6d4);"></div>
      <div style="position:absolute;top:30px;right:56px;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:3px;">04 / 05</div>

      <div style="font-size:12px;font-weight:700;color:#60a5fa;letter-spacing:3px;margin-bottom:12px;">ХАРАКТЕРИСТИКИ</div>
      <h2 style="font-size:34px;font-weight:700;color:#fff;margin:0 0 6px;line-height:1.15;letter-spacing:-0.5px;">Ключевые параметры</h2>
      <div style="width:48px;height:3px;background:linear-gradient(90deg,#3b82f6,#06b6d4);border-radius:2px;margin-bottom:28px;"></div>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;margin-bottom:28px;">
        ${specs.map(([k, v], i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 24px;${i < specs.length - 1 ? "border-bottom:1px solid rgba(255,255,255,0.06);" : ""}background:${i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)"};">
            <div style="font-size:13px;color:#94a3b8;font-weight:500;">${escapeHtml(k)}</div>
            <div style="font-size:16px;color:#fff;font-weight:700;">${escapeHtml(v)}</div>
          </div>
        `).join("")}
      </div>

      <div style="background:linear-gradient(135deg,rgba(139,92,246,0.18),rgba(236,72,153,0.10));border:1px solid rgba(167,139,250,0.3);border-radius:16px;padding:24px 28px;position:relative;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#8b5cf6,#ec4899);border-radius:4px 0 0 4px;"></div>
        <div style="font-size:11px;font-weight:700;color:#a78bfa;letter-spacing:2.5px;margin-bottom:10px;">ИНВЕСТИЦИОННАЯ ПРИВЛЕКАТЕЛЬНОСТЬ</div>
        <div style="font-size:14.5px;line-height:1.65;color:#f1f5f9;">${escapeHtml(data.investment_appeal)}</div>
      </div>
    </div>
  `
}

function pageClosing(data: PresentationContent): string {
  const reasons = (data.why_buy && data.why_buy.length > 0 ? data.why_buy : [
    "Удобное расположение",
    "Прозрачные документы",
    "Потенциал роста стоимости",
    "Возможность быстрого выхода на сделку",
    "Профессиональная поддержка",
  ]).slice(0, 5)

  return `
    <div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0f3d 0%,#2d1b69 50%,#4c1d95 100%);padding:64px 56px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;top:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,#ec4899,#8b5cf6);"></div>
      <div style="position:absolute;top:30px;right:56px;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:3px;">05 / 05</div>

      <div style="font-size:12px;font-weight:700;color:#f0abfc;letter-spacing:3px;margin-bottom:12px;">ПОЧЕМУ СТОИТ ВЫБРАТЬ</div>
      <h2 style="font-size:34px;font-weight:700;color:#fff;margin:0 0 6px;line-height:1.15;letter-spacing:-0.5px;">${reasons.length} причин инвестировать</h2>
      <div style="width:48px;height:3px;background:linear-gradient(90deg,#ec4899,#8b5cf6);border-radius:2px;margin-bottom:28px;"></div>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:40px;">
        ${reasons.map((r, i) => `
          <div style="display:flex;align-items:flex-start;gap:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 18px;">
            <div style="flex-shrink:0;width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;">${i + 1}</div>
            <div style="padding-top:5px;font-size:14.5px;line-height:1.45;color:#f1f5f9;">${escapeHtml(r)}</div>
          </div>
        `).join("")}
      </div>

      <div style="position:absolute;left:56px;right:56px;bottom:56px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:26px 32px;">
        <div style="font-size:11px;font-weight:700;color:#a78bfa;letter-spacing:3px;margin-bottom:10px;">ГОТОВЫ ОБСУДИТЬ</div>
        <div style="font-size:17px;font-weight:600;color:#fff;margin-bottom:16px;line-height:1.4;">${escapeHtml(data.call_to_action)}</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:13px;color:#cbd5e1;">
          ${data.contact.name ? `<div style="display:flex;align-items:center;gap:6px;"><span style="color:#a78bfa;">●</span> ${escapeHtml(data.contact.name)}</div>` : ""}
          ${data.contact.company ? `<div style="display:flex;align-items:center;gap:6px;"><span style="color:#a78bfa;">●</span> ${escapeHtml(data.contact.company)}</div>` : ""}
          ${data.contact.phone ? `<div style="display:flex;align-items:center;gap:6px;"><span style="color:#a78bfa;">●</span> ${escapeHtml(data.contact.phone)}</div>` : ""}
        </div>
      </div>
    </div>
  `
}

async function renderHtmlToCanvas(html: string): Promise<HTMLCanvasElement> {
  const container = createPageContainer()
  container.innerHTML = html
  // Ждём загрузки всех img
  await Promise.all(
    Array.from(container.querySelectorAll("img")).map(img =>
      (img as HTMLImageElement).complete
        ? Promise.resolve()
        : new Promise(res => { (img as HTMLImageElement).onload = () => res(null); (img as HTMLImageElement).onerror = () => res(null) })
    )
  )
  await new Promise(r => setTimeout(r, 400))

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    width: PAGE_W,
    height: PAGE_H,
    logging: false,
  })
  container.remove()
  return canvas
}

async function buildDoc(data: PresentationContent, photos: string[]): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true })

  // Предзагружаем фото в dataURL чтобы background-image гарантированно отрендерился
  const preloadedPhotos: string[] = []
  for (const url of photos.slice(0, 5)) {
    try {
      preloadedPhotos.push(await urlToDataUrl(url))
    } catch {
      preloadedPhotos.push(url)
    }
  }

  const pages = [
    pageCover(data, preloadedPhotos[0]),
    pageSummary(data, preloadedPhotos),
    pageHighlights(data),
    pageSpecs(data),
    pageClosing(data),
  ]

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage()
    const canvas = await renderHtmlToCanvas(pages[i])
    const imgData = canvas.toDataURL("image/jpeg", 0.92)
    doc.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "MEDIUM")
  }

  return doc
}

async function urlToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const maxSize = 1400
      const r = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
      canvas.width = Math.round(img.naturalWidth * r)
      canvas.height = Math.round(img.naturalHeight * r)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL("image/jpeg", 0.88))
    }
    img.onerror = reject
    img.src = url
  })
}

export async function buildPdf(data: PresentationContent, photoUrls: string[]): Promise<void> {
  const doc = await buildDoc(data, photoUrls)
  const safeName = (data.object_title || "presentation")
    .replace(/[^a-zA-Zа-яА-Я0-9\s]/g, "").trim().replace(/\s+/g, "_")
  doc.save(`${safeName || "presentation"}.pdf`)
}

export async function buildPdfBase64(data: PresentationContent, photoUrls: string[]): Promise<string> {
  const doc = await buildDoc(data, photoUrls)
  return doc.output("datauristring").split(",")[1]
}
