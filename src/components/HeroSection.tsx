import { ArrowUpRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center px-4 pt-4 pb-6 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] py-2 text-sm px-2">
        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">НОВИНКА</span>
        <span className="text-gray-300">Недвижимость с торгов — эксклюзивные объекты</span>
        <ArrowUpRight className="h-4 w-4 text-gray-400" />
      </div>

      <h1 className="mb-4 max-w-3xl text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white text-balance">
        Ваша профессиональная платформа недвижимости
      </h1>

      <p className="mb-8 max-w-xl text-gray-400">
        Коммерческая, инвестиционная, с торгов, новостройки и редевелопмент — CRM, маркетплейс и реферальная программа в одном месте.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button className="rounded-full bg-violet-600 px-6 hover:bg-violet-700 text-white">
          Зарегистрироваться бесплатно <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" className="rounded-full border-gray-700 bg-transparent text-white hover:bg-gray-800">
          <Play className="mr-2 h-4 w-4 fill-violet-500 text-violet-500" /> Смотреть обзор
        </Button>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-6">
        {[
          { label: "Коммерческая недвижимость", color: "text-violet-400" },
          { label: "Инвестиционная недвижимость", color: "text-violet-400" },
          { label: "Недвижимость с Торгов", color: "text-violet-400" },
          { label: "Новостройки и Редевелопмент", color: "text-violet-400" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-gray-400">
            <span className={`h-1.5 w-1.5 rounded-full bg-violet-500`} />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  )
}