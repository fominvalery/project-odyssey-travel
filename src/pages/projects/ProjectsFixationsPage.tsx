import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../../backend/func2url.json"

const STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает ответа",
  fixed: "Зафиксирован",
  invalid: "Неуникальный",
  showing: "Показ",
  booking: "Бронь",
  negotiation: "Переговоры",
  deal: "Сделка",
  docs: "Подготовка документов",
  payment: "Оплата",
}

const STATUS_COLOR: Record<string, string> = {
  pending: "text-yellow-400",
  fixed: "text-emerald-400",
  invalid: "text-red-400",
  showing: "text-blue-400",
  booking: "text-cyan-400",
  negotiation: "text-violet-400",
  deal: "text-emerald-300",
  docs: "text-orange-400",
  payment: "text-pink-400",
}

const STATUS_BG: Record<string, string> = {
  pending: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
  fixed: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
  invalid: "bg-red-500/10 border-red-500/20 text-red-300",
  showing: "bg-blue-500/10 border-blue-500/20 text-blue-300",
  booking: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
  negotiation: "bg-violet-500/10 border-violet-500/20 text-violet-300",
  deal: "bg-emerald-600/10 border-emerald-600/20 text-emerald-200",
  docs: "bg-orange-500/10 border-orange-500/20 text-orange-300",
  payment: "bg-pink-500/10 border-pink-500/20 text-pink-300",
}

const TABS = [
  { id: "all",         label: "Все",         statuses: [] as string[] },
  { id: "fixations",   label: "Фиксации",    statuses: ["pending", "fixed"] },
  { id: "showing",     label: "Показ",       statuses: ["showing"] },
  { id: "booking",     label: "Бронь",       statuses: ["booking"] },
  { id: "negotiation", label: "Переговоры",  statuses: ["negotiation"] },
  { id: "deal",        label: "Сделки",      statuses: ["deal", "docs", "payment"] },
  { id: "invalid",     label: "Срывы",       statuses: ["invalid"] },
]

interface Fixation {
  id: string
  offer_id: string
  status: string
  status_label: string
  expires_at: string | null
  created_at: string
  offer_title: string
  city?: string
  category?: string
  client_name: string
  client_phone?: string
  client_email?: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
    + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

function formatExpires(dateStr: string | null): { label: string; expired: boolean } {
  if (!dateStr) return { label: "", expired: false }
  const d = new Date(dateStr)
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const label = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
  return { label, expired: diff <= 0 }
}

const CAT_LABEL: Record<string, string> = {
  commercial: "Коммерция",
  investment: "Инвестиции",
  resort: "Курортная",
  auction: "С торгов",
  residential: "Жилая",
  newbuild: "Новостройка",
}

export default function ProjectsFixationsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthContext()
  const [fixations, setFixations] = useState<Fixation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const tabParam = searchParams.get("tab") || "all"
  const [activeTab, setActiveTab] = useState(tabParam)

  // Sync tab from URL
  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "all")
  }, [searchParams])

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch((func2url as Record<string, string>)["agg-fixations"], {
        headers: { "X-User-Id": user.id },
      })
      const data = await res.json()
      setFixations(data.fixations || [])
    } catch {
      setFixations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id])

  const tab = TABS.find(t => t.id === activeTab) || TABS[0]
  const filtered = (tab.statuses.length === 0 ? fixations : fixations.filter(f => tab.statuses.includes(f.status)))
    .filter(f => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        f.client_name?.toLowerCase().includes(q) ||
        f.client_phone?.toLowerCase().includes(q) ||
        f.offer_title?.toLowerCase().includes(q) ||
        f.city?.toLowerCase().includes(q)
      )
    })

  function handleTabClick(id: string) {
    setActiveTab(id)
    navigate(`/projects/fixations?tab=${id}`, { replace: true })
  }

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] min-h-screen">

      {/* Поиск + фильтры (sticky) */}
      <div className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-[#1f1f1f] px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate("/projects")}
            className="shrink-0 text-gray-500 hover:text-white transition-colors"
          >
            <Icon name="ChevronLeft" className="h-5 w-5" />
          </button>

          <div className="relative flex-1">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Телефон или ФИО клиента, объект или ЖК"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-[#111] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-violet-500"
            />
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/projects")}
            className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          >
            <Icon name="Plus" className="h-4 w-4" />
            Зафиксировать
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">

        {/* Вкладки */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {TABS.map(t => {
            const count = t.statuses.length === 0
              ? fixations.length
              : fixations.filter(f => t.statuses.includes(f.status)).length
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleTabClick(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#222]"
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-[#2a2a2a] text-gray-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Счётчик */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-3">
            {filtered.length} результатов
          </p>
        )}

        {/* Таблица */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#111] border border-[#1f1f1f] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-[#0d0d0d] rounded-2xl border border-[#1f1f1f] overflow-hidden">
            {/* Заголовок таблицы — всегда виден */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#1f1f1f] bg-[#111]">
                    {["Дата создания", "Агент", "Клиент", "Объект", "Город", "Статус фиксации", "Актуален до", "Вид"].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Icon name="BookmarkX" className="h-10 w-10 text-gray-700" />
                          <p className="text-gray-500 text-sm">
                            {activeTab === "all" ? "Клиентов пока нет" : `Нет клиентов в статусе «${tab.label}»`}
                          </p>
                          <Button onClick={() => navigate("/projects")} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white mt-2">
                            Открыть каталог
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(fix => {
                    const expires = formatExpires(fix.expires_at)
                    return (
                      <tr
                        key={fix.id}
                        className="hover:bg-[#111] transition-colors cursor-pointer"
                        onClick={() => navigate(`/projects/${fix.offer_id}`)}
                      >
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(fix.created_at)}</td>
                        <td className="px-4 py-3 text-xs text-gray-300">—</td>
                        <td className="px-4 py-3 max-w-[140px]">
                          <p className="text-xs font-medium text-white truncate">{fix.client_name}</p>
                          {fix.client_phone && <p className="text-[10px] text-gray-500 truncate">{fix.client_phone}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-300 max-w-[160px] truncate">{fix.offer_title}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fix.city || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs font-medium ${STATUS_COLOR[fix.status] || "text-gray-400"}`}>
                            {STATUS_LABEL[fix.status] || fix.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {expires.label ? (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${expires.expired ? "bg-gray-500/20 text-gray-400" : "bg-red-500 text-white"}`}>
                              {expires.label}
                            </span>
                          ) : <span className="text-xs text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {CAT_LABEL[fix.category || ""] || fix.category || "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}