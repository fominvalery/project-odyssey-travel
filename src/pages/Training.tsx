import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import Icon from "@/components/ui/icon"
import func2url from "../../backend/func2url.json"

const API_URL = (func2url as Record<string, string>)["content-articles"]

const CATS = [
  { id: "faq",     label: "FAQ" },
  { id: "guide",   label: "Инструкции" },
  { id: "video",   label: "Видеоуроки" },
  { id: "webinar", label: "Вебинары" },
]

const CAT_ICONS: Record<string, string> = {
  guide: "BookOpen", video: "PlayCircle", faq: "HelpCircle", webinar: "MonitorPlay",
}

interface Article {
  id: string
  title: string
  preview: string
  category: string
  tags: string
  photos: string[]
  videos: string[]
  body: string
  created_at: string
}

function getEmbedUrl(url: string): string {
  if (url.includes("youtube.com/watch")) return url.replace("watch?v=", "embed/")
  if (url.includes("youtu.be/")) return "https://www.youtube.com/embed/" + url.split("youtu.be/")[1]
  if (url.includes("rutube.ru/video/")) {
    const id = url.split("/video/")[1]?.split("?")[0]?.replace(/\//g, "")
    return id ? `https://rutube.ru/play/embed/${id}` : url
  }
  return url
}

export default function Training() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState("faq")
  const [selected, setSelected] = useState<Article | null>(null)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const prevPhoto = useCallback(() => setPhotoIdx(i => Math.max(0, i - 1)), [])
  const nextPhoto = useCallback((max: number) => setPhotoIdx(i => Math.min(max - 1, i + 1)), [])

  useEffect(() => {
    if (!API_URL) return
    fetch(`${API_URL}?type=training&status=published`)
      .then(r => r.text())
      .then(text => {
        const data = JSON.parse(text.startsWith('"') ? JSON.parse(text) : text)
        setArticles(data.articles || [])
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = catFilter ? articles.filter(a => a.category === catFilter) : articles

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />

      {/* Hero */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/15 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-sm mb-6">
            <Icon name="GraduationCap" className="h-4 w-4" />
            Обучение по платформе
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Как работать с Кабинет-24
          </h1>
          <p className="text-gray-400 text-lg">
            Видеоуроки, инструкции и разборы для брокеров и агентств — всё что нужно для эффективной работы
          </p>
        </div>
      </section>

      {/* Фильтры */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex gap-2 flex-wrap">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                catFilter === c.id
                  ? "bg-amber-500 text-black border-amber-500"
                  : "border-[#2a2a2a] text-gray-400 hover:text-white hover:border-gray-500"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Материалы */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <Icon name="GraduationCap" className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Материалов пока нет</p>
            <p className="text-sm mt-2">Скоро здесь появятся инструкции и видеоуроки</p>
          </div>
        ) : catFilter === "faq" || (!catFilter && filtered.every(a => a.category === "faq")) ? (
          /* FAQ — аккордеон */
          <div className="max-w-3xl mx-auto space-y-2">
            {filtered.map(a => {
              const isOpen = openFaq === a.id
              return (
                <div key={a.id} className="border border-[#2a2a2a] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : a.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#161616] transition-colors"
                  >
                    <span className="text-sm font-medium text-white pr-4">{a.title}</span>
                    <Icon name="ChevronDown" className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-3 text-sm text-gray-400 leading-relaxed border-t border-[#1f1f1f]">
                        {a.body}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(a => {
              const iconName = CAT_ICONS[a.category] || "BookOpen"
              const hasVideo = a.videos?.length > 0
              return (
                <article
                  key={a.id}
                  onClick={() => { setSelected(a); setPhotoIdx(0) }}
                  className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all cursor-pointer group"
                >
                  {a.photos?.[0] ? (
                    <div className="h-44 overflow-hidden relative">
                      <img src={a.photos[0]} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-12 h-12 rounded-full bg-amber-500/90 flex items-center justify-center">
                            <Icon name="Play" className="h-5 w-5 text-black ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-amber-900/20 to-[#111] flex items-center justify-center relative">
                      <Icon name={iconName as "BookOpen"} className="h-10 w-10 text-amber-500/30" />
                      {hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-amber-500/80 flex items-center justify-center">
                            <Icon name="Play" className="h-4 w-4 text-black ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-full capitalize">
                        {CATS.find(c => c.id === a.category)?.label || a.category}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-white line-clamp-2 mb-1 leading-snug">{a.title}</h2>
                    <p className="text-xs text-gray-500 line-clamp-2">{a.preview}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Просмотр материала */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl max-w-3xl w-full my-8 overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Карусель фото */}
            {selected.photos?.length > 0 && (
              <div
                className="relative bg-black select-none"
                onTouchStart={e => { (e.currentTarget as HTMLDivElement).dataset.touchX = String(e.touches[0].clientX) }}
                onTouchEnd={e => {
                  const startX = Number((e.currentTarget as HTMLDivElement).dataset.touchX)
                  const diff = startX - e.changedTouches[0].clientX
                  if (Math.abs(diff) > 40) {
                    if (diff > 0) nextPhoto(selected.photos.length)
                    else prevPhoto()
                  }
                }}
              >
                <img
                  src={selected.photos[photoIdx]}
                  alt={selected.title}
                  className="w-full max-h-[420px] object-contain"
                />
                {selected.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      disabled={photoIdx === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/80 transition"
                    >
                      <Icon name="ChevronLeft" className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => nextPhoto(selected.photos.length)}
                      disabled={photoIdx === selected.photos.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/80 transition"
                    >
                      <Icon name="ChevronRight" className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {selected.photos.map((_, i) => (
                        <button key={i} onClick={() => setPhotoIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIdx ? "bg-white scale-125" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="p-8">
              <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm mb-6 transition-colors">
                <Icon name="ArrowLeft" className="h-4 w-4" />
                Назад
              </button>
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full mb-4 inline-block">
                {CATS.find(c => c.id === selected.category)?.label || selected.category}
              </span>
              <h1 className="text-2xl font-bold text-white mt-3 mb-4">{selected.title}</h1>
              {selected.preview && <p className="text-gray-400 text-base mb-6 border-l-2 border-amber-500 pl-4 italic">{selected.preview}</p>}

              {/* Видео */}
              {selected.videos?.length > 0 && (
                <div className="space-y-4 mb-6">
                  {selected.videos.map((url, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe src={getEmbedUrl(url)} className="w-full h-full" allowFullScreen title={`video-${i}`} />
                    </div>
                  ))}
                </div>
              )}

              {selected.body && <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">{selected.body}</div>}

              {selected.tags && (
                <div className="flex gap-1.5 flex-wrap">
                  {selected.tags.split(",").map(t => (
                    <span key={t} className="text-xs text-gray-500 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">#{t.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}