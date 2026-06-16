import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import func2url from "../../../backend/func2url.json"
import { cacheGet, cacheSet, TTL } from "@/lib/cache"

const RATING_URL = (func2url as Record<string, string>)["agent-rating"]
const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

const SPECIALIZATIONS = [
  "Коммерческая недвижимость",
  "Жилая недвижимость",
  "Загородная недвижимость",
  "Инвестиции в недвижимость",
  "Складская недвижимость",
  "Офисная недвижимость",
  "Торговая недвижимость",
  "Земельные участки",
  "Отельный бизнес",
  "Другое",
]

const EXPERIENCE_OPTIONS = [
  "до 1 года",
  "1–3 года",
  "3–5 лет",
  "5–10 лет",
  "более 10 лет",
]

const AGENT_STATUS_COLORS: Record<string, string> = {
  "Лидер":      "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Амбасадор":  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "Бизнес":     "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "Партнёр":    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Друг":       "bg-gray-500/15 text-gray-300 border-gray-500/30",
  "Базовый":    "bg-gray-500/15 text-gray-400 border-gray-500/20",
}

const ACTIVITY_DOT: Record<string, string> = {
  "Активен":      "bg-emerald-400",
  "Был недавно":  "bg-amber-400",
  "Неактивен":    "bg-gray-500",
}

interface Member {
  id: string
  name: string
  company?: string
  city: string
  status: string
  avatar_url: string | null
  specializations: string[]
  bio: string
  experience?: string
  agent_status: string
  activity: string
  points: number
  rank: number
  deal_count: number
  active_listings: number
}

interface Props {
  userId: string
  onMessage?: (partnerId: string, partnerName: string, partnerAvatar: string | null, partnerStatus: string) => void
  onAddToCRM?: (member: Member) => void
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function DashboardClub({ userId, onMessage, onAddToCRM }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [specFilter, setSpecFilter] = useState("")
  const [expFilter, setExpFilter] = useState("")
  const [cityFilter, setCityFilter] = useState("")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadMembers()
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specFilter, expFilter, cityFilter])

  async function loadMembers() {
    setLoading(true)
    try {
      const cacheKey = `agent_rating_network:${userId}`
      const cached = cacheGet<Member[]>(cacheKey)
      if (cached) {
        setMembers(cached)
        setLoading(false)
        return
      }
      // Грузим из agent-rating (уже отсортировано по рейтингу)
      const res = await fetch(`${RATING_URL}?user_id=${encodeURIComponent(userId)}&limit=200`)
      const data = await res.json()
      const list: Member[] = Array.isArray(data.agents) ? data.agents : []
      cacheSet(cacheKey, list, TTL.MIN_5)
      setMembers(list)
    } catch {
      // Фолбек на club-members если agent-rating недоступен
      try {
        const res = await fetch(`${AUTH_URL}?action=club-members&user_id=${userId}`)
        const data = await res.json()
        setMembers(Array.isArray(data.members) ? data.members : [])
      } catch {
        setMembers([])
      }
    } finally {
      setLoading(false)
    }
  }

  const filtered = members.filter(m => {
    if (expFilter && m.experience !== expFilter) return false
    if (cityFilter && !m.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false
    if (specFilter && !m.specializations?.includes(specFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        (m.city || "").toLowerCase().includes(q) ||
        (m.specializations || []).some(s => s.toLowerCase().includes(q))
      )
    }
    return true
  })

  function clearFilters() {
    setSpecFilter("")
    setExpFilter("")
    setCityFilter("")
    setSearch("")
  }

  const hasFilters = search || specFilter || expFilter || cityFilter

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Icon name="Zap" className="h-4 w-4 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold">Сеть</h1>
      </div>
      <p className="text-sm text-gray-500 mb-7">Участники сети — брокеры и агентства для партнёрства и совместных сделок</p>

      {/* Поиск и фильтры */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, городу..."
            className="pl-9 bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-violet-500"
          />
        </div>
        <select
          value={specFilter}
          onChange={e => setSpecFilter(e.target.value)}
          className="rounded-xl bg-[#0f0f0f] border border-[#262626] text-sm px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 min-w-[180px]"
        >
          <option value="">Все специализации</option>
          {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={expFilter}
          onChange={e => setExpFilter(e.target.value)}
          className="rounded-xl bg-[#0f0f0f] border border-[#262626] text-sm px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 min-w-[140px]"
        >
          <option value="">Любой опыт</option>
          {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-xl hover:bg-[#1a1a1a] transition-colors whitespace-nowrap"
          >
            <Icon name="X" className="h-3.5 w-3.5" />
            Сбросить
          </button>
        )}
      </div>

      {/* Счётчик */}
      {!loading && (
        <p className="text-xs text-gray-600 mb-4">
          {filtered.length === 0 ? "Никого не найдено" : `${filtered.length} участник${filtered.length === 1 ? "" : filtered.length < 5 ? "а" : "ов"} · отсортировано по рейтингу`}
        </p>
      )}

      {/* Список карточек */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-[#1f1f1f]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#1f1f1f] rounded w-3/4" />
                  <div className="h-2 bg-[#1f1f1f] rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-[#1f1f1f] rounded" />
                <div className="h-2 bg-[#1f1f1f] rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <Icon name="Users" className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Пока никого нет</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-violet-400 text-xs hover:underline">
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <MemberCard key={m.id} member={m} onMessage={onMessage} onAddToCRM={onAddToCRM} />
          ))}
        </div>
      )}
    </div>
  )
}

export type { Member }

function MemberCard({ member: m, onMessage, onAddToCRM }: { member: Member; onMessage?: Props["onMessage"]; onAddToCRM?: Props["onAddToCRM"] }) {
  const initials = getInitials(m.name)
  const isAgency = m.status === "agency"
  const [addedToCRM, setAddedToCRM] = useState(false)

  const agentStatusColor = AGENT_STATUS_COLORS[m.agent_status] || AGENT_STATUS_COLORS["Базовый"]
  const activityDot = ACTIVITY_DOT[m.activity] || "bg-gray-500"

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] hover:border-violet-500/30 transition-colors p-5 flex flex-col gap-4">
      {/* Шапка */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12">
            {m.avatar_url ? <AvatarImage src={m.avatar_url} /> : null}
            <AvatarFallback className={`text-white text-sm font-bold ${isAgency ? "bg-gradient-to-br from-violet-600 to-pink-600" : "bg-gradient-to-br from-blue-600 to-cyan-600"}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Точка активности */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111111] ${activityDot}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-sm text-white truncate">{m.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Бейдж статуса рейтинга */}
            {m.agent_status && m.agent_status !== "Базовый" && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${agentStatusColor}`}>
                {m.agent_status}
              </span>
            )}
            {/* Очки */}
            {m.points > 0 && (
              <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                ★ {m.points}
              </span>
            )}
          </div>
          {m.city && (
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <Icon name="MapPin" size={10} />
              {m.city}
            </p>
          )}
        </div>
        {/* Позиция */}
        {m.rank && (
          <span className="text-xs text-gray-600 font-mono shrink-0">#{m.rank}</span>
        )}
      </div>

      {/* Специализации */}
      {m.specializations?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {m.specializations.slice(0, 2).map(s => (
            <span key={s} className="text-[10px] bg-[#1a1a1a] text-gray-400 px-2 py-0.5 rounded-full border border-[#2a2a2a]">
              {s}
            </span>
          ))}
          {m.specializations.length > 2 && (
            <span className="text-[10px] text-gray-600">+{m.specializations.length - 2}</span>
          )}
        </div>
      )}

      {/* Bio */}
      {m.bio && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{m.bio}</p>
      )}

      {/* Кнопки */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onMessage?.(m.id, m.name, m.avatar_url, m.status)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 transition-colors border border-violet-500/20"
        >
          <Icon name="MessageSquare" size={13} />
          Написать
        </button>
        <button
          onClick={() => {
            if (!addedToCRM) {
              onAddToCRM?.(m)
              setAddedToCRM(true)
              setTimeout(() => setAddedToCRM(false), 2000)
            }
          }}
          className={`flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl transition-colors border ${
            addedToCRM
              ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/20"
              : "bg-[#1a1a1a] text-gray-400 hover:text-white border-[#2a2a2a] hover:bg-[#222]"
          }`}
        >
          <Icon name={addedToCRM ? "Check" : "UserPlus"} size={13} />
        </button>
      </div>
    </div>
  )
}