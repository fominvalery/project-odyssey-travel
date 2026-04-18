import { useState } from "react"
import { ArrowUpRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RegisterModal } from "@/components/RegisterModal"

export function HeroSection() {
  const [registerOpen, setRegisterOpen] = useState(false)

  return (
    <section className="flex flex-col items-center justify-center px-4 pt-8 pb-6 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] py-2 text-sm px-2">
        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">НОВИНКА</span>
        <span className="text-gray-300">Недвижимость с торгов — эксклюзивные объекты</span>
        <ArrowUpRight className="h-4 w-4 text-gray-400" />
      </div>

      <h1 className="mb-4 max-w-3xl text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white text-balance">
        Ваша профессиональная платформа недвижимости
      </h1>

      <p className="mb-8 max-w-xl text-gray-400">
        Коммерческая, инвестиционная, с торгов и новостройки — CRM, маркетплейс и реферальная программа в одном месте.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button
          onClick={() => setRegisterOpen(true)}
          className="rounded-full bg-blue-600 px-6 hover:bg-blue-700 text-white"
        >
          Зарегистрироваться бесплатно <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" className="rounded-full border-gray-700 bg-transparent text-white hover:bg-gray-800">
          <Play className="mr-2 h-4 w-4 fill-blue-500 text-blue-500" /> Смотреть обзор
        </Button>
      </div>

      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} planId="green" />
    </section>
  )
}