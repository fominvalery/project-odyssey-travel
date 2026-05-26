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
}: Props) {
  return (
    <div className="p-5 border-b border-[#1f1f1f] flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 className="font-bold text-lg text-white">Предложения базы</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Всего: {total} объектов · {totalFixations} фиксаций
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Icon name="Search" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="pl-8 bg-[#111] border-[#1f1f1f] text-white text-sm placeholder:text-gray-600 w-44"
          />
        </div>
        <Select value={catFilter || "all"} onValueChange={v => onCatFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-[#2a2a2a]">
            <SelectItem value="all">Все категории</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter || "all"} onValueChange={v => onStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-32 bg-[#111] border-[#1f1f1f] text-sm text-gray-300">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-[#2a2a2a]">
            <SelectItem value="all">Все</SelectItem>
            {STATUS_OPTS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={onRefresh} variant="ghost" size="icon" className="text-gray-500 hover:text-white">
          <Icon name="RefreshCw" className="h-4 w-4" />
        </Button>
        <Button onClick={onFeed} variant="outline" className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-sm">
          <Icon name="Rss" className="h-4 w-4 mr-1.5" />
          XML Фид
        </Button>
        <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
          <Icon name="Plus" className="h-4 w-4 mr-1.5" />
          Добавить
        </Button>
      </div>
    </div>
  )
}