import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../../backend/func2url.json"

interface ContractorOffer {
  id: string
  title: string
  type: string
  region?: string
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  preselectedOffer?: ContractorOffer | null
}

const CONTRACTOR_URL = (func2url as Record<string, string>)["contractor-offers"]

export default function ContractorFixationModal({ open, onOpenChange, preselectedOffer }: Props) {
  const { user } = useAuthContext()
  const [step, setStep] = useState<"form" | "success">("form")
  const [loading, setLoading] = useState(false)

  const [offerSearch, setOfferSearch] = useState("")
  const [offerResults, setOfferResults] = useState<ContractorOffer[]>([])
  const [offerSearching, setOfferSearching] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<ContractorOffer | null>(preselectedOffer || null)

  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (open) {
      setStep("form")
      setClientName(""); setClientPhone(""); setClientEmail(""); setComment("")
      setSelectedOffer(preselectedOffer || null)
      setOfferSearch(""); setOfferResults([])
    }
  }, [open, preselectedOffer])

  useEffect(() => {
    if (!offerSearch.trim() || selectedOffer) { setOfferResults([]); return }
    const t = setTimeout(async () => {
      setOfferSearching(true)
      try {
        const res = await fetch(`${CONTRACTOR_URL}?status=active`)
        const data = await res.json()
        const q = offerSearch.toLowerCase()
        setOfferResults((data.offers || []).filter((o: ContractorOffer) =>
          o.title.toLowerCase().includes(q) || o.type?.toLowerCase().includes(q)
        ).slice(0, 8))
      } catch { setOfferResults([]) }
      finally { setOfferSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [offerSearch, selectedOffer])

  async function handleSubmit() {
    if (!clientName.trim()) return
    setLoading(true)
    try {
      await fetch(CONTRACTOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id || "",
        },
        body: JSON.stringify({
          action: "fixation",
          contractor_offer_id: selectedOffer?.id || null,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          notes: comment,
        }),
      })
      setStep("success")
    } catch { /* pass */ }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#2a2a2a] text-white max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#1f1f1f]">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Icon name="Handshake" className="h-5 w-5 text-orange-400" />
            Зафиксировать клиента по подряду
          </DialogTitle>
        </DialogHeader>

        {step === "success" ? (
          <div className="px-6 py-12 text-center">
            <Icon name="CheckCircle2" className="h-14 w-14 text-emerald-400 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Фиксация создана!</p>
            <p className="text-gray-400 text-sm mt-2">Заявка передана в CRM. Менеджер свяжется с вами.</p>
            <Button
              className="mt-6 bg-orange-600 hover:bg-orange-700 text-white px-8"
              onClick={() => onOpenChange(false)}
            >
              Закрыть
            </Button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">

            {/* Подряд */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Подряд
              </label>
              {selectedOffer ? (
                <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white line-clamp-1">{selectedOffer.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedOffer.type}{selectedOffer.region ? ` · ${selectedOffer.region}` : ""}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedOffer(null); setOfferSearch("") }}
                    className="text-gray-500 hover:text-white shrink-0"
                  >
                    <Icon name="X" className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Поиск подряда..."
                    value={offerSearch}
                    onChange={e => setOfferSearch(e.target.value)}
                    className="pl-9 bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-orange-500"
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
                          <p className="text-xs text-gray-500">{o.type}</p>
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
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-orange-500"
                />
                <Input
                  placeholder="+7 900 000 00 00"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
                <Input
                  placeholder="Email (необязательно)"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Комментарий */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Комментарий
              </label>
              <Textarea
                placeholder="Дополнительная информация о клиенте или запросе..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                className="bg-[#0d0d0d] border-[#2a2a2a] text-white placeholder:text-gray-600 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white">
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!clientName.trim() || loading}
                className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
              >
                {loading ? (
                  <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Отправляем...</>
                ) : (
                  <><Icon name="CheckCircle2" className="h-4 w-4 mr-2" />Зафиксировать</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
