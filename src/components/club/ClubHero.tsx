import Icon from "@/components/ui/icon"
import { GlowButton } from "@/components/ui/glow-button"

interface ClubHeroProps {
  onCtaClick: () => void
}

export function ClubHero({ onCtaClick }: ClubHeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-16 text-center">
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/1ea4abe3-37e5-4db8-9984-0a8f76563081.jpg"
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/50 via-[#0a0a0a]/20 to-[#0a0a0a]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-violet-300 bg-violet-500/15 border border-violet-500/30 rounded-full px-5 py-2 mb-5">
          <Icon name="Zap" className="h-4 w-4" />
          Закрытый клуб профессионалов
        </span>

        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-5">
          Кабинет-<span className="text-blue-400">24</span>
        </h1>

        <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-3 max-w-xl mx-auto">
          Закрытый клуб — Открытые возможности
        </p>
        <p className="text-base md:text-lg text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto">
          Платформа для тех, кто делает сделки — а не ждёт их.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <GlowButton
            onClick={onCtaClick}
            className="px-8 py-3.5 rounded-xl text-base"
          >
            Вступить в Клуб
          </GlowButton>
          <GlowButton
            onClick={() => {
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="px-8 py-3.5 rounded-xl text-base !bg-[#111] hover:!bg-[#1a1a1a] [&::after]:!bg-[#111]"
          >
            Как это работает
          </GlowButton>
        </div>
      </div>
    </section>
  )
}