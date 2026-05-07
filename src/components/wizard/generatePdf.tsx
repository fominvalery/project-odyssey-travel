import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer"

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 800,
    },
  ],
})

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

function normalizeHighlights(items: (HighlightItem | string)[]): HighlightItem[] {
  const defaults = [
    { title: "Локация" },
    { title: "Планировка" },
    { title: "Доходность" },
    { title: "Стабильность" },
  ]
  return items.slice(0, 4).map((h, i) => {
    if (typeof h === "string") {
      return { title: defaults[i].title, text: h }
    }
    return {
      title: h.title || defaults[i].title,
      text: h.text || "",
    }
  })
}

const PURPLE = "#8b5cf6"
const PINK = "#ec4899"
const BLUE = "#3b82f6"
const CYAN = "#06b6d4"
const GREEN = "#10b981"
const BG_DARK = "#0a0c18"
const BG_DEEP = "#0f0f2a"
const WHITE = "#ffffff"
const SLATE = "#cbd5e1"
const PURPLE_LIGHT = "#a78bfa"

const s = StyleSheet.create({
  page: { fontFamily: "Inter", backgroundColor: BG_DARK, color: WHITE },

  // Cover
  coverPage: { position: "relative", width: "100%", height: "100%" },
  coverBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  coverOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    background: "linear-gradient(to bottom, rgba(15,15,35,0.3), rgba(10,12,24,0.98))",
  },
  coverContent: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: "60 56 56 56",
    display: "flex", flexDirection: "column",
  },
  coverTopLeft: {
    position: "absolute", top: 40, left: 56,
    display: "flex", flexDirection: "row", alignItems: "center",
  },
  coverLogoBox: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: PURPLE,
    marginRight: 8,
  },
  coverLogoText: {
    fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.5,
  },
  coverPageNum: {
    position: "absolute", top: 40, right: 56,
    fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 3,
  },
  coverBadge: {
    alignSelf: "flex-start",
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.25)",
    borderWidth: 1, borderColor: "rgba(167,139,250,0.4)",
    marginBottom: 20,
  },
  coverBadgeText: {
    fontSize: 9, fontWeight: 700, color: "#c4b5fd", letterSpacing: 2,
  },
  coverHeadline: {
    fontSize: 42, fontWeight: 800, color: WHITE,
    lineHeight: 1.1, marginBottom: 14, maxWidth: 480,
  },
  coverTagline: {
    fontSize: 16, fontWeight: 400, color: "rgba(226,232,240,0.9)",
    lineHeight: 1.4, marginBottom: 32, maxWidth: 480,
  },
  coverStatBox: {
    display: "flex", flexDirection: "row", alignItems: "center",
    paddingVertical: 16, paddingHorizontal: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14, alignSelf: "flex-start", gap: 14,
  },
  coverStatValue: { fontSize: 32, fontWeight: 800, color: WHITE },
  coverStatLabel: { fontSize: 11, fontWeight: 700, color: PURPLE_LIGHT, letterSpacing: 0.5 },

  // Common
  accentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: PURPLE },
  pageNum: {
    position: "absolute", top: 26, right: 56,
    fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 3,
  },
  sectionLabel: { fontSize: 10, fontWeight: 700, color: PURPLE_LIGHT, letterSpacing: 3, marginBottom: 10 },
  sectionTitle: { fontSize: 28, fontWeight: 700, color: WHITE, lineHeight: 1.15, marginBottom: 6 },
  underline: { width: 40, height: 3, backgroundColor: PURPLE, borderRadius: 2, marginBottom: 20 },
  pageBody: { padding: "60 56 56 56", position: "relative", flex: 1 },

  // Summary
  summaryText: { fontSize: 13, lineHeight: 1.7, color: SLATE, marginBottom: 28, maxWidth: 480 },
  photoGrid: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoCell: { width: "48.5%", height: 140, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  summaryFooter: {
    position: "absolute", bottom: 32, left: 56, right: 56,
    display: "flex", flexDirection: "row", justifyContent: "space-between",
  },
  summaryFooterText: { fontSize: 9, color: "rgba(255,255,255,0.3)" },

  // Highlights
  highlightsPage: { backgroundColor: BG_DEEP },
  highlightsGrid: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 12 },
  highlightCard: {
    width: "47.5%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, padding: 18, position: "relative", overflow: "hidden",
  },
  highlightAccentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  highlightIconBox: {
    width: 40, height: 40, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  highlightIconNum: { fontSize: 18, fontWeight: 800, color: WHITE },
  highlightTitle: { fontSize: 15, fontWeight: 700, color: WHITE, marginBottom: 8, lineHeight: 1.2 },
  highlightText: { fontSize: 12, lineHeight: 1.55, color: SLATE },

  // Specs
  specsTable: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12, overflow: "hidden", marginBottom: 20,
  },
  specRow: {
    display: "flex", flexDirection: "row",
    paddingVertical: 12, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  specRowAlt: { backgroundColor: "rgba(255,255,255,0.02)" },
  specLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", flex: 1 },
  specValue: { fontSize: 12, fontWeight: 700, color: WHITE, flex: 1, textAlign: "right" },
  investBox: {
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1, borderColor: "rgba(139,92,246,0.25)",
    borderRadius: 12, padding: 18, position: "relative",
  },
  investBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: PURPLE, borderRadius: 2 },
  investLabel: { fontSize: 9, fontWeight: 700, color: PURPLE_LIGHT, letterSpacing: 2.5, marginBottom: 8, marginLeft: 12 },
  investText: { fontSize: 12, lineHeight: 1.65, color: SLATE, marginLeft: 12 },

  // Closing
  closingPage: { backgroundColor: "#1a0f3d" },
  reasonsList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 },
  reasonRow: {
    display: "flex", flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, gap: 12,
  },
  reasonNum: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: PURPLE,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  reasonNumText: { fontSize: 12, fontWeight: 800, color: WHITE },
  reasonText: { fontSize: 12, lineHeight: 1.45, color: "#f1f5f9", paddingTop: 5, flex: 1 },
  ctaBox: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 16, padding: "22 26",
  },
  ctaLabel: { fontSize: 9, fontWeight: 700, color: PURPLE_LIGHT, letterSpacing: 2.5, marginBottom: 8 },
  ctaText: { fontSize: 14, fontWeight: 700, color: WHITE, marginBottom: 14, lineHeight: 1.4 },
  ctaContacts: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 14 },
  ctaContactItem: { fontSize: 11, color: SLATE },
  ctaDot: { color: PURPLE_LIGHT, marginRight: 4 },
})

const HIGHLIGHT_COLORS = [
  { bg: PURPLE, bar: PURPLE },
  { bg: BLUE, bar: BLUE },
  { bg: PINK, bar: PINK },
  { bg: GREEN, bar: GREEN },
]

// ── Страница 1: Обложка ──────────────────────────────────────────────────────
function PageCover({ data, heroPhoto }: { data: PresentationContent; heroPhoto?: string }) {
  return (
    <Page size="A4" style={s.page}>
      {heroPhoto ? (
        <Image src={heroPhoto} style={s.coverBg} />
      ) : (
        <View style={[s.coverBg, { backgroundColor: "#312e81" }]} />
      )}
      {heroPhoto && (
        <View style={[s.coverBg, { backgroundColor: "rgba(10,12,24,0.65)" }]} />
      )}

      <View style={s.coverTopLeft}>
        <View style={s.coverLogoBox} />
        <Text style={s.coverLogoText}>КОММЕРЧЕСКАЯ НЕДВИЖИМОСТЬ</Text>
      </View>
      <Text style={s.coverPageNum}>01 / 05</Text>

      <View style={s.coverContent}>
        <View style={s.coverBadge}>
          <Text style={s.coverBadgeText}>ПРЕМИУМ-ОБЪЕКТ</Text>
        </View>
        <Text style={s.coverHeadline}>{data.headline}</Text>
        <Text style={s.coverTagline}>{data.tagline}</Text>
        {data.hero_stat?.value ? (
          <View style={s.coverStatBox}>
            <Text style={s.coverStatValue}>{data.hero_stat.value}</Text>
            <Text style={s.coverStatLabel}>{data.hero_stat.label?.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>
    </Page>
  )
}

// ── Страница 2: О объекте ────────────────────────────────────────────────────
function PageSummary({ data, photos }: { data: PresentationContent; photos: string[] }) {
  const gallery = photos.slice(1, 5)
  return (
    <Page size="A4" style={s.page}>
      <View style={[s.accentBar, { background: `linear-gradient(90deg, ${PURPLE}, ${PINK})` }]} />
      <Text style={s.pageNum}>02 / 05</Text>
      <View style={s.pageBody}>
        <Text style={s.sectionLabel}>О ОБЪЕКТЕ</Text>
        <Text style={s.sectionTitle}>{data.object_title}</Text>
        <View style={s.underline} />
        <Text style={s.summaryText}>{data.summary}</Text>

        {gallery.length > 0 && (
          <View style={s.photoGrid}>
            {gallery.map((url, i) => (
              <View key={i} style={s.photoCell}>
                <Image src={url} style={s.photoImg} />
              </View>
            ))}
          </View>
        )}

        <View style={s.summaryFooter}>
          <Text style={s.summaryFooterText}>{data.contact.company || ""}</Text>
          <Text style={s.summaryFooterText}>{data.contact.phone || ""}</Text>
        </View>
      </View>
    </Page>
  )
}

// ── Страница 3: Преимущества ─────────────────────────────────────────────────
function PageHighlights({ data }: { data: PresentationContent }) {
  const items = normalizeHighlights(data.highlights)
  return (
    <Page size="A4" style={[s.page, s.highlightsPage]}>
      <View style={[s.accentBar, { background: `linear-gradient(90deg, ${PURPLE}, ${PINK})` }]} />
      <Text style={s.pageNum}>03 / 05</Text>
      <View style={s.pageBody}>
        <Text style={s.sectionLabel}>ПРЕИМУЩЕСТВА</Text>
        <Text style={s.sectionTitle}>Что делает объект привлекательным</Text>
        <View style={s.underline} />

        <View style={s.highlightsGrid}>
          {items.map((item, i) => {
            const c = HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]
            return (
              <View key={i} style={s.highlightCard}>
                <View style={[s.highlightAccentBar, { backgroundColor: c.bar }]} />
                <View style={[s.highlightIconBox, { backgroundColor: c.bg }]}>
                  <Text style={s.highlightIconNum}>{i + 1}</Text>
                </View>
                <Text style={s.highlightTitle}>{item.title}</Text>
                <Text style={s.highlightText}>{item.text}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </Page>
  )
}

// ── Страница 4: Характеристики ───────────────────────────────────────────────
function PageSpecs({ data }: { data: PresentationContent }) {
  const specs = Object.entries(data.specs).filter(([, v]) => v)
  return (
    <Page size="A4" style={s.page}>
      <View style={[s.accentBar, { background: `linear-gradient(90deg, ${BLUE}, ${CYAN})` }]} />
      <Text style={[s.pageNum]}>04 / 05</Text>
      <View style={s.pageBody}>
        <Text style={[s.sectionLabel, { color: "#60a5fa" }]}>ХАРАКТЕРИСТИКИ</Text>
        <Text style={s.sectionTitle}>Ключевые параметры</Text>
        <View style={[s.underline, { backgroundColor: BLUE }]} />

        <View style={s.specsTable}>
          {specs.map(([label, value], i) => (
            <View key={i} style={[s.specRow, i % 2 === 1 ? s.specRowAlt : {}]}>
              <Text style={s.specLabel}>{label}</Text>
              <Text style={s.specValue}>{value}</Text>
            </View>
          ))}
        </View>

        {data.investment_appeal ? (
          <View style={s.investBox}>
            <View style={s.investBar} />
            <Text style={s.investLabel}>ИНВЕСТИЦИОННАЯ ПРИВЛЕКАТЕЛЬНОСТЬ</Text>
            <Text style={s.investText}>{data.investment_appeal}</Text>
          </View>
        ) : null}
      </View>
    </Page>
  )
}

// ── Страница 5: Почему стоит выбрать ────────────────────────────────────────
function PageClosing({ data }: { data: PresentationContent }) {
  const reasons = data.why_buy?.slice(0, 5) || []
  return (
    <Page size="A4" style={[s.page, s.closingPage]}>
      <View style={[s.accentBar, { background: `linear-gradient(90deg, ${PINK}, ${PURPLE})` }]} />
      <Text style={s.pageNum}>05 / 05</Text>
      <View style={s.pageBody}>
        <Text style={[s.sectionLabel, { color: "#f0abfc" }]}>ПОЧЕМУ СТОИТ ВЫБРАТЬ</Text>
        <Text style={s.sectionTitle}>{reasons.length} причин инвестировать</Text>
        <View style={[s.underline, { backgroundColor: PINK }]} />

        <View style={s.reasonsList}>
          {reasons.map((r, i) => (
            <View key={i} style={s.reasonRow}>
              <View style={s.reasonNum}>
                <Text style={s.reasonNumText}>{i + 1}</Text>
              </View>
              <Text style={s.reasonText}>{r}</Text>
            </View>
          ))}
        </View>

        <View style={s.ctaBox}>
          <Text style={s.ctaLabel}>ГОТОВЫ ОБСУДИТЬ</Text>
          <Text style={s.ctaText}>{data.call_to_action}</Text>
          <View style={s.ctaContacts}>
            {data.contact.name ? (
              <Text style={s.ctaContactItem}><Text style={s.ctaDot}>● </Text>{data.contact.name}</Text>
            ) : null}
            {data.contact.company ? (
              <Text style={s.ctaContactItem}><Text style={s.ctaDot}>● </Text>{data.contact.company}</Text>
            ) : null}
            {data.contact.phone ? (
              <Text style={s.ctaContactItem}><Text style={s.ctaDot}>● </Text>{data.contact.phone}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Page>
  )
}

// ── Документ ─────────────────────────────────────────────────────────────────
function PresentationDocument({ data, photos }: { data: PresentationContent; photos: string[] }) {
  return (
    <Document>
      <PageCover data={data} heroPhoto={photos[0]} />
      <PageSummary data={data} photos={photos} />
      <PageHighlights data={data} />
      <PageSpecs data={data} />
      <PageClosing data={data} />
    </Document>
  )
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Zа-яА-Я0-9\s_-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "presentation"
}

export async function buildPdf(data: PresentationContent, photoUrls: string[]): Promise<void> {
  const blob = await pdf(<PresentationDocument data={data} photos={photoUrls} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${sanitizeFilename(data.object_title || data.headline)}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export async function buildPdfBase64(data: PresentationContent, photoUrls: string[]): Promise<string> {
  const blob = await pdf(<PresentationDocument data={data} photos={photoUrls} />).toBlob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
