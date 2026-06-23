import { STATUS_LABELS } from "@/hooks/useAuth"
import Icon from "@/components/ui/icon"
import { type ObjectData } from "@/components/AddObjectWizard"
import {
  type Lead,
  stageColor,
  objectStatusColor,
  priceLabel,
} from "./AnalyticsTypes"

interface Props {
  user: { id?: string; name: string; status: string }
  objects: ObjectData[]
  leads: Lead[]
  dealsCount: number
  views: number
  onNavigateSection?: (target: "objects" | "crm" | "analytics") => void
}

export default function DashboardWelcome({ user, objects, leads, dealsCount, views, onNavigateSection }: Props) {
  const lastObjects = [...objects].slice(0, 3)
  const lastLeads = [...leads].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 3)

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold mb-6">Добро пожаловать, {user.name.split(" ")[0]}!</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Объектов",   value: String(objects.length),            icon: "Building2",  color: "text-blue-400",    target: "objects" as const },
          { label: "Лидов",      value: String(leads.length),              icon: "Users",      color: "text-emerald-400", target: "crm" as const },
          { label: "Просмотров", value: views.toLocaleString("ru-RU"),     icon: "Eye",        color: "text-violet-400",  target: "analytics" as const },
          { label: "Сделок",     value: String(dealsCount),                icon: "Handshake",  color: "text-amber-400",   target: "crm" as const },
        ].map(stat => (
          <button
            key={stat.label}
            type="button"
            onClick={() => onNavigateSection?.(stat.target)}
            className="text-left rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 transition group relative cursor-pointer hover:border-[#2a2a2a] hover:bg-[#141414]"
          >
            <Icon name={stat.icon as "Building2"} className={`h-5 w-5 mb-3 ${stat.color}`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            <Icon name="ArrowUpRight" className="absolute top-4 right-4 h-3.5 w-3.5 text-gray-600 group-hover:text-white transition" />
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="Building2" className="h-4 w-4 text-blue-400" /> Последние объекты
          </h2>
          {lastObjects.length === 0 ? (
            <p className="text-sm text-gray-500">Объектов пока нет</p>
          ) : (
            <div className="flex flex-col gap-3">
              {lastObjects.map(obj => (
                <div key={obj.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{obj.title || "Без названия"}</p>
                    <p className="text-xs text-gray-500 truncate">{obj.category}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{priceLabel(obj.price)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${objectStatusColor(obj.status || "")}`}>
                      {obj.status || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="Users" className="h-4 w-4 text-emerald-400" /> Последние лиды
          </h2>
          {lastLeads.length === 0 ? (
            <p className="text-sm text-gray-500">Лидов пока нет</p>
          ) : (
            <div className="flex flex-col gap-3">
              {lastLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{lead.name} {lead.last_name || ""}</p>
                    <p className="text-xs text-gray-500 truncate">{lead.object_title || "Без объекта"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${stageColor(lead.stage)}`}>
                    {lead.stage || "Новый"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#1f1f1f] mb-8" />
    </div>
  )
}