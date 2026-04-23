import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { agencyApi, Review } from "@/lib/agencyApi"
import { toast } from "@/hooks/use-toast"

interface Props {
  orgId: string
  userId: string | null
  userName: string
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Icon name="Star" className={`h-5 w-5 transition-colors ${n <= value ? "text-amber-400" : "text-gray-600"}`} />
        </button>
      ))}
    </div>
  )
}

export default function AgencyReviewsTab({ orgId, userId, userName }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [writing, setWriting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ rating: 5, text: "", deal_type: "", author_name: userName })

  async function load() {
    setLoading(true)
    try {
      const data = await agencyApi.listReviews(orgId)
      setReviews(data.reviews)
      setAvgRating(data.avg_rating)
      setCount(data.count)
    } catch { setReviews([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!form.text.trim()) { toast({ title: "Напишите текст отзыва", variant: "destructive" }); return }
    setSaving(true)
    try {
      await agencyApi.createReview(userId || "", orgId, {
        rating: form.rating,
        text: form.text,
        deal_type: form.deal_type,
        author_name: form.author_name || userName,
      } as Partial<Review>)
      toast({ title: "Отзыв опубликован. Спасибо!" })
      setWriting(false)
      setForm({ rating: 5, text: "", deal_type: "", author_name: userName })
      await load()
    } catch (e: unknown) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Сводка рейтинга */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-white">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
          <StarRating value={Math.round(avgRating)} />
          <p className="text-xs text-gray-500 mt-1">{count} отзывов</p>
        </div>
        <div className="flex-1">
          {[5,4,3,2,1].map(star => {
            const cnt = reviews.filter(r => r.rating === star).length
            const pct = count > 0 ? Math.round(cnt / count * 100) : 0
            return (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 w-3">{star}</span>
                <Icon name="Star" className="h-3 w-3 text-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-5 text-right">{cnt}</span>
              </div>
            )
          })}
        </div>
        <button onClick={() => setWriting(v => !v)}
          className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors">
          Оставить отзыв
        </button>
      </div>

      {/* Форма отзыва */}
      {writing && (
        <div className="rounded-2xl bg-[#111] border border-amber-500/20 p-5 space-y-4">
          <p className="text-sm font-semibold text-white">Ваш отзыв</p>
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">Оценка</Label>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">Тип сделки (необязательно)</Label>
            <Input value={form.deal_type} onChange={e => setForm(f => ({ ...f, deal_type: e.target.value }))}
              placeholder="Продажа коммерции, аренда офиса..."
              className="bg-[#0f0f0f] border-[#262626] text-white placeholder:text-gray-600 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">Текст отзыва *</Label>
            <textarea rows={4} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              placeholder="Расскажите о своём опыте работы с агентством..."
              className="w-full bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? "Публикую..." : "Опубликовать"}
            </button>
            <button onClick={() => setWriting(false)}
              className="px-5 py-2.5 rounded-xl border border-[#2a2a2a] text-gray-400 hover:text-white text-sm transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список */}
      {loading ? (
        <div className="text-center py-12"><Icon name="Loader2" className="h-6 w-6 text-amber-400 animate-spin mx-auto" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Icon name="Star" className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>Отзывов пока нет. Будьте первым!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-white text-sm">{r.author_name}</p>
                  {r.deal_type && <p className="text-xs text-gray-500">{r.deal_type}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StarRating value={r.rating} />
                  <span className="text-xs text-gray-500 ml-1">
                    {new Date(r.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </div>
              {r.text && <p className="text-sm text-gray-300 leading-relaxed">{r.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
