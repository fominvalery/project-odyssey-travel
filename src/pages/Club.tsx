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
    utp: ["500+ брокеров в одной сети", "Фильтр по городу и специализации", "Совместные сделки с коллегами", "Закрытый доступ"],
  },
  {
    icon: "Diamond",
    title: "Объекты коллег",
    desc: "Видишь объекты других участников клуба. Предлагаешь своих клиентов — получаешь комиссию.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/7484ab1c-1d8a-4304-8413-1a91b83906a7.jpg",
    utp: ["900+ объектов недвижимости", "Офисы, склады, торговые площади", "Комиссия за приведённого клиента", "Эксклюзивные объекты"],
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
  { name: "Алексей Морозов", role: "Коммерческая недвижимость", city: "Москва", years: 11, status: "online", photo: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/ff45244e-7e06-43ab-974b-d6255d7e9b2d.jpg" },
  { name: "Ирина Соколова", role: "Инвестиции в недвижимость", city: "Санкт-Петербург", years: 8, status: "away", photo: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b7a80f6-8684-4f2d-8413-4c403a3a211c.jpg" },
  { name: "Дмитрий Волков", role: "Офисная недвижимость", city: "Екатеринбург", years: 14, status: "offline", photo: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/1ef395f8-edca-4b6b-aa64-ca83372cf683.jpg" },
  { name: "Наталья Орлова", role: "Торговая недвижимость", city: "Краснодар", years: 6, status: "online", photo: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/abe8b054-ca5e-41b5-8d24-c03b5178373d.jpg" },
  { name: "Сергей Крылов", role: "Складская недвижимость", city: "Новосибирск", years: 9, status: "away", photo: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/7606d452-bce9-4c0b-89a1-07452766c317.jpg" },
  { name: "Мария Белова", role: "Торговые помещения", city: "Казань", years: 5, status: "online", photo: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/0812fcd3-99a3-4219-a26e-de787c6fe428.jpg" },
  { name: "Роман Зайцев", role: "Коммерческая аренда", city: "Ростов-на-Дону", years: 12, status: "offline", photo: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/9299eea2-26a1-4d13-9605-7861658d505b.jpg" },
  { name: "Елена Громова", role: "Инвестиции и девелопмент", city: "Москва", years: 16, status: "online", photo: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/026b7c14-4919-4a5f-8346-7d83a805dab0.jpg" },
]

const STATUS_DOT: Record<string, string> = {
  online: "bg-emerald-400",
  away: "bg-yellow-400",
  offline: "bg-gray-500",
}

function FeatureCard({ f }: { f: typeof FEATURES[0] }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`relative rounded-2xl border ${f.bg} min-h-[280px] flex flex-col overflow-hidden cursor-pointer`}
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

          <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-3 max-w-xl mx-auto">
            Закрытый клуб — Открытые возможности
          </p>
          <p className="text-base md:text-lg text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto">
            Платформа для тех, кто делает сделки — а не ждёт их.
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
      <section className="px-4 py-8">
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
        <p className="text-center text-xs text-gray-600 mt-6">* Данные приведены в ознакомительных целях и будут обновляться по мере роста платформы</p>
      </section>

      {/* ── Что даёт Клуб ─────────────────────────────────────────────────── */}
      <section className="px-4 pt-8 pb-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Что даёт Клуб</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Всё что нужно брокеру — в одном месте</p>
        </div>
        <FeaturesCarousel />
      </section>

      {/* ── Как это работает ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative px-4 py-10 overflow-hidden">
        {/* Сетка-фон */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Сетка линий — яркая */}
          <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="0.8"/>
              </pattern>
              <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#glow-center)" />
          </svg>
          {/* Светящиеся узлы */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {[
              { cx: "15%", cy: "25%", r: 4, d: "2.5s" }, { cx: "35%", cy: "15%", r: 3, d: "3.1s" },
              { cx: "55%", cy: "30%", r: 5, d: "2.8s" }, { cx: "75%", cy: "20%", r: 3, d: "3.5s" },
              { cx: "90%", cy: "45%", r: 4, d: "2.2s" }, { cx: "20%", cy: "65%", r: 3, d: "3.8s" },
              { cx: "50%", cy: "75%", r: 4, d: "2.6s" }, { cx: "80%", cy: "70%", r: 3, d: "3.2s" },
              { cx: "10%", cy: "85%", r: 3, d: "2.9s" }, { cx: "65%", cy: "55%", r: 4, d: "3.4s" },
              { cx: "40%", cy: "50%", r: 5, d: "2.3s" }, { cx: "85%", cy: "30%", r: 3, d: "3.7s" },
            ].map((node, i) => (
              <g key={i}>
                <circle cx={node.cx} cy={node.cy} r={node.r * 5} fill="#6366f1" opacity="0.08">
                  <animate attributeName="opacity" values="0.04;0.15;0.04" dur={node.d} repeatCount="indefinite"/>
                </circle>
                <circle cx={node.cx} cy={node.cy} r={node.r} fill="#a5b4fc">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur={node.d} repeatCount="indefinite"/>
                </circle>
              </g>
            ))}
            {/* Соединяющие линии */}
            {[
              ["15%","25%","35%","15%"], ["35%","15%","55%","30%"], ["55%","30%","75%","20%"],
              ["75%","20%","90%","45%"], ["20%","65%","50%","75%"], ["50%","75%","80%","70%"],
              ["15%","25%","20%","65%"], ["55%","30%","65%","55%"], ["65%","55%","80%","70%"],
              ["35%","15%","40%","50%"], ["40%","50%","65%","55%"], ["85%","30%","90%","45%"],
            ].map(([x1,y1,x2,y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#818cf8" strokeWidth="1" opacity="0.35"/>
            ))}
          </svg>
          {/* Плавное затемнение по краям */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/70 via-transparent to-[#0a0a0a]/70" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center mb-8">
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
      <section className="px-4 py-10 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Сеть и живое общение</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Клуб — это не просто инструменты. Это люди</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Icon name="Zap" className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-white font-bold text-xl">Сеть брокеров</h3>
            </div>
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Icon name="MessageSquare" className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-bold text-xl">Прямые сообщения</h3>
            </div>
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
      <section className="py-10 bg-[#0d0d0d] overflow-hidden">
        <div className="max-w-5xl mx-auto text-center mb-8 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Кто уже в Клубе</h2>
          <p className="text-gray-400 text-lg">Профессионалы, которые выбрали системный подход к сделкам</p>
        </div>
        {/* Бегущая строка */}
        <div className="relative">
          <div className="flex gap-4 animate-marquee w-max">
            {[...MOCK_MEMBERS, ...MOCK_MEMBERS].map((m, i) => (
              <div key={i} className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 text-center w-52 shrink-0 hover:border-violet-500/30 transition-colors">
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <img src={m.photo} alt={m.name} className="w-14 h-14 rounded-2xl object-cover object-top" />
                  <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${STATUS_DOT[m.status]} rounded-full border-2 border-[#111]`} />
                </div>
                <p className="text-white font-semibold text-sm mb-1">{m.name}</p>
                <p className="text-violet-400 text-xs mb-1">{m.role}</p>
                <p className="text-gray-500 text-xs flex items-center justify-center gap-1 mb-1">
                  <Icon name="MapPin" className="h-3 w-3" />{m.city}
                </p>
                <p className="text-gray-600 text-xs">{m.years} лет опыта</p>
              </div>
            ))}
          </div>
          {/* Затемнение по краям */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0d0d0d] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0d0d0d] to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-4 py-12 text-center">
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