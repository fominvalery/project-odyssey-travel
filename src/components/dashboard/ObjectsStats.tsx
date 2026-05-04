import Icon from "@/components/ui/icon"
import { type ObjectData } from "@/components/AddObjectWizard"

interface Props {
  activeObjects: ObjectData[]
  archivedObjects: ObjectData[]
  viewsByObject?: Record<string, number>
  leadsCount?: number
  onNavigate?: (target: "analytics" | "crm") => void
  onResetFilters?: () => void
  onShowArchive?: () => void
}

export default function ObjectsStats({
  activeObjects,
  archivedObjects,
  viewsByObject = {},
  leadsCount = 0,
  onNavigate,
  onResetFilters,
  onShowArchive,
}: Props) {
  const inWorkCount = activeObjects.filter(o => o.status === "Активен").length
  const viewsTotal = activeObjects.reduce((sum, o) => sum + (Number(viewsByObject[String(o.id)]) || 0), 0)

  const stats = [
    {
      key: "in-work",
      icon: "Briefcase",
      label: "Объектов в работе",
      sub: "Активные лоты",
      value: inWorkCount,
      color: "text-blue-400",
      onClick: onResetFilters,
    },
    {
      key: "views",
      icon: "Eye",
      label: "Просмотров всего",
      sub: "По всем объектам",
      value: viewsTotal.toLocaleString("ru-RU"),
      color: "text-violet-400",
      onClick: onNavigate ? () => onNavigate("analytics") : undefined,
    },
    {
      key: "leads",
      icon: "Users",
      label: "Лидов по объектам",
      sub: "Заявки от клиентов",
      value: leadsCount,
      color: "text-emerald-400",
      onClick: onNavigate ? () => onNavigate("crm") : undefined,
    },
    {
      key: "archive",
      icon: "Archive",
      label: "В архиве",
      sub: "Продано / Сдано",
      value: archivedObjects.length,
      color: "text-orange-400",
      onClick: onShowArchive,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map(s => {
        const clickable = typeof s.onClick === "function"
        return (
          <button
            key={s.key}
            type="button"
            onClick={clickable ? s.onClick : undefined}
            disabled={!clickable}
            className={`text-left rounded-2xl bg-[#111] border border-[#1f1f1f] p-4 flex items-start justify-between transition group ${
              clickable
                ? "cursor-pointer hover:border-[#2a2a2a] hover:bg-[#141414]"
                : "cursor-default"
            }`}
          >
            <div>
              <p className="text-2xl font-bold mb-1">{s.value}</p>
              <p className="text-xs font-medium text-white">{s.label}</p>
              <p className="text-xs text-gray-500">{s.sub}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Icon name={s.icon as "Briefcase"} className={`h-6 w-6 ${s.color} mt-1`} />
              {clickable && (
                <Icon
                  name="ArrowUpRight"
                  className="h-3.5 w-3.5 text-gray-600 group-hover:text-white transition"
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
