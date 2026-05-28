import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import Icon from "@/components/ui/icon"
import func2url from "../../backend/func2url.json"

const API_URL = (func2url as Record<string, string>)["content-articles"]

const CATS = [
  { id: "", label: "Все" },
  { id: "news",      label: "Новости" },
  { id: "analytics", label: "Аналитика" },
  { id: "case",      label: "Кейсы" },
  { id: "promo",     label: "Промо" },
]

interface Article {
  id: string
  title: string
  preview: string
  category: string
  tags: string
  photos: string[]
  videos: string[]
  created_at: string
}

function getEmbedUrl(url: string): string {
  if (url.includes("youtube.com/watch")) return url.replace("watch?v=", "embed/")
  if (url.includes("youtu.be/")) return "https://www.youtube.com/embed/" + url.split("youtu.be/")[1]
  if (url.includes("rutube.ru/video/")) {
    const id = url.split("/video/")[1]?.replace(/\//g, "")
    return id ? `https://rutube.ru/play/embed/${id}` : url
  }
  return url
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
}

export default function Blog() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState("")
  const [selected, setSelected] = useState<Article | null>(null)
  const [photoIdx, setPhotoIdx] = useState(0)

  const prevPhoto = useCallback(() => setPhotoIdx(i => Math.max(0, i - 1)), [])
  const nextPhoto = useCallback((max: number) => setPhotoIdx(i => Math.min(max - 1, i + 1)), [])

  useEffect(() => {
    if (!API_URL) return
    fetch(`${API_URL}?type=blog&status=published`)
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
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-6">
            <Icon name="Newspaper" className="h-4 w-4" />
            Новости и блог
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Новости платформы и рынка
          </h1>
          <p className="text-gray-400 text-lg">
            Актуальные новости, аналитика рынка коммерческой недвижимости и кейсы наших партнёров
          </p>
        </div>
      </section>

      {/* Фильтры категорий */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex gap-2 flex-wrap">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                catFilter === c.id
                  ? "bg-white text-black border-white"
                  : "border-[#2a2a2a] text-gray-400 hover:text-white hover:border-gray-500"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Статьи */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <Icon name="Newspaper" className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Материалов пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(a => (
              <article
                key={a.id}
                onClick={() => { setSelected(a); setPhotoIdx(0) }}
                className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all cursor-pointer group"
              >
                {a.photos?.[0] ? (
                  <div className="h-48 overflow-hidden">
                    <img src={a.photos[0]} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-blue-900/30 to-[#111] flex items-center justify-center">
                    <Icon name="Newspaper" className="h-10 w-10 text-blue-500/30" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">{formatDate(a.created_at)}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-white line-clamp-2 mb-2 leading-snug">{a.title}</h2>
                  <p className="text-xs text-gray-500 line-clamp-2">{a.preview}</p>
                  {a.tags && (
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {a.tags.split(",").slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] text-gray-600 bg-[#1a1a1a] px-2 py-0.5 rounded-md">#{t.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Модалка чтения статьи */}
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
              <p className="text-xs text-gray-500 mb-2">{formatDate(selected.created_at)}</p>
              <h1 className="text-2xl font-bold text-white mb-4">{selected.title}</h1>
              {selected.preview && <p className="text-gray-400 text-base mb-6 border-l-2 border-blue-500 pl-4 italic">{selected.preview}</p>}
              {selected.body && <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">{selected.body}</div>}

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