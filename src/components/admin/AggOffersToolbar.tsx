import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import { CATEGORIES, STATUS_OPTS } from "./AggOffersTypes"

interface Props {
  total: number
  totalFixations: number
  search: string
  catFilter: string
  statusFilter: string
  loading: boolean
  onSearch: (v: string) => void
  onCatFilter: (v: string) => void
  onStatusFilter: (v: string) => void
  onRefresh: () => void
  onAdd: () => void
  onFeed: () => void
  onAddDeveloper: () => void
  onAddProject: () => void
}

export default function AggOffersToolbar({
  total,
  totalFixations,
  search,
  catFilter,
  statusFilter,
  loading,
  onSearch,
  onCatFilter,
  onStatusFilter,
  onRefresh,
  onAdd,
  onFeed,
  onAddDeveloper,
  onAddProject,
}: Props) {
  return (
    <div className="p-5 border-b border-[#1f1f1f] space-y-3">
      {/* Строка 1: заголовок + кнопки действий */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-lg text-white">Предложения базы</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Всего: {total} объектов · {totalFixations} фиксаций
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={onRefresh} variant="ghost" size="icon" className="text-gray-500 hover:text-white" disabled={loading}>
            <Icon name="RefreshCw" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={onFeed} variant="outline" className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-sm">
            <Icon name="Rss" className="h-4 w-4 mr-1.5" />
            XML Фид
          </Button>
          <Button onClick={onAddDeveloper} variant="outline" className="border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 text-sm">
            <Icon name="Plus" className="h-4 w-4 mr-1.5" />
            Застройщик
          </Button>
          <Button onClick={onAddProject} variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 text-sm">
            <Icon name="Plus" className="h-4 w-4 mr-1.5" />
            Проект
          </Button>
          <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
            <Icon name="Plus" className="h-4 w-4 mr-1.5" />
            Добавить объект
          </Button>
        </div>
      </div>

      {/* Строка 2: поиск и фильтры */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-sm placeholder:text-gray-600 w-52"
          />
        </div>
        <Select value={catFilter || "all"} onValueChange={v => onCatFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-[#2a2a2a]">
            <SelectItem value="all">Все категории</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter || "all"} onValueChange={v => onStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-[#2a2a2a]">
            <SelectItem value="all">Все</SelectItem>
            {STATUS_OPTS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
