import { useState, useEffect, useCallback } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import ContractorFixationModal from "./ContractorFixationModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const CONTRACTOR_URL = (func2url as Record<string, string>)["contractor-offers"]

const CONTRACTOR_TYPES = [
  { id: "", label: "Все" },
  { id: "Строительство и ремонт", label: "Строительство" },
  { id: "Клининг", label: "Клининг" },
  { id: "Дизайн интерьера", label: "Дизайн" },
  { id: "Страхование", label: "Страхование" },
  { id: "Ипотека и финансы", label: "Ипотека" },
  { id: "Юридические услуги", label: "Юридические" },
  { id: "Оценка недвижимости", label: "Оценка" },
  { id: "Управление объектами", label: "Управление" },
  { id: "Фотосъёмка", label: "Фото" },
  { id: "Другое", label: "Другое" },
]

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-yellow-500/20 text-yellow-400",
  closed: "bg-gray-500/20 text-gray-400",
}
const STATUS_LABEL: Record<string, string> = {
  active: "Активен",
  paused: "Приостановлен",
  closed: "Завершён",
}

interface ContractorOffer {
  id: string
  title: string
  type: string
  company_name: string
  reward: string
  reward_type: "percent" | "fixed"
  description?: string
  region?: string
  status: string
  logo_url?: string
  photos?: string[]
  created_at: string
}

interface Props {
  onOpenFixModal?: () => void
}

export default function ContractorsPage({ onOpenFixModal: _ }: Props) {
  const [offers, setOffers] = useState<ContractorOffer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState("")
  const [search, setSearch] = useState("")
  const [fixModal, setFixModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<ContractorOffer | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = new URL(CONTRACTOR_URL)
      if (typeFilter) url.searchParams.set("type", typeFilter)
      const res = await fetch(url.toString())
      const data = await res.json()
      setOffers(data.offers || [])
      setTotal(data.total || 0)
    } catch {
      setOffers([])
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { load() }, [load])

  const filtered = offers.filter(o =>
    !search ||
    o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (o.region || "").toLowerCase().includes(search.toLowerCase())
  )

  function openFix(offer: ContractorOffer) {
    setSelectedOffer(offer)
    setFixModal(true)
  }

  function rewardLabel(offer: ContractorOffer) {
    if (offer.reward_type === "fixed") return `${Number(offer.reward).toLocaleString("ru-RU")} ₽`
    return `${offer.reward}%`
  }

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] min-h-screen">

      {/* Поиск + фильтры — sticky */}
      <div className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-[#1f1f1f] px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="relative max-w-sm">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Поиск по названию, компании, региону..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-orange-500"
            />
          </div>
          {/* Фильтр по типу */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            {CONTRACTOR_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors shrink-0 ${
                  typeFilter === t.id
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-[#1a1a1a] text-gray-400 hover:text-white border-[#2a2a2a]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Каталог */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <p className="text-xs text-gray-600 mb-4">
          {loading ? "Загружаем..." : `Подрядов: ${total}`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Icon name="Handshake" className="h-12 w-12 text-gray-700 mb-4" />
            <p className="text-gray-500 text-lg font-medium">Подрядов пока нет</p>
            <p className="text-gray-700 text-sm mt-1">Попробуй изменить фильтр или поисковый запрос</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(offer => (
              <div
                key={offer.id}
                className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#2a2a2a] transition-colors"
              >
                {/* Шапка */}
                <div className="flex items-start gap-3">
                  {offer.logo_url ? (
                    <img src={offer.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover border border-[#2a2a2a] shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                      <Icon name="Handshake" className="h-5 w-5 text-orange-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[offer.status] ?? STATUS_COLOR.active}`}>
                        {STATUS_LABEL[offer.status] ?? offer.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">{offer.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{offer.company_name}</p>
                  </div>
                </div>

                {/* Тип + регион */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full">
                    {offer.type}
                  </span>
                  {offer.region && (
                    <span className="text-xs bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Icon name="MapPin" className="h-3 w-3" />
                      {offer.region}
                    </span>
                  )}
                </div>

                {/* Описание */}
                {offer.description && (
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{offer.description}</p>
                )}

                {/* Вознаграждение */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#1f1f1f]">
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Вознаграждение</p>
                    <p className="text-lg font-bold text-emerald-400">{rewardLabel(offer)}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openFix(offer)}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                  >
                    <Icon name="UserCheck" className="h-3.5 w-3.5 mr-1.5" />
                    Зафиксировать
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContractorFixationModal
        open={fixModal}
        onOpenChange={setFixModal}
        preselectedOffer={selectedOffer}
      />
    </div>
  )
}
