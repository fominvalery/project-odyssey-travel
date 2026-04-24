import { useState, useRef } from "react"
import Icon from "@/components/ui/icon"
import { FEATURES } from "./clubData"

function FeatureCard({ f }: { f: typeof FEATURES[0] }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`relative rounded-2xl border ${f.bg} min-h-[280px] flex flex-col overflow-hidden cursor-pointer`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(h => !h)}
    >
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-400 ${hovered ? "opacity-100" : "opacity-0"}`}
      >
        <img src={f.img} alt={f.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/40 backdrop-blur-sm shrink-0">
              <Icon name={f.icon as "Crown"} className={`h-5 w-5 ${f.color}`} />
            </div>
            <h3 className="text-white font-semibold text-base leading-tight">{f.title}</h3>
          </div>
          <p className="text-gray-200 text-sm leading-relaxed">{f.desc}</p>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/20 shrink-0">
            <Icon name={f.icon as "Crown"} className={`h-5 w-5 ${f.color}`} />
          </div>
          <h3 className="text-white font-semibold text-base leading-tight">{f.title}</h3>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">{f.desc}</p>
        <ul className="space-y-2 mt-auto">
          {f.utp.map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
              <Icon name="CircleCheck" className={`h-4 w-4 mt-0.5 shrink-0 ${f.color}`} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function FeaturesCarousel() {
  const [current, setCurrent] = useState(0)
  const totalSlides = Math.ceil(FEATURES.length / 2)
  const touchStartX = useRef<number | null>(null)

  const prev = () => setCurrent(c => (c - 1 + totalSlides) % totalSlides)
  const next = () => setCurrent(c => (c + 1) % totalSlides)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 40) next()
    else if (diff < -40) prev()
    touchStartX.current = null
  }

  const startIdx = current * 2
  const visible = [
    FEATURES[startIdx % FEATURES.length],
    FEATURES[(startIdx + 1) % FEATURES.length],
  ]

  return (
    <div className="w-full">
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {visible.map(f => <FeatureCard key={f.title} f={f} />)}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prev}
          className="w-9 h-9 rounded-full border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-white hover:border-violet-500/50 transition-all"
        >
          <Icon name="ChevronLeft" className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-6 h-2 bg-violet-500"
                  : "w-2 h-2 bg-[#333] hover:bg-[#555]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-9 h-9 rounded-full border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-white hover:border-violet-500/50 transition-all"
        >
          <Icon name="ChevronRight" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ClubFeatures() {
  return (
    <section className="px-4 pt-8 pb-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Что даёт Клуб</h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">Всё что нужно брокеру — в одном месте</p>
      </div>
      <FeaturesCarousel />
    </section>
  )
}
