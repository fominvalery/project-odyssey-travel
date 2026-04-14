import { ArrowUpRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"

export function PaymentRolesCard() {
  return (
    <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 flex flex-col">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
        <Icon name="Building2" className="h-5 w-5 text-gray-400" />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-white">Маркетплейс объектов</h3>
      <p className="mb-4 text-sm text-gray-400">Все добавленные объекты автоматически публикуются на маркетплейсе по категориям</p>

      <a href="#" className="mb-6 inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
        Подробнее <ArrowUpRight className="ml-1 h-4 w-4" />
      </a>

      <div className="mt-auto space-y-4 rounded-xl bg-[#1a1a1a] border border-[#262626] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Icon name="Store" className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">БЦ «Горизонт», офис 210</p>
              <p className="text-xs text-gray-500">Коммерческая · 145 м² · 4 500 000 ₽</p>
            </div>
          </div>
          <span className="text-xs rounded-full bg-green-500/10 text-green-400 px-2 py-0.5">Активен</span>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1 text-xs text-gray-400">
            Категория объекта
          </label>
          <div className="flex items-center justify-between rounded-lg bg-[#0f0f0f] border border-[#262626] px-3 py-2.5">
            <span className="text-sm text-white">Коммерческая недвижимость</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
          <p className="mt-1 text-xs text-gray-500">Автоматическая публикация после добавления.</p>
        </div>

        <div className="border-t border-dashed border-[#333] pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f0f0f] border border-[#262626]">
                <Icon name="TrendingUp" className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Склад, Промзона Юг</p>
                <p className="text-xs text-gray-500">Инвестиционная · 820 м² · с торгов</p>
              </div>
            </div>
            <button className="text-sm text-violet-400 hover:text-violet-300">Изменить</button>
          </div>
        </div>

        <Button className="w-full bg-[#252525] text-gray-400 hover:bg-[#2a2a2a] hover:text-white">
          Добавить объект
        </Button>
      </div>
    </div>
  )
}
