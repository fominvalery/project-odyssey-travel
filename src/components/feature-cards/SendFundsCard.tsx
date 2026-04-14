import { ArrowUpRight } from "lucide-react"
import Icon from "@/components/ui/icon"
import { Switch } from "@/components/ui/switch"

const tiers = [
  { name: "Грин", desc: "3 объекта бесплатно", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { name: "Про", desc: "Для компаний", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  { name: "Про+", desc: "Для крупных компаний", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
]

export function SendFundsCard() {
  return (
    <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 flex flex-col">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
        <Icon name="Share2" className="h-5 w-5 text-gray-400" />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-white">Реферальная программа</h3>
      <p className="mb-4 text-sm text-gray-400">Резиденты зарабатывают на рекомендациях — приглашайте партнёров и получайте вознаграждение</p>

      <a href="#" className="mb-6 inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
        Подробнее <ArrowUpRight className="ml-1 h-4 w-4" />
      </a>

      <div className="mt-auto space-y-4 rounded-xl bg-[#1a1a1a] border border-[#262626] p-4">
        <p className="text-xs text-gray-400">Форматы участия</p>
        <div className="space-y-2">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${tier.color}`}
            >
              <div className="flex items-center gap-2">
                <Icon name="CheckCircle" className="h-4 w-4" />
                <span className="text-sm font-medium">{tier.name}</span>
              </div>
              <span className="text-xs opacity-75">{tier.desc}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-[#0f0f0f] border border-[#262626] px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Settings2" className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-white">Конструктор тарифа</span>
          </div>
          <p className="text-xs text-gray-500">Настройте тариф под задачи вашей компании</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Switch className="data-[state=checked]:bg-violet-600" />
          <span className="text-sm text-gray-400">Реферальные уведомления</span>
        </div>
      </div>
    </div>
  )
}
