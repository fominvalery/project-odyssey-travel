import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { RegisterModal } from "@/components/RegisterModal"

export function CtaSection() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <section className="px-4 md:px-8 py-24 text-center">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Готовы начать?</h2>
      <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">
        Создайте бесплатный кабинет за 30 секунд и получите доступ ко всем AI-инструментам платформы.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          onClick={() => setRegisterOpen(true)}
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium"
        >
          Создать кабинет <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
        </Button>
        <Button
          onClick={() => navigate("/marketplace")}
          variant="outline"
          className="rounded-full border-[#333] bg-[#1a1a1a] text-white hover:bg-[#222] px-8 py-3 text-base font-medium"
        >
          Смотреть объекты
        </Button>
      </div>

      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} planId="green" />
    </section>
  )
}
