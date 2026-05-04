import Icon from "@/components/ui/icon"
import { type ObjectData } from "@/components/AddObjectWizard"

interface Props {
  activeObjects: ObjectData[]
  archivedObjects: ObjectData[]
  viewsByObject?: Record<string, number>
  leadsCount?: number
}

export default function ObjectsStats({ activeObjects, archivedObjects, viewsByObject = {}, leadsCount = 0 }: Props) {
  const inWorkCount = activeObjects.filter(o => o.status === "Активен").length
  const viewsTotal = activeObjects.reduce((sum, o) => sum + (Number(viewsByObject[String(o.id)]) || 0), 0)

  const stats = [
    {
      icon: "Briefcase",
      label: "Объектов в работе",
      sub: "Активные лоты",
      value: inWorkCount,
      color: "text-blue-400",
    },
    {
      icon: "Eye",
      label: "Просмотров всего",
      sub: "По всем объектам",
      value: viewsTotal.toLocaleString("ru-RU"),
      color: "text-violet-400",
    },
    {
      icon: "Users",
      label: "Лидов по объектам",
      sub: "Заявки от клиентов",
      value: leadsCount,
      color: "text-emerald-400",
    },
    {
      icon: "Archive",
      label: "В архиве",
      sub: "Продано / Сдано",
      value: archivedObjects.length,
      color: "text-orange-400",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-4 flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold mb-1">{s.value}</p>
            <p className="text-xs font-medium text-white">{s.label}</p>
            <p className="text-xs text-gray-500">{s.sub}</p>
          </div>
          <Icon name={s.icon as "Briefcase"} className={`h-6 w-6 ${s.color} mt-1`} />
        </div>
      ))}
    </div>
  )
}
