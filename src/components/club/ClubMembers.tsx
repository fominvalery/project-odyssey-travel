import Icon from "@/components/ui/icon"
import { MOCK_MEMBERS, STATUS_DOT } from "./clubData"
import { STEPS } from "./clubData"

export function ClubHowItWorks() {
  return (
    <section id="how-it-works" className="relative px-4 pt-10 pb-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
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
          {[
            ["15%","25%","35%","15%"], ["35%","15%","55%","30%"], ["55%","30%","75%","20%"],
            ["75%","20%","90%","45%"], ["20%","65%","50%","75%"], ["50%","75%","80%","70%"],
            ["15%","25%","20%","65%"], ["55%","30%","65%","55%"], ["65%","55%","80%","70%"],
            ["35%","15%","40%","50%"], ["40%","50%","65%","55%"], ["85%","30%","90%","45%"],
          ].map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#818cf8" strokeWidth="1" opacity="0.35"/>
          ))}
        </svg>
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
  )
}

export function ClubNetwork() {
  return (
    <section className="px-4 pt-4 pb-10 max-w-6xl mx-auto">
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
  )
}

export function ClubMembersMarquee() {
  return (
    <section className="py-10 bg-[#0d0d0d] overflow-hidden">
      <div className="max-w-5xl mx-auto text-center mb-8 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Кто уже в Клубе</h2>
        <p className="text-gray-400 text-lg">Профессионалы, которые выбрали системный подход к сделкам</p>
      </div>
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
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0d0d0d] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0d0d0d] to-transparent pointer-events-none" />
      </div>
    </section>
  )
}