import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import Icon from "@/components/ui/icon"
import { RegisterModal } from "@/components/RegisterModal"

export function CtaSection() {
  const [registerOpen, setRegisterOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <section className="relative px-4 md:px-8 py-12 text-center overflow-hidden">
      {/* Сетка-фон */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-eco-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="0.8"/>
            </pattern>
            <radialGradient id="cta-eco-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-eco-grid)" />
          <rect width="100%" height="100%" fill="url(#cta-eco-glow)" />
        </svg>
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {[
            { cx: "10%", cy: "20%", r: 3, d: "2.5s" }, { cx: "30%", cy: "10%", r: 4, d: "3.1s" },
            { cx: "55%", cy: "25%", r: 3, d: "2.8s" }, { cx: "75%", cy: "15%", r: 4, d: "3.5s" },
            { cx: "90%", cy: "50%", r: 3, d: "2.2s" }, { cx: "20%", cy: "70%", r: 4, d: "3.8s" },
            { cx: "50%", cy: "80%", r: 3, d: "2.6s" }, { cx: "80%", cy: "75%", r: 3, d: "3.2s" },
            { cx: "40%", cy: "50%", r: 4, d: "2.3s" }, { cx: "65%", cy: "60%", r: 3, d: "3.4s" },
          ].map((node, i) => (
            <g key={i}>
              <circle cx={node.cx} cy={node.cy} r={node.r * 5} fill="#6366f1" opacity="0.06">
                <animate attributeName="opacity" values="0.03;0.12;0.03" dur={node.d} repeatCount="indefinite"/>
              </circle>
              <circle cx={node.cx} cy={node.cy} r={node.r} fill="#a5b4fc">
                <animate attributeName="opacity" values="0.4;1;0.4" dur={node.d} repeatCount="indefinite"/>
              </circle>
            </g>
          ))}
          {[
            ["10%","20%","30%","10%"], ["30%","10%","55%","25%"], ["55%","25%","75%","15%"],
            ["75%","15%","90%","50%"], ["20%","70%","40%","50%"], ["40%","50%","65%","60%"],
            ["65%","60%","80%","75%"], ["50%","80%","65%","60%"], ["10%","20%","20%","70%"],
          ].map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#818cf8" strokeWidth="1" opacity="0.3"/>
          ))}
        </svg>
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
      </div>

      <div className="relative">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Готовы начать?</h2>
      <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">
        Создайте бесплатный кабинет за 30 секунд и получите доступ ко всем AI-инструментам платформы.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <GlowButton
          onClick={() => setRegisterOpen(true)}
          className="rounded-full px-8 py-3 text-base"
        >
          Создать кабинет <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
        </GlowButton>
        <Button
          onClick={() => navigate("/marketplace")}
          variant="outline"
          className="rounded-full border-[#333] bg-[#1a1a1a] text-white hover:bg-[#222] px-8 py-3 text-base font-medium"
        >
          Смотреть объекты
        </Button>
      </div>

      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} planId="green" />
      </div>
    </section>
  )
}