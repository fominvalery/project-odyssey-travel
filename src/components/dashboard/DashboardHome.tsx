import Icon from "@/components/ui/icon"
import { type ObjectData } from "@/components/AddObjectWizard"

const PLAN_LABELS: Record<string, string> = {
  green: "FREE",
  pro: "ПРО",
  proplus: "Про+",
  constructor: "Конструктор",
}

const MOCK_OBJECTS = [
  { id: 1, title: "Торговое помещение 120 м²", price: "2 400 000 ₽", status: "Активен" },
  { id: 2, title: "Офисный блок, 3 этаж", price: "5 100 000 ₽", status: "Активен" },
  { id: 3, title: "Склад класса B+", price: "Договорная", status: "На проверке" },
]

const MOCK_LEADS = [
  { id: 1, name: "Алексей Петров", phone: "+7 900 123-45-67", object: "Торговое помещение", source: "AI-чат", status: "Новый", date: "10 апр" },
  { id: 2, name: "Ирина Смирнова", phone: "+7 911 987-65-43", object: "Офисный блок", source: "Лендинг", status: "Активный", date: "12 апр" },
  { id: 3, name: "Дмитрий Козлов", phone: "+7 925 555-00-11", object: "Торговое помещение", source: "Маркетплейс", status: "Закрыт", date: "14 апр" },
]

interface Props {
  user: { name: string; plan: string }
  objects: ObjectData[]
}

export default function DashboardHome({ user, objects }: Props) {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Добро пожаловать, {user.name.split(" ")[0]}!</h1>
      <p className="text-gray-400 text-sm mb-8">Тариф: <span className="text-blue-400 font-medium">{PLAN_LABELS[user.plan] ?? user.plan}</span></p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Объектов", value: String(objects.length), icon: "Building2", color: "text-blue-400" },
          { label: "Лидов", value: "3", icon: "Users", color: "text-emerald-400" },
          { label: "Просмотров", value: "124", icon: "Eye", color: "text-violet-400" },
          { label: "Сделок", value: "0", icon: "Handshake", color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
            <Icon name={stat.icon as "Building2"} className={`h-5 w-5 mb-3 ${stat.color}`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="Building2" className="h-4 w-4 text-blue-400" /> Последние объекты
          </h2>
          <div className="flex flex-col gap-3">
            {MOCK_OBJECTS.map((obj) => (
              <div key={obj.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium truncate max-w-[180px]">{obj.title}</p>
                  <p className="text-xs text-gray-500">{obj.price}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${obj.status === "Активен" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {obj.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="Users" className="h-4 w-4 text-emerald-400" /> Последние лиды
          </h2>
          <div className="flex flex-col gap-3">
            {MOCK_LEADS.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.object}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  lead.status === "Новый" ? "bg-blue-500/10 text-blue-400" :
                  lead.status === "Активный" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-gray-500/10 text-gray-400"
                }`}>{lead.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
