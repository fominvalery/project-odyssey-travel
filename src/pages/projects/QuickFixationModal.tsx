import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../../backend/func2url.json"

interface Offer {
  id: string
  title: string
  city?: string
  category?: string
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  preselectedOffer?: Offer | null
}

const STATUS_OPTIONS = [
  "Заявка на фиксацию",
  "Зафиксирован",
  "Показ",
  "Бронь",
  "Переговоры",
  "Сделка",
  "Подготовка документов",
  "Оплата",
]

export default function QuickFixationModal({ open, onOpenChange, preselectedOffer }: Props) {
  const { user } = useAuthContext()

  const [step, setStep] = useState<"form" | "success">("form")
  const [loading, setLoading] = useState(false)

  // Поиск объекта
  const [offerSearch, setOfferSearch] = useState("")
  const [offerResults, setOfferResults] = useState<Offer[]>([])
  const [offerSearching, setOfferSearching] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(preselectedOffer || null)

  // Данные клиента
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [comment, setComment] = useState("")
  const [status, setStatus] = useState(STATUS_OPTIONS[0])

  useEffect(() => {
    if (open) {
      setStep("form")
      setClientName(""); setClientPhone(""); setClientEmail(""); setComment("")
      setStatus(STATUS_OPTIONS[0])
      setSelectedOffer(preselectedOffer || null)
      setOfferSearch(""); setOfferResults([])
    }
  }, [open, preselectedOffer])

  useEffect(() => {
    if (!offerSearch.trim() || selectedOffer) { setOfferResults([]); return }
    const t = setTimeout(async () => {
      setOfferSearching(true)
      try {
        const url = new URL((func2url as Record<string, string>)["agg-offers"])
        url.searchParams.set("search", offerSearch)
        url.searchParams.set("limit", "8")
        const res = await fetch(url.toString())
        const data = await res.json()
        setOfferResults(data.offers || [])
      } catch { setOfferResults([]) }
      finally { setOfferSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [offerSearch, selectedOffer])

  async function handleSubmit() {
    if (!clientName.trim()) return
    setLoading(true)
    try {
      await fetch((func2url as Record<string, string>)["agg-fixations"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id || "",
        },
        body: JSON.stringify({
          offer_id: selectedOffer?.id || null,
          full_name: clientName,
          phone: clientPhone,
          email: clientEmail,
          notes: comment,
          status,
        }),
      })
      setStep("success")
    } catch { /* pass */ }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#1f1f1f]">
          <DialogTitle className="text-lg font-bold">Зафиксировать клиента</DialogTitle>
        </DialogHeader>

        {step === "success" ? (
          <div className="px-6 py-12 text-center">
            <Icon name="CheckCircle2" className="h-14 w-14 text-emerald-400 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Фиксация создана!</p>
            <p className="text-gray-400 text-sm mt-2">Заявка передана в CRM. Ожидайте подтверждения от менеджера.</p>
            <Button
              className="mt-6 bg-violet-600 hover:bg-violet-700 text-white px-8"
              onClick={() => onOpenChange(false)}
            >
              Закрыть
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 max-h-[75vh] overflow-y-auto">

            {/* ── Левая колонка: объект + клиент ─────────────────────── */}
            <div className="px-6 py-5 space-y-4">

              {/* Объект */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Объект недвижимости
                </label>
                {selectedOffer ? (
                  <div className="flex items-start gap-2 p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white line-clamp-2">{selectedOffer.title}</p>
                      {selectedOffer.city && <p className="text-xs text-gray-400 mt-0.5">{selectedOffer.city}</p>}
                    </div>
                    <button
                      onClick={() => { setSelectedOffer(null); setOfferSearch("") }}
                      className="text-gray-500 hover:text-white shrink-0 mt-0.5"
                    >
                      <Icon name="X" className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Поиск объекта..."
                      value={offerSearch}
                      onChange={e => setOfferSearch(e.target.value)}
                      className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-violet-500"
                    />
                    {offerSearching && (
                      <Icon name="Loader2" className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />
                    )}
                    {offerResults.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
                        {offerResults.map(o => (
                          <button
                            key={o.id}
                            onClick={() => { setSelectedOffer(o); setOfferSearch(""); setOfferResults([]) }}
                            className="w-full text-left px-3 py-2.5 hover:bg-[#252525] transition-colors border-b border-[#222] last:border-0"
                          >
                            <p className="text-sm text-white line-clamp-1">{o.title}</p>
                            {o.city && <p className="text-xs text-gray-500">{o.city}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Клиент */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Клиент *
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="ФИО клиента"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-violet-500"
                  />
                  <Input
                    placeholder="+7 900 000 00 00"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                  />
                  <Input
                    placeholder="Email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Разделитель */}
            <div className="hidden md:block w-px bg-[#1f1f1f] my-5" />

            {/* ── Правая колонка: статус + комментарий ────────────────── */}
            <div className="px-6 py-5 space-y-4">

              {/* Статус */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Стадия и время
                </label>
                <p className="text-xs text-gray-500 mb-1.5">Статус фиксации</p>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s} className="bg-[#111]">{s}</option>
                  ))}
                </select>
              </div>

              {/* Комментарий */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Дополнительная информация</p>
                <p className="text-xs text-gray-500 mb-1.5">Комментарий</p>
                <Textarea
                  placeholder="Источник клиента, пожелания, бюджет..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {step === "form" && (
          <div className="px-6 py-4 border-t border-[#1f1f1f] flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-500 hover:text-white"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!clientName.trim() || loading}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2 px-6"
            >
              {loading ? (
                <><Icon name="Loader2" className="h-4 w-4 animate-spin" />Отправка...</>
              ) : (
                <><Icon name="BookmarkPlus" className="h-4 w-4" />Зафиксировать</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}