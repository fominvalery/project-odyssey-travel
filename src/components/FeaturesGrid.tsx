import { useState, useRef } from "react"
import Icon from "@/components/ui/icon"

const features = [
  {
    icon: "Building2",
    title: "Все типы недвижимости",
    description: "Коммерческая, инвестиционная, с торгов и новостройки — в одном каталоге",
    color: "text-violet-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/e6cec24f-7520-4be6-b02a-b4756d54ec30.jpg",
  },
  {
    icon: "Users",
    title: "CRM для агентов",
    description: "Управляйте клиентами, сделками и задачами без сторонних сервисов",
    color: "text-blue-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/aa5ed488-2cdb-4be3-8a18-1cfdd5117a62.jpg",
  },
  {
    icon: "Gavel",
    title: "Недвижимость с торгов",
    description: "Эксклюзивные объекты из банкротств и аукционов по сниженным ценам",
    color: "text-rose-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/cec11c52-110e-448c-af83-5293f36a26e5.jpg",
  },
  {
    icon: "Share2",
    title: "Реферальная программа",
    description: "Приглашайте коллег и зарабатывайте с каждой их сделки",
    color: "text-emerald-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/263f905b-8678-4519-ae7a-4d69acd143b3.jpg",
  },
  {
    icon: "BarChart3",
    title: "Аналитика",
    description: "Просмотры, заявки и эффективность размещений в реальном времени",
    color: "text-amber-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/bf01a684-3b20-44a1-8a01-b2f1b74caf4f.jpg",
  },
  {
    icon: "Building",
    title: "Агентский кабинет",
    description: "Команда, отделы и объекты — всё в едином интерфейсе",
    color: "text-cyan-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/935b2ef7-7117-4d56-a586-bf75e8054d32.jpg",
  },
]

const SLIDE_SIZE = 2
const totalSlides = Math.ceil(features.length / SLIDE_SIZE)

export function FeaturesGrid() {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const prev = () => setCurrent((c) => (c - 1 + totalSlides) % totalSlides)
  const next = () => setCurrent((c) => (c + 1) % totalSlides)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) { if (diff > 0) { next() } else { prev() } }
    touchStartX.current = null
  }

  const visible = features.slice(current * SLIDE_SIZE, current * SLIDE_SIZE + SLIDE_SIZE)

  return (
    <section className="max-w-6xl mx-auto px-4 pt-16 pb-6">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">Возможности</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Всё что нужно — уже внутри
        </h2>
        <p className="mt-3 text-gray-400 max-w-xl mx-auto">
          Кабинет-24 объединяет инструменты для поиска, продажи и управления коммерческой недвижимостью в одной платформе
        </p>
      </div>

      <div className="relative">
        {/* Стрелка влево */}
        <button
          onClick={prev}
          className="absolute -left-5 md:-left-12 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-white hover:bg-[#252525] transition-colors"
        >
          <Icon name="ChevronLeft" size={20} />
        </button>

        {/* Карточки */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[360px]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {visible.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl overflow-hidden border border-[#1f1f1f] bg-[#111111] hover:border-[#2a2a2a] transition-colors"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={f.image}
                  alt={f.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={f.icon} size={15} className={f.color} />
                  <h3 className="text-white font-semibold">{f.title}</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Стрелка вправо */}
        <button
          onClick={next}
          className="absolute -right-5 md:-right-12 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-white hover:bg-[#252525] transition-colors"
        >
          <Icon name="ChevronRight" size={20} />
        </button>
      </div>

      {/* Точки */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2.5 bg-blue-500"
                : "w-2.5 h-2.5 bg-[#333] hover:bg-[#555]"
            }`}
          />
        ))}
      </div>
    </section>
  )
}