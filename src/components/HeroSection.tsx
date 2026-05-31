import { useState } from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import { RegisterModal } from "@/components/RegisterModal"
import Icon from "@/components/ui/icon"
import { useToast } from "@/hooks/use-toast"

export function HeroSection() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const { toast } = useToast()

  return (
    <section className="relative overflow-hidden flex flex-col items-center justify-center px-4 pt-8 pb-6 text-center">
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/1ea4abe3-37e5-4db8-9984-0a8f76563081.jpg"
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/50 via-[#0a0a0a]/20 to-[#0a0a0a]" />
      </div>
      <div className="relative flex flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] py-2 text-sm px-2">
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">НОВИНКА</span>
          <span className="text-gray-300">Недвижимость с торгов — эксклюзивные объекты</span>
        </div>

        <h1 className="mb-4 max-w-3xl text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white text-balance">
          Платформа для Брокеров и Агентов по недвижимости
        </h1>

        <p className="mb-8 max-w-xl text-gray-400">
          CRM, маркетплейс объектов и закрытый клуб брокеров — офисы, склады, торговые площади по всей России в одном месте.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <GlowButton
            onClick={() => setRegisterOpen(true)}
            className="rounded-full px-6 py-2 text-sm"
          >
            Зарегистрироваться бесплатно <Icon name="ArrowUpRight" className="ml-2 h-4 w-4" />
          </GlowButton>
          <Button
            variant="outline"
            className="rounded-full border-gray-700 bg-transparent text-white hover:bg-gray-800"
            onClick={() => toast({ title: "Скоро", description: "Обзор платформы уже готовится 🎬" })}
          >
            <Play className="mr-2 h-4 w-4 fill-blue-500 text-blue-500" /> Смотреть обзор
          </Button>
        </div>

        <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} planId="green" />
      </div>
    </section>
  )
}