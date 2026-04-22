import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { STATUS_LABELS } from "@/hooks/useAuth"
import func2url from "../../../backend/func2url.json"

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

interface Member {
  id: string
  name: string
  company: string
  city: string
  status: string
  avatar_url: string | null
  specializations: string[]
  bio: string
  experience: string
}

interface Props {
  userId: string
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function DashboardClub({ userId }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [specFilter, setSpecFilter] = useState("")
  const [expFilter, setExpFilter] = useState("")
  const [cityFilter, setCityFilter] = useState("")

  useEffect(() => {
    loadMembers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specFilter, expFilter, cityFilter])

  async function loadMembers() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ action: "club-members", user_id: userId })
      if (cityFilter) params.set("city", cityFilter)
      if (specFilter) params.set("specialization", specFilter)
      if (expFilter) params.set("experience", expFilter)
      const res = await fetch(`${AUTH_URL}?${params}`)
      const data = await res.json()
      setMembers(Array.isArray(data.members) ? data.members : [])
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.company.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      m.specializations.some(s => s.toLowerCase().includes(q))
    )
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
        <h1 className="text-2xl font-bold">Клуб</h1>
      </div>
      <p className="text-sm text-gray-500 mb-7">Участники сети — брокеры и агентства для партнёрства и совместных сделок</p>

      {/* Поиск и фильтры */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, компании, городу..."
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
          {filtered.length === 0 ? "Никого не найдено" : `${filtered.length} участник${filtered.length === 1 ? "" : filtered.length < 5 ? "а" : "ов"}`}
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
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function MemberCard({ member: m }: { member: Member }) {
  const initials = getInitials(m.name)
  const isAgency = m.status === "agency"

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] hover:border-violet-500/30 transition-colors p-5 flex flex-col gap-4">
      {/* Шапка */}
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          {m.avatar_url ? <AvatarImage src={m.avatar_url} /> : null}
          <AvatarFallback className={`text-white text-sm font-bold ${isAgency ? "bg-gradient-to-br from-violet-600 to-pink-600" : "bg-violet-600"}`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-white truncate">{m.name || "Участник Клуба"}</p>
          {m.company && <p className="text-xs text-gray-500 truncate">{m.company}</p>}
          <span className={`mt-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border ${
            isAgency
              ? "bg-pink-500/10 text-pink-400 border-pink-500/20"
              : "bg-violet-500/10 text-violet-400 border-violet-500/20"
          }`}>
            <Icon name={isAgency ? "Building2" : "Zap"} className="h-2.5 w-2.5" />
            {STATUS_LABELS[m.status as "broker" | "agency"] ?? m.status}
          </span>
        </div>
      </div>

      {/* Мета */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        {m.city && (
          <span className="flex items-center gap-1">
            <Icon name="MapPin" className="h-3 w-3" />{m.city}
          </span>
        )}
        {m.experience && (
          <span className="flex items-center gap-1">
            <Icon name="Clock" className="h-3 w-3" />{m.experience}
          </span>
        )}
      </div>

      {/* Специализации */}
      {m.specializations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {m.specializations.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] px-2 py-0.5 rounded-lg">
              {s}
            </span>
          ))}
          {m.specializations.length > 3 && (
            <span className="text-[10px] text-gray-600 px-1">+{m.specializations.length - 3}</span>
          )}
        </div>
      )}

      {/* О себе */}
      {m.bio && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{m.bio}</p>
      )}
    </div>
  )
}