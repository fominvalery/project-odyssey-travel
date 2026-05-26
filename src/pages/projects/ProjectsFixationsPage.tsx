import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../../backend/func2url.json"

const STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает ответа",
  fixed: "Зафиксирован",
  invalid: "Неактуален",
  showing: "Показ",
  booking: "Бронь",
  negotiation: "Переговоры",
  deal: "Сделка",
  docs: "Подготовка документов",
  payment: "Оплата",
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  fixed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  invalid: "bg-red-500/20 text-red-300 border-red-500/30",
  showing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  booking: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  negotiation: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  deal: "bg-emerald-600/20 text-emerald-200 border-emerald-600/30",
  docs: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  payment: "bg-pink-500/20 text-pink-300 border-pink-500/30",
}

// Группы вкладок — каждая объединяет несколько статусов CRM
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

function daysLeft(dateStr: string | null): string {
  if (!dateStr) return ""
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return "Истекла"
  if (diff === 1) return "1 день"
  if (diff < 5) return `${diff} дня`
  return `${diff} дней`
}

// Преобразуем route в id вкладки
function routeToTab(pathname: string): string {
  if (pathname.includes("/bookings")) return "booking"
  if (pathname.includes("/deals")) return "deal"
  return "all"
}

export default function ProjectsFixationsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthContext()
  const [fixations, setFixations] = useState<Fixation[]>([])
  const [loading, setLoading] = useState(true)

  // Определяем активную вкладку из URL
  const pathname = window.location.pathname
  const filterParam = searchParams.get("filter")
  const defaultTab = filterParam === "failed" ? "invalid" : routeToTab(pathname)
  const [activeTab, setActiveTab] = useState(defaultTab)

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
  const filtered = tab.statuses.length === 0
    ? fixations
    : fixations.filter(f => tab.statuses.includes(f.status))

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Шапка */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate("/projects")}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <Icon name="ChevronLeft" className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Мои клиенты</h1>
            <p className="text-xs text-gray-500">
              {loading ? "Загрузка..." : `${fixations.length} клиентов в CRM`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/projects")}
            className="ml-auto bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Icon name="Plus" className="h-4 w-4 mr-1.5" />
            Зафиксировать
          </Button>
        </div>

        {/* Вкладки статусов */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {TABS.map(t => {
            const count = t.statuses.length === 0
              ? fixations.length
              : fixations.filter(f => t.statuses.includes(f.status)).length
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
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

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Icon name="BookmarkX" className="h-12 w-12 text-gray-700 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {activeTab === "all" ? "Клиентов пока нет" : `Нет клиентов в статусе «${tab.label}»`}
            </p>
            <p className="text-gray-700 text-sm mt-1 mb-6">
              {activeTab === "all"
                ? "Перейдите в каталог и зафиксируйте клиента на объект"
                : "Переместите клиентов в эту стадию через CRM Фиксации"
              }
            </p>
            <Button onClick={() => navigate("/projects")} className="bg-violet-600 hover:bg-violet-700 text-white">
              Открыть каталог
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(fix => (
              <FixationRow key={fix.id} fix={fix} onOpenOffer={() => navigate(`/projects/${fix.offer_id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FixationRow({ fix, onOpenOffer }: { fix: Fixation; onOpenOffer: () => void }) {
  const colorClass = STATUS_COLOR[fix.status] || "bg-gray-500/20 text-gray-300 border-gray-500/30"
  const days = fix.expires_at ? daysLeft(fix.expires_at) : null
  const isExpired = days === "Истекла"

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-4 hover:border-[#2a2a2a] transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <button
              onClick={onOpenOffer}
              className="text-sm font-semibold text-white hover:text-violet-400 transition-colors text-left line-clamp-1"
            >
              {fix.offer_title}
            </button>
            {fix.city && (
              <span className="text-xs text-gray-500">{fix.city}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Icon name="User" className="h-3 w-3" />
              {fix.client_name}
            </span>
            {fix.client_phone && (
              <span className="flex items-center gap-1">
                <Icon name="Phone" className="h-3 w-3" />
                {fix.client_phone}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${colorClass}`}>
              {STATUS_LABEL[fix.status] || fix.status}
            </span>
            {days && (
              <span className={`text-[10px] flex items-center gap-1 ${isExpired ? "text-red-400" : "text-gray-500"}`}>
                <Icon name="Clock" className="h-3 w-3" />
                {isExpired ? "Фиксация истекла" : `Действует ${days}`}
              </span>
            )}
            <span className="text-[10px] text-gray-600">
              {new Date(fix.created_at).toLocaleDateString("ru-RU")}
            </span>
          </div>
        </div>
        <button
          onClick={onOpenOffer}
          className="shrink-0 text-gray-600 hover:text-white transition-colors"
        >
          <Icon name="ChevronRight" className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
