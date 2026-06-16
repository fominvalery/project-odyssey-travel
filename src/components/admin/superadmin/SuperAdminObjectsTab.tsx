import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { superadminApi, AdminObject, AdminObjectsStats } from "@/lib/superadminApi"
import { toast } from "@/hooks/use-toast"
import Icon from "@/components/ui/icon"

interface Props {
  actorId: string
}

const STATUS_OPTIONS = ["Активен", "Архив", "На проверке"]

const COMPLETENESS_OPTIONS = [
  { value: "", label: "Все" },
  { value: "abandoned", label: "Брошенные" },
  { value: "incomplete", label: "Незаполненные" },
]

const STATUS_COLORS: Record<string, string> = {
  "Активен":     "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Архив":       "bg-gray-500/15 text-gray-400 border-gray-500/30",
  "На проверке": "bg-amber-500/15 text-amber-300 border-amber-500/30",
}

const COMPLETENESS_COLOR = (pct: number) => {
  if (pct === 100) return "text-emerald-400"
  if (pct >= 60)  return "text-amber-400"
  return "text-red-400"
}

export default function SuperAdminObjectsTab({ actorId }: Props) {
  const navigate = useNavigate()
  const [objects, setObjects] = useState<AdminObject[]>([])
  const [stats, setStats] = useState<AdminObjectsStats | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [completenessFilter, setCompletenessFilter] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async (opts?: {
    search?: string
    status?: string
    completeness?: string
  }) => {
    setLoading(true)
    try {
      const res = await superadminApi.listObjects(actorId, {
        search: opts?.search ?? search,
        status: opts?.status ?? statusFilter,
        completeness: opts?.completeness ?? completenessFilter,
        limit: 100,
      })
      setObjects(res.objects)
      setStats(res.stats)
      setTotal(res.total)
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось загрузить", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [actorId, search, statusFilter, completenessFilter])

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load({ search, status: statusFilter, completeness: completenessFilter })
  }

  const handleStatusFilter = (s: string) => {
    setStatusFilter(s)
    load({ status: s, completeness: completenessFilter })
  }

  const handleCompletenessFilter = (c: string) => {
    setCompletenessFilter(c)
    load({ completeness: c, status: statusFilter })
  }

  const changeStatus = async (obj: AdminObject, newStatus: string) => {
    setUpdatingId(obj.id)
    try {
      await superadminApi.updateObjectStatus(actorId, obj.id, newStatus)
      setObjects(prev => prev.map(o => o.id === obj.id ? { ...o, status: newStatus, published: newStatus === "Активен" } : o))
      toast({ title: "Готово", description: `Статус изменён на «${newStatus}»` })
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Ошибка", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteObject = async (obj: AdminObject) => {
    if (!confirm(`Удалить объект «${obj.title}»?\n\nЭто действие нельзя отменить.`)) return
    setUpdatingId(obj.id)
    try {
      await superadminApi.deleteObject(actorId, obj.id)
      setObjects(prev => prev.filter(o => o.id !== obj.id))
      if (stats) setStats({ ...stats, total: stats.total - 1 })
      toast({ title: "Готово", description: "Объект удалён" })
    } catch (e) {
      toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Ошибка", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: "Всего",        value: stats.total,      color: "text-white" },
            { label: "Активных",     value: stats.active,     color: "text-emerald-400" },
            { label: "В архиве",     value: stats.archived,   color: "text-gray-400" },
            { label: "За 7 дней",    value: stats.new_7d,     color: "text-blue-400" },
            { label: "За 30 дней",   value: stats.new_30d,    color: "text-blue-300" },
            { label: "Брошенные",    value: stats.abandoned,  color: "text-red-400" },
            { label: "Незаполненные",value: stats.incomplete, color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Поиск и фильтры */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию, городу, брокеру..."
            className="flex-1 bg-[#111] border border-[#1f1f1f] rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            Найти
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {/* Фильтр по статусу */}
          <select
            value={statusFilter}
            onChange={e => handleStatusFilter(e.target.value)}
            className="bg-[#111] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm text-gray-300 outline-none"
          >
            <option value="">Все статусы</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Фильтр по заполненности */}
          <div className="flex gap-1">
            {COMPLETENESS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleCompletenessFilter(opt.value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                  completenessFilter === opt.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-[#111] text-gray-400 border-[#1f1f1f] hover:text-white"
                }`}
              >
                {opt.label}
                {opt.value === "abandoned" && stats && stats.abandoned > 0 && (
                  <span className="ml-1 text-red-400">{stats.abandoned}</span>
                )}
                {opt.value === "incomplete" && stats && stats.incomplete > 0 && (
                  <span className="ml-1 text-amber-400">{stats.incomplete}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Счётчик */}
      <div className="text-xs text-gray-500 mb-3">
        Показано {objects.length} из {total}
      </div>

      {/* Таблица */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Загрузка...</div>
      ) : objects.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">Объекты не найдены</div>
      ) : (
        <div className="space-y-2">
          {objects.map(obj => (
            <div
              key={obj.id}
              className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 flex items-center gap-4"
            >
              {/* Фото */}
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0">
                {obj.photo ? (
                  <img src={obj.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="ImageOff" size={20} className="text-gray-600" />
                  </div>
                )}
              </div>

              {/* Основная инфо */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white truncate max-w-[220px]">{obj.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[obj.status] || "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
                    {obj.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {[obj.category, obj.type, obj.city].filter(Boolean).join(" · ")}
                  {obj.price && <span className="ml-1">· {obj.price}</span>}
                  {obj.area && <span className="ml-1">· {obj.area} м²</span>}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  <button
                    onClick={() => navigate(`/dashboard?user=${obj.user_id}`)}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {obj.user_name || obj.user_email}
                  </button>
                  {obj.created_at && (
                    <span className="ml-2">{new Date(obj.created_at).toLocaleDateString("ru-RU")}</span>
                  )}
                </div>
              </div>

              {/* Заполненность */}
              <div className="shrink-0 text-center w-16">
                <div className={`text-lg font-bold ${COMPLETENESS_COLOR(obj.completeness)}`}>
                  {obj.completeness}%
                </div>
                <div className="flex gap-0.5 justify-center mt-1">
                  <span title="Фото" className={obj.has_photos ? "text-emerald-400" : "text-gray-600"}>
                    <Icon name="Image" size={10} />
                  </span>
                  <span title="Описание" className={obj.has_desc ? "text-emerald-400" : "text-gray-600"}>
                    <Icon name="FileText" size={10} />
                  </span>
                  <span title="Цена" className={obj.has_price ? "text-emerald-400" : "text-gray-600"}>
                    <Icon name="Tag" size={10} />
                  </span>
                </div>
              </div>

              {/* Действия */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => navigate(`/object/${obj.id}`)}
                  className="p-1.5 text-gray-500 hover:text-white transition-colors"
                  title="Открыть"
                >
                  <Icon name="ExternalLink" size={14} />
                </button>

                <select
                  value={obj.status}
                  onChange={e => changeStatus(obj, e.target.value)}
                  disabled={updatingId === obj.id}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-gray-300 outline-none disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button
                  onClick={() => deleteObject(obj)}
                  disabled={updatingId === obj.id}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40"
                  title="Удалить"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
