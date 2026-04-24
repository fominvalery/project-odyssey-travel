import { useNavigate } from "react-router-dom"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import Icon from "@/components/ui/icon"
import { GlowButton } from "@/components/ui/glow-button"
import { RegisterModal } from "@/components/RegisterModal"
import { useState, useRef } from "react"

const FEATURES = [
  {
    icon: "Crown",
    title: "Закрытая сеть брокеров",
    desc: "Находи партнёров по специализации и городу. Делай совместные сделки с теми, кому доверяешь.",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/ade09cc6-882e-46eb-bde6-38c6ee42304f.jpg",
    utp: ["500+ брокеров в одной сети", "Фильтр по городу и специализации", "Совместные сделки с доверенными коллегами", "Закрытый доступ — только проверенные"],
  },
  {
    icon: "Diamond",
    title: "Объекты коллег",
    desc: "Видишь объекты других участников клуба. Предлагаешь своих клиентов — получаешь комиссию.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/7484ab1c-1d8a-4304-8413-1a91b83906a7.jpg",
    utp: ["1 200+ объектов коммерческой недвижимости", "Офисы, склады, торговые площади", "Комиссия за приведённого клиента", "Эксклюзивные объекты только для участников"],
  },
  {
    icon: "Shield",
    title: "CRM и лиды",
    desc: "Все заявки в одном месте. Воронка продаж, канбан, история переписки с клиентом.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d6290ab6-9bca-40a5-bc61-370b075a9243.jpg",
    utp: ["Канбан-доска для ведения сделок", "История переписки с каждым клиентом", "Автоматические напоминания и задачи", "Воронка продаж в реальном времени"],
  },
  {
    icon: "Sparkles",
    title: "ИИ-ассистент",
    desc: "Генерация описаний объектов, PDF-презентации и аналитика — одним кликом, без копирайтера.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/7d2bcfa5-cfbc-4269-b5c0-884749d0110c.jpg",
    utp: ["Автогенерация описаний объектов", "PDF-презентация за 10 секунд", "ИИ-анализ рынка и конкурентов", "Персональный стиль под ваш бренд"],
  },
  {
    icon: "Star",
    title: "Размещение в маркетплейсе",
    desc: "Публикуй объекты в открытом каталоге и получай входящие запросы от покупателей и арендаторов.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/75418899-09a6-4e38-8054-fab84073cf33.jpg",
    utp: ["Публичный каталог без лишних шагов", "Входящие заявки от покупателей", "SEO-продвижение каждого объекта", "Статистика просмотров и обращений"],
  },
  {
    icon: "Trophy",
    title: "Реферальная программа",
    desc: "Приглашай коллег в клуб и получай бонусы за каждого активного участника, которого привёл.",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/8e50957c-90f8-4f34-8373-59bfc2772b06.jpg",
    utp: ["Бонус за каждого приглашённого коллегу", "Многоуровневая реферальная система", "Начисление на баланс автоматически", "Нет лимита на количество рефералов"],
  },
  {
    icon: "TrendingUp",
    title: "Аналитика по объектам",
    desc: "Статистика просмотров, количество лидов и конверсия по каждому объекту в реальном времени.",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/c67aad42-76a4-42da-9d80-76a8a2d9d4b7.jpg",
    utp: ["Просмотры и лиды по каждому объекту", "Конверсия воронки в реальном времени", "Сравнение эффективности объектов", "Экспорт отчётов в один клик"],
  },
]

const STEPS = [
  {
    num: "01",
    title: "Зарегистрируйся",
    desc: "Создай аккаунт за 2 минуты. Только email и имя.",
    icon: "UserPlus",
  },
  {
    num: "02",
    title: "Заполни профиль",
    desc: "Укажи специализацию, город и опыт. Так коллеги найдут тебя быстрее.",
    icon: "User",
  },
  {
    num: "03",
    title: "Начни работать с сетью",
    desc: "Найди партнёров, разместь объекты, получай лиды.",
    icon: "Zap",
  },
]

const MOCK_MEMBERS = [
  { name: "Алексей Морозов", role: "Коммерческая недвижимость", city: "Москва", initials: "АМ", color: "from-violet-600 to-blue-600" },
  { name: "Ирина Соколова", role: "Инвестиции в недвижимость", city: "Санкт-Петербург", initials: "ИС", color: "from-pink-600 to-rose-600" },
  { name: "Дмитрий Волков", role: "Офисная недвижимость", city: "Екатеринбург", initials: "ДВ", color: "from-emerald-600 to-teal-600" },
  { name: "Наталья Орлова", role: "Торговая недвижимость", city: "Краснодар", initials: "НО", color: "from-amber-600 to-orange-600" },
]

function FeatureCard({ f }: { f: typeof FEATURES[0] }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`relative rounded-2xl border ${f.bg} min-h-[360px] flex flex-col overflow-hidden cursor-pointer`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(h => !h)}
    >
      {/* Картинка — появляется при наведении поверх всего */}
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-400 ${hovered ? "opacity-100" : "opacity-0"}`}
      >
        <img src={f.img} alt={f.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        {/* Текст поверх картинки */}
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

      {/* Обычное состояние — текст */}
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

      {/* Навигация */}
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

export default function Club() {
  const navigate = useNavigate()
  const [registerOpen, setRegisterOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
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

          <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto">
            Где сделки рождаются из доверия.<br />
            Где брокеры — закрывают сделки.<br />
            Где твои коллеги — лучшие партнёры.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlowButton
              onClick={() => setRegisterOpen(true)}
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

      {/* ── Цифры ─────────────────────────────────────────────────────────── */}
      <section className="px-4 py-12 border-y border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "500+", label: "Участников в сети", icon: "Users" },
            { value: "1 200+", label: "Объектов в базе", icon: "Building2" },
            { value: "340", label: "Сделок закрыто", icon: "Handshake" },
            { value: "38", label: "Городов присутствия", icon: "MapPin" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <Icon name={stat.icon as "Users"} className="h-6 w-6 text-violet-400 mx-auto mb-2" />
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Что даёт Клуб ─────────────────────────────────────────────────── */}
      <section className="px-4 pt-10 pb-10 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Что даёт Клуб</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Всё что нужно брокеру — в одном месте</p>
        </div>
        <FeaturesCarousel />
      </section>

      {/* ── Как это работает ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 py-20 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Как это работает</h2>
          <p className="text-gray-400 text-lg">Три шага до первой партнёрской сделки</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative text-center">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] right-0 h-px bg-gradient-to-r from-violet-500/40 to-transparent" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-5">
                <Icon name={step.icon as "Zap"} className="h-7 w-7 text-violet-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-2 block">{step.num}</span>
              <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Сеть и общение ────────────────────────────────────────────────── */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Сеть и живое общение</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Клуб — это не просто инструменты. Это люди</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-8">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-6">
              <Icon name="Zap" className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-3">Сеть брокеров</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Каталог всех участников клуба с фильтрацией по специализации, городу и опыту. Найди брокера под конкретную задачу — будь то офисы в Москве или курортная недвижимость в Сочи. Предложи коллаборацию, раздели комиссию, закрой сделку быстрее.
            </p>
            <ul className="space-y-2">
              {["Фильтр по специализации и городу", "Публичные профили с портфолио", "Рейтинг и отзывы коллег"].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                  <Icon name="CheckCircle" className="h-4 w-4 text-violet-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-6">
              <Icon name="MessageSquare" className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-3">Прямые сообщения</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Пиши любому участнику клуба напрямую — без мессенджеров, без лишних шагов. Обсуждай объекты, уточняй условия сделки, договаривайся о показе. Всё общение в одном месте, рядом с CRM и объектами.
            </p>
            <ul className="space-y-2">
              {["Личный чат с любым участником", "История переписки сохраняется", "Уведомления о новых сообщениях"].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                  <Icon name="CheckCircle" className="h-4 w-4 text-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Участники ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 bg-[#0d0d0d] border-y border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Кто уже в Клубе</h2>
          <p className="text-gray-400 text-lg">Профессионалы, которые выбрали системный подход к сделкам</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MOCK_MEMBERS.map(m => (
            <div key={m.name} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 text-center hover:border-violet-500/30 transition-colors">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center mx-auto mb-4`}>
                <span className="text-white font-bold text-lg">{m.initials}</span>
              </div>
              <p className="text-white font-semibold text-sm mb-1">{m.name}</p>
              <p className="text-violet-400 text-xs mb-1">{m.role}</p>
              <p className="text-gray-500 text-xs flex items-center justify-center gap-1">
                <Icon name="MapPin" className="h-3 w-3" />{m.city}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-4 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-8">
            <Icon name="Zap" className="h-8 w-8 text-violet-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
            Готов работать в профессиональной среде?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Вступи в Клуб сегодня — и уже завтра у тебя будут партнёры, объекты и инструменты для роста.
          </p>
          <button
            onClick={() => setRegisterOpen(true)}
            className="px-10 py-5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xl transition-all hover:scale-105 shadow-xl shadow-violet-500/30"
          >
            Вступить в Клуб бесплатно
          </button>
          <p className="text-gray-600 text-sm mt-4">Регистрация займёт 2 минуты</p>
        </div>
      </section>

      <Footer />

      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} planId="basic" />
    </main>
  )
}