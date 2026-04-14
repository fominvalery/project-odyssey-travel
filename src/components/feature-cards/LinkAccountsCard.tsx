import { ArrowUpRight, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"

const clients = [
  { name: "Алексей Петров", info: "Коммерческая · 3 объекта", code: "CRM-101", image: "/professional-man-portrait.png" },
  { name: "Мария Иванова", info: "Инвестиционная · 1 объект", code: "CRM-102", image: "/professional-woman-portrait.png" },
  { name: "Елена Смирнова", info: "Торги · на согласовании", code: "CRM-103", initials: "ЕС", color: "bg-teal-600" },
  { name: "Дмитрий Козлов", info: "Новостройка · сделка закрыта", code: "CRM-104", initials: "ДК", color: "bg-amber-600" },
]

export function LinkAccountsCard() {
  return (
    <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 flex flex-col">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
        <Icon name="Users" className="h-5 w-5 text-gray-400" />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-white">CRM — Ведение клиентов</h3>
      <p className="mb-4 text-sm text-gray-400">Добавляйте клиентов, отслеживайте статус сделки по каждому объекту в одном окне</p>

      <a href="#" className="mb-6 inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
        Подробнее <ArrowUpRight className="ml-1 h-4 w-4" />
      </a>

      <div className="mt-auto space-y-2 rounded-xl bg-[#1a1a1a] border border-[#262626] p-3">
        {clients.map((client, index) => (
          <div key={index} className="flex items-center justify-between rounded-lg bg-[#0f0f0f] px-3 py-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {client.image ? (
                  <AvatarImage src={client.image} alt={client.name} />
                ) : null}
                <AvatarFallback className={`${client.color || "bg-gray-600"} text-white text-xs`}>
                  {client.initials ||
                    client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">{client.name}</p>
                <p className="text-xs text-gray-500">{client.info}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">{client.code}</span>
          </div>
        ))}

        <Button
          variant="ghost"
          className="w-full justify-center text-gray-500 hover:text-white hover:bg-[#1f1f1f] mt-2"
        >
          <Plus className="mr-2 h-4 w-4" /> Добавить клиента
        </Button>
      </div>
    </div>
  )
}
