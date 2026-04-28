import Icon from "@/components/ui/icon"
import { type ObjectData } from "@/components/AddObjectWizard"

interface Props {
  activeObjects: ObjectData[]
  archivedObjects: ObjectData[]
}

export default function ObjectsStats({ activeObjects, archivedObjects }: Props) {
  const stats = [
    { icon: "Briefcase", label: "Объектов в работе", sub: "Активные лоты", value: activeObjects.filter(o => o.status === "Активен").length, color: "text-blue-400" },
    { icon: "TrendingUp", label: "Инвест-портфель", sub: "Суммарная стоимость", value: "0 ₽", color: "text-emerald-400" },
    { icon: "Gavel", label: "Активные торги", sub: "Предстоящие аукционы", value: activeObjects.filter(o => o.category === "auction").length, color: "text-amber-400" },
    { icon: "Archive", label: "В архиве", sub: "Продано / Сдано", value: archivedObjects.length, color: "text-orange-400" },
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
