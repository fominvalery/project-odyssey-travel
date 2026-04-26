import { useRef, useState } from "react"
import Icon from "@/components/ui/icon"
import { CATEGORIES, CATEGORY_GROUPS } from "../wizardTypes"
import type { WizardForm } from "../wizardTypes"

interface Step1Props {
  category: string
  setCategory: (v: string) => void
  subtype: string
  setSubtype: (v: string) => void
  form: WizardForm
  setForm: (f: WizardForm) => void
  dealType: string
  setDealType: (v: string) => void
}

const DEAL_TYPE_CATEGORIES = ["commercial", "residential"]

const RESIDENTIAL_GROUPS = [
  {
    id: "urban",
    label: "Городская",
    desc: "Квартира, студия, апартаменты, комната",
    icon: "Building",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d5483eb7-291b-489e-a47f-d29a366ea71d.jpg",
  },
  {
    id: "suburban",
    label: "Загородная",
    desc: "Дом, коттедж, дача, таунхаус",
    icon: "TreePine",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
  {
    id: "premium",
    label: "Премиум",
    desc: "Вилла, пентхаус, особняк, элитная",
    icon: "Crown",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
]

const RESORT_GROUPS = [
  {
    id: "accommodation",
    label: "Размещение",
    desc: "Отель, апарт-отель, гостиница, глэмпинг",
    icon: "Hotel",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
  {
    id: "wellness",
    label: "SPA и оздоровление",
    desc: "Санаторий, SPA, Wellness, медкурорт",
    icon: "Sparkles",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d5483eb7-291b-489e-a47f-d29a366ea71d.jpg",
  },
  {
    id: "nature",
    label: "Загородный отдых",
    desc: "База отдыха, эко-отель, кемпинг",
    icon: "Trees",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2e040e9f-00a8-40b1-801c-bd3442c7aafa.jpg",
  },
  {
    id: "invest",
    label: "Инвестиции",
    desc: "ГАБ, земля, проект под строительство",
    icon: "TrendingUp",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
]

const AUCTION_GROUPS = [
  {
    id: "bankruptcy",
    label: "Банкротство",
    desc: "Физлица, юрлица, конкурсная масса",
    icon: "Scale",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/17b020ab-c66f-445a-8a81-9f2954d40507.jpg",
  },
  {
    id: "state",
    label: "Гос. и муниц.",
    desc: "РФФИ, Росимущество, муниципальные",
    icon: "Landmark",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  },
  {
    id: "pledge",
    label: "Залоговое",
    desc: "Залоги банков, арест, обременения",
    icon: "ShieldAlert",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
  {
    id: "special",
    label: "Спец. форматы",
    desc: "44-ФЗ, приватизация, исп. производство",
    icon: "FileText",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
]

const INVESTMENT_GROUPS = [
  {
    id: "gab",
    label: "ГАБ / Арендный бизнес",
    desc: "Готовый поток, договор, арендатор",
    icon: "Banknote",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
  {
    id: "redevelopment",
    label: "Редевелопмент",
    desc: "Проект, реконструкция, девелопмент",
    icon: "HardHat",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  },
  {
    id: "land",
    label: "Земельные участки",
    desc: "Под застройку, коммерцию, ИЖС",
    icon: "Map",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
  {
    id: "special",
    label: "Спец. форматы",
    desc: "Портфель, доля, Sale & Leaseback",
    icon: "Layers",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/17b020ab-c66f-445a-8a81-9f2954d40507.jpg",
  },
]

const COMMERCIAL_GROUPS = [
  {
    id: "office",
    label: "Офисная",
    desc: "Офис, БЦ, коворкинг",
    icon: "BriefcaseBusiness",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  },
  {
    id: "retail",
    label: "Торговая",
    desc: "Ритейл, магазин, ТЦ, шоурум",
    icon: "ShoppingBag",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
  {
    id: "warehouse",
    label: "Склад / Произв.",
    desc: "Склад, логистика, промзона",
    icon: "Warehouse",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/17b020ab-c66f-445a-8a81-9f2954d40507.jpg",
  },
  {
    id: "service",
    label: "Сервис",
    desc: "Ресторан, салон, медцентр",
    icon: "UtensilsCrossed",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
  {
    id: "mixed",
    label: "Смешанные",
    desc: "ПСН, ОЗС, свободное назначение",
    icon: "LayoutGrid",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2e040e9f-00a8-40b1-801c-bd3442c7aafa.jpg",
  },
]

const NEWBUILD_GROUPS = [
  {
    id: "commercial",
    label: "Коммерческая",
    desc: "Офис, ритейл в БЦ, стрит-ритейл в ЖК",
    icon: "Building2",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  },
  {
    id: "residential",
    label: "Жилая",
    desc: "Квартира, апартаменты, таунхаус",
    icon: "Home",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d5483eb7-291b-489e-a47f-d29a366ea71d.jpg",
  },
]

const CAT_BG: Record<string, string> = {
  "commercial":  "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  "investment":  "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  "resort":      "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  "auction":     "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/17b020ab-c66f-445a-8a81-9f2954d40507.jpg",
  "residential": "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d5483eb7-291b-489e-a47f-d29a366ea71d.jpg",
  "newbuild":    "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2e040e9f-00a8-40b1-801c-bd3442c7aafa.jpg",
}

const RESORT_SUBTYPE_ICONS: Record<string, string> = {
  "Апарт-отель": "Hotel",
  "Апарт-комплекс": "Building2",
  "Гостиница": "Hotel",
  "Отель": "Hotel",
  "Мини-отель": "Home",
  "Хостел": "Users",
  "Гостевой дом": "House",
  "Санаторий": "HeartPulse",
  "Пансионат": "Waves",
  "SPA-отель": "Sparkles",
  "Wellness-отель": "Leaf",
  "База отдыха": "Trees",
  "Турбаза": "Tent",
  "Эко-отель": "Leaf",
  "Курортный комплекс": "Sun",
  "Виллы и коттеджи под аренду": "Home",
  "Объект под управление": "BriefcaseBusiness",
  "Земельный участок под курортный проект": "Map",
  "Инвестиционный проект под строительство": "Construction",
  "Готовый арендный бизнес в курортной локации": "TrendingUp",
}

export function Step1Category({ category, setCategory, subtype, setSubtype, dealType, setDealType }: Step1Props) {
  const [newbuildGroup, setNewbuildGroup] = useState<"commercial" | "residential" | "">("")
  const [residentialGroup, setResidentialGroup] = useState<"urban" | "suburban" | "premium" | "">("")
  const [commercialGroup, setCommercialGroup] = useState<"office" | "retail" | "warehouse" | "service" | "mixed" | "">("")
  const [investmentGroup, setInvestmentGroup] = useState<"gab" | "redevelopment" | "land" | "special" | "">("")
  const [auctionGroup, setAuctionGroup] = useState<"bankruptcy" | "state" | "pledge" | "special" | "">("")
  const [resortGroup, setResortGroup] = useState<"accommodation" | "wellness" | "nature" | "invest" | "">("")
  const selectedCat = CATEGORIES.find(c => c.id === category)
  const isResort = category === "resort"
  const isNewbuild = category === "newbuild"
  const isResidential = category === "residential"
  const isCommercial = category === "commercial"
  const isInvestment = category === "investment"
  const isAuction = category === "auction"
  const showDealType = DEAL_TYPE_CATEGORIES.includes(category)
  const subtypeRef = useRef<HTMLDivElement>(null)
  const dealTypeRef = useRef<HTMLDivElement>(null)
  const newbuildGroupRef = useRef<HTMLDivElement>(null)
  const residentialGroupRef = useRef<HTMLDivElement>(null)
  const commercialGroupRef = useRef<HTMLDivElement>(null)
  const investmentGroupRef = useRef<HTMLDivElement>(null)
  const auctionGroupRef = useRef<HTMLDivElement>(null)
  const resortGroupRef = useRef<HTMLDivElement>(null)

  function handleCategorySelect(id: string) {
    setCategory(id)
    setSubtype("")
    if (id === "newbuild") {
      setNewbuildGroup("")
      setTimeout(() => {
        newbuildGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    } else if (id === "residential") {
      setResidentialGroup("")
      setDealType("")
      setTimeout(() => {
        residentialGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    } else if (id === "commercial") {
      setCommercialGroup("")
      setDealType("")
      setTimeout(() => {
        commercialGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    } else if (id === "investment") {
      setInvestmentGroup("")
      setTimeout(() => {
        investmentGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    } else if (id === "auction") {
      setAuctionGroup("")
      setTimeout(() => {
        auctionGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    } else if (id === "resort") {
      setResortGroup("")
      setTimeout(() => {
        resortGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    } else if (DEAL_TYPE_CATEGORIES.includes(id)) {
      setDealType("")
      setTimeout(() => {
        dealTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    } else {
      setTimeout(() => {
        subtypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    }
  }

  function handleResortGroupSelect(groupId: "accommodation" | "wellness" | "nature" | "invest") {
    setResortGroup(groupId)
    setSubtype("")
    setTimeout(() => {
      subtypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function handleAuctionGroupSelect(groupId: "bankruptcy" | "state" | "pledge" | "special") {
    setAuctionGroup(groupId)
    setSubtype("")
    setTimeout(() => {
      subtypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function handleInvestmentGroupSelect(groupId: "gab" | "redevelopment" | "land" | "special") {
    setInvestmentGroup(groupId)
    setSubtype("")
    setTimeout(() => {
      subtypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function handleCommercialGroupSelect(groupId: "office" | "retail" | "warehouse" | "service" | "mixed") {
    setCommercialGroup(groupId)
    setSubtype("")
    setDealType("")
    setTimeout(() => {
      dealTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function handleResidentialGroupSelect(groupId: "urban" | "suburban" | "premium") {
    setResidentialGroup(groupId)
    setSubtype("")
    setDealType("")
    setTimeout(() => {
      dealTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function handleNewbuildGroupSelect(groupId: "commercial" | "residential") {
    setNewbuildGroup(groupId)
    setSubtype("")
    setTimeout(() => {
      subtypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  function handleDealTypeSelect(v: string) {
    setDealType(v)
    setTimeout(() => {
      subtypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }

  return (
    <div className="space-y-6">
      {CATEGORY_GROUPS.map(group => {
        const groupCats = CATEGORIES.filter(c => group.ids.includes(c.id))
        return (
          <div key={group.label}>
            <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">{group.label}</p>
            <div className="grid grid-cols-2 gap-3">
              {groupCats.map((cat) => {
                const bg = CAT_BG[cat.id]
                const isActive = category === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`relative rounded-2xl border overflow-hidden text-center transition-all duration-300 group ${
                      isActive
                        ? "border-blue-500 shadow-lg shadow-blue-500/20"
                        : "border-[#2a2a2a] hover:border-white/30"
                    }`}
                    style={{ minHeight: 160 }}
                  >
                    {bg && (
                      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 transition-all duration-300" style={{ background: isActive ? "rgba(23,37,84,0.68)" : "rgba(0,0,0,0.58)" }} />
                    <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full">
                      <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center backdrop-blur-sm transition-all ${
                        isActive ? "bg-blue-500/40 border border-blue-400/50" : "bg-white/10 border border-white/15 group-hover:bg-white/15"
                      }`}>
                        <Icon name={cat.icon as "Home"} fallback="Building2" className={`h-6 w-6 ${isActive ? "text-blue-200" : "text-white/80"}`} />
                      </div>
                      <p className="font-bold text-white text-base mb-1 drop-shadow">{cat.label}</p>
                      <p className={`text-xs leading-snug drop-shadow ${isActive ? "text-blue-200/80" : "text-white/50"}`}>{cat.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Выбор группы для Жилой — Городская / Загородная / Премиум */}
      {isResidential && (
        <div ref={residentialGroupRef} className="space-y-3">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest">Тип жилой недвижимости</p>
          <div className="grid grid-cols-3 gap-3">
            {RESIDENTIAL_GROUPS.map(g => {
              const isActive = residentialGroup === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => handleResidentialGroupSelect(g.id as "urban" | "suburban" | "premium")}
                  className={`relative rounded-2xl border overflow-hidden text-center transition-all duration-300 group ${
                    isActive ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-[#2a2a2a] hover:border-white/30"
                  }`}
                  style={{ minHeight: 130 }}
                >
                  <img src={g.bg} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 transition-all duration-300" style={{ background: isActive ? "rgba(23,37,84,0.72)" : "rgba(0,0,0,0.60)" }} />
                  <div className="relative z-10 p-4 flex flex-col items-center justify-center h-full">
                    <div className={`w-9 h-9 rounded-xl mb-2 flex items-center justify-center backdrop-blur-sm transition-all ${
                      isActive ? "bg-blue-500/40 border border-blue-400/50" : "bg-white/10 border border-white/15 group-hover:bg-white/15"
                    }`}>
                      <Icon name={g.icon as "Home"} fallback="Home" className={`h-4 w-4 ${isActive ? "text-blue-200" : "text-white/80"}`} />
                    </div>
                    <p className="font-bold text-white text-xs mb-0.5 drop-shadow">{g.label}</p>
                    <p className={`text-[10px] leading-snug drop-shadow ${isActive ? "text-blue-200/80" : "text-white/50"}`}>{g.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Выбор группы для Коммерции — 5 карточек */}
      {isCommercial && (
        <div ref={commercialGroupRef} className="space-y-3">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest">Тип коммерческой недвижимости</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COMMERCIAL_GROUPS.map(g => {
              const isActive = commercialGroup === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => handleCommercialGroupSelect(g.id as "office" | "retail" | "warehouse" | "service" | "mixed")}
                  className={`relative rounded-2xl border overflow-hidden text-center transition-all duration-300 group ${
                    isActive ? "border-violet-500 shadow-lg shadow-violet-500/20" : "border-[#2a2a2a] hover:border-white/30"
                  }`}
                  style={{ minHeight: 120 }}
                >
                  <img src={g.bg} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 transition-all duration-300" style={{ background: isActive ? "rgba(76,29,149,0.68)" : "rgba(0,0,0,0.60)" }} />
                  <div className="relative z-10 p-4 flex flex-col items-center justify-center h-full">
                    <div className={`w-9 h-9 rounded-xl mb-2 flex items-center justify-center backdrop-blur-sm transition-all ${
                      isActive ? "bg-violet-500/40 border border-violet-400/50" : "bg-white/10 border border-white/15 group-hover:bg-white/15"
                    }`}>
                      <Icon name={g.icon as "Home"} fallback="Building2" className={`h-4 w-4 ${isActive ? "text-violet-200" : "text-white/80"}`} />
                    </div>
                    <p className="font-bold text-white text-xs mb-0.5 drop-shadow">{g.label}</p>
                    <p className={`text-[10px] leading-snug drop-shadow ${isActive ? "text-violet-200/80" : "text-white/50"}`}>{g.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Выбор группы для Инвестиций — 4 карточки */}
      {isInvestment && (
        <div ref={investmentGroupRef} className="space-y-3">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest">Тип инвестиционного объекта</p>
          <div className="grid grid-cols-2 gap-3">
            {INVESTMENT_GROUPS.map(g => {
              const isActive = investmentGroup === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => handleInvestmentGroupSelect(g.id as "gab" | "redevelopment" | "land" | "special")}
                  className={`relative rounded-2xl border overflow-hidden text-center transition-all duration-300 group ${
                    isActive ? "border-amber-500 shadow-lg shadow-amber-500/20" : "border-[#2a2a2a] hover:border-white/30"
                  }`}
                  style={{ minHeight: 120 }}
                >
                  <img src={g.bg} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 transition-all duration-300" style={{ background: isActive ? "rgba(120,53,15,0.68)" : "rgba(0,0,0,0.60)" }} />
                  <div className="relative z-10 p-4 flex flex-col items-center justify-center h-full">
                    <div className={`w-9 h-9 rounded-xl mb-2 flex items-center justify-center backdrop-blur-sm transition-all ${
                      isActive ? "bg-amber-500/40 border border-amber-400/50" : "bg-white/10 border border-white/15 group-hover:bg-white/15"
                    }`}>
                      <Icon name={g.icon as "Home"} fallback="TrendingUp" className={`h-4 w-4 ${isActive ? "text-amber-200" : "text-white/80"}`} />
                    </div>
                    <p className="font-bold text-white text-xs mb-0.5 drop-shadow">{g.label}</p>
                    <p className={`text-[10px] leading-snug drop-shadow ${isActive ? "text-amber-200/80" : "text-white/50"}`}>{g.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Подтипы для Инвестиций — после выбора группы */}
      {isInvestment && investmentGroup && selectedCat?.subgroups && (
        <div ref={subtypeRef} className="space-y-3">
          {selectedCat.subgroups
            .filter(sg => {
              if (investmentGroup === "gab") return sg.label === "Готовый арендный бизнес"
              if (investmentGroup === "redevelopment") return sg.label === "Редевелопмент и девелопмент"
              if (investmentGroup === "land") return sg.label === "Земельные участки"
              if (investmentGroup === "special") return sg.label === "Специальные форматы"
              return false
            })
            .map(sg => (
              <div key={sg.label}>
                <p className="text-[11px] text-amber-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-3 h-px bg-amber-500/40 inline-block"></span>
                  {sg.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sg.items.map(st => (
                    <button
                      key={st}
                      onClick={() => setSubtype(st)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        subtype === st
                          ? "border-amber-500 bg-amber-500/15 text-amber-300"
                          : "border-[#1f1f1f] bg-[#111] text-gray-400 hover:border-[#3a3a3a] hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {!subtype && (
            <p className="text-[11px] text-gray-600">Выберите тип — поля формы подстроятся автоматически</p>
          )}
        </div>
      )}

      {/* Выбор группы для Торгов — 4 карточки */}
      {isAuction && (
        <div ref={auctionGroupRef} className="space-y-3">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest">Тип торгов</p>
          <div className="grid grid-cols-2 gap-3">
            {AUCTION_GROUPS.map(g => {
              const isActive = auctionGroup === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => handleAuctionGroupSelect(g.id as "bankruptcy" | "state" | "pledge" | "special")}
                  className={`relative rounded-2xl border overflow-hidden text-center transition-all duration-300 group ${
                    isActive ? "border-green-500 shadow-lg shadow-green-500/20" : "border-[#2a2a2a] hover:border-white/30"
                  }`}
                  style={{ minHeight: 120 }}
                >
                  <img src={g.bg} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 transition-all duration-300" style={{ background: isActive ? "rgba(5,46,22,0.72)" : "rgba(0,0,0,0.60)" }} />
                  <div className="relative z-10 p-4 flex flex-col items-center justify-center h-full">
                    <div className={`w-9 h-9 rounded-xl mb-2 flex items-center justify-center backdrop-blur-sm transition-all ${
                      isActive ? "bg-green-500/40 border border-green-400/50" : "bg-white/10 border border-white/15 group-hover:bg-white/15"
                    }`}>
                      <Icon name={g.icon as "Home"} fallback="Gavel" className={`h-4 w-4 ${isActive ? "text-green-200" : "text-white/80"}`} />
                    </div>
                    <p className="font-bold text-white text-xs mb-0.5 drop-shadow">{g.label}</p>
                    <p className={`text-[10px] leading-snug drop-shadow ${isActive ? "text-green-200/80" : "text-white/50"}`}>{g.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Подтипы для Торгов — после выбора группы */}
      {isAuction && auctionGroup && selectedCat?.subgroups && (
        <div ref={subtypeRef} className="space-y-3">
          {selectedCat.subgroups
            .filter(sg => {
              if (auctionGroup === "bankruptcy") return sg.label === "Банкротство"
              if (auctionGroup === "state") return sg.label === "Государственные и муниципальные"
              if (auctionGroup === "pledge") return sg.label === "Залоговое имущество"
              if (auctionGroup === "special") return sg.label === "Специальные форматы"
              return false
            })
            .map(sg => (
              <div key={sg.label}>
                <p className="text-[11px] text-green-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-3 h-px bg-green-500/40 inline-block"></span>
                  {sg.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sg.items.map(st => (
                    <button
                      key={st}
                      onClick={() => setSubtype(st)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        subtype === st
                          ? "border-green-500 bg-green-500/15 text-green-300"
                          : "border-[#1f1f1f] bg-[#111] text-gray-400 hover:border-[#3a3a3a] hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {!subtype && (
            <p className="text-[11px] text-gray-600">Выберите тип — поля формы подстроятся автоматически</p>
          )}
        </div>
      )}

      {/* Выбор типа сделки (жилая и коммерция — только после выбора группы) */}
      {showDealType && (!isResidential || residentialGroup) && (!isCommercial || commercialGroup) && (
        <div ref={dealTypeRef} className="rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d] p-5">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-4">Что планируете?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDealTypeSelect("sale")}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all ${
                dealType === "sale"
                  ? "border-blue-500 bg-blue-500/10 text-white"
                  : "border-[#2a2a2a] bg-[#111] text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                dealType === "sale" ? "bg-blue-500/20" : "bg-[#1a1a1a]"
              }`}>
                <Icon name="Tag" className={`h-6 w-6 ${dealType === "sale" ? "text-blue-400" : "text-gray-500"}`} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">Продать</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Единоразовая сделка</p>
              </div>
            </button>
            <button
              onClick={() => handleDealTypeSelect("rent")}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all ${
                dealType === "rent"
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                  : "border-[#2a2a2a] bg-[#111] text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                dealType === "rent" ? "bg-emerald-500/20" : "bg-[#1a1a1a]"
              }`}>
                <Icon name="KeyRound" className={`h-6 w-6 ${dealType === "rent" ? "text-emerald-400" : "text-gray-500"}`} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">Сдать в аренду</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Ежемесячный доход</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Выбор группы для Новостроек — Коммерческая / Жилая */}
      {isNewbuild && (
        <div ref={newbuildGroupRef} className="space-y-3">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest">Тип новостройки</p>
          <div className="grid grid-cols-2 gap-3">
            {NEWBUILD_GROUPS.map(g => {
              const isActive = newbuildGroup === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => handleNewbuildGroupSelect(g.id as "commercial" | "residential")}
                  className={`relative rounded-2xl border overflow-hidden text-center transition-all duration-300 group ${
                    isActive ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-[#2a2a2a] hover:border-white/30"
                  }`}
                  style={{ minHeight: 140 }}
                >
                  <img src={g.bg} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 transition-all duration-300" style={{ background: isActive ? "rgba(23,37,84,0.68)" : "rgba(0,0,0,0.58)" }} />
                  <div className="relative z-10 p-5 flex flex-col items-center justify-center h-full">
                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center backdrop-blur-sm transition-all ${
                      isActive ? "bg-blue-500/40 border border-blue-400/50" : "bg-white/10 border border-white/15 group-hover:bg-white/15"
                    }`}>
                      <Icon name={g.icon as "Home"} fallback="Building2" className={`h-5 w-5 ${isActive ? "text-blue-200" : "text-white/80"}`} />
                    </div>
                    <p className="font-bold text-white text-sm mb-1 drop-shadow">{g.label}</p>
                    <p className={`text-[11px] leading-snug drop-shadow ${isActive ? "text-blue-200/80" : "text-white/50"}`}>{g.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Выбор группы для Курортной — 4 карточки */}
      {isResort && (
        <div ref={resortGroupRef} className="space-y-3">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest">Тип курортного объекта</p>
          <div className="grid grid-cols-2 gap-3">
            {RESORT_GROUPS.map(g => {
              const isActive = resortGroup === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => handleResortGroupSelect(g.id as "accommodation" | "wellness" | "nature" | "invest")}
                  className={`relative rounded-2xl border overflow-hidden text-center transition-all duration-300 group ${
                    isActive ? "border-cyan-500 shadow-lg shadow-cyan-500/20" : "border-[#2a2a2a] hover:border-white/30"
                  }`}
                  style={{ minHeight: 120 }}
                >
                  <img src={g.bg} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 transition-all duration-300" style={{ background: isActive ? "rgba(8,51,68,0.72)" : "rgba(0,0,0,0.60)" }} />
                  <div className="relative z-10 p-4 flex flex-col items-center justify-center h-full">
                    <div className={`w-9 h-9 rounded-xl mb-2 flex items-center justify-center backdrop-blur-sm transition-all ${
                      isActive ? "bg-cyan-500/40 border border-cyan-400/50" : "bg-white/10 border border-white/15 group-hover:bg-white/15"
                    }`}>
                      <Icon name={g.icon as "Home"} fallback="Palmtree" className={`h-4 w-4 ${isActive ? "text-cyan-200" : "text-white/80"}`} />
                    </div>
                    <p className="font-bold text-white text-xs mb-0.5 drop-shadow">{g.label}</p>
                    <p className={`text-[10px] leading-snug drop-shadow ${isActive ? "text-cyan-200/80" : "text-white/50"}`}>{g.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Подтипы для Курортной — после выбора группы */}
      {isResort && resortGroup && selectedCat?.subgroups && (
        <div ref={subtypeRef} className="space-y-3">
          {selectedCat.subgroups
            .filter(sg => {
              if (resortGroup === "accommodation") return sg.label === "Размещение"
              if (resortGroup === "wellness") return sg.label === "Оздоровление и SPA"
              if (resortGroup === "nature") return sg.label === "Загородный и eco-отдых"
              if (resortGroup === "invest") return sg.label === "Инвестиции и проекты"
              return false
            })
            .map(sg => (
              <div key={sg.label}>
                <p className="text-[11px] text-cyan-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-3 h-px bg-cyan-500/40 inline-block"></span>
                  {sg.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sg.items.map(st => (
                    <button
                      key={st}
                      onClick={() => setSubtype(st)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        subtype === st
                          ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                          : "border-[#1f1f1f] bg-[#111] text-gray-400 hover:border-cyan-500/40 hover:text-white"
                      }`}
                    >
                      <Icon name={(RESORT_SUBTYPE_ICONS[st] ?? "Building2") as "Building2"} fallback="Building2" className="h-3 w-3 shrink-0" />
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {!subtype && (
            <p className="text-[11px] text-gray-600">Выберите тип — характеристики подберутся автоматически</p>
          )}
        </div>
      )}

      {/* Выбор подтипа для Новостроек — с группировкой после выбора группы */}
      {isNewbuild && newbuildGroup && selectedCat?.subgroups && (
        <div ref={subtypeRef} className="space-y-3">
          {selectedCat.subgroups
            .filter(sg =>
              newbuildGroup === "commercial" ? sg.label === "Коммерческие" : sg.label === "Жилые"
            )
            .map(sg => (
              <div key={sg.label}>
                <p className="text-[11px] text-blue-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-3 h-px bg-blue-500/40 inline-block"></span>
                  {sg.label} новостройки
                </p>
                <div className="flex flex-wrap gap-2">
                  {sg.items.map(st => (
                    <button
                      key={st}
                      onClick={() => setSubtype(st)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        subtype === st
                          ? "border-blue-500 bg-blue-500/15 text-blue-300"
                          : "border-[#1f1f1f] bg-[#111] text-gray-400 hover:border-[#3a3a3a] hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {!subtype && (
            <p className="text-[11px] text-gray-600">Выберите тип — характеристики подберутся автоматически</p>
          )}
        </div>
      )}

      {/* Выбор подтипа для Коммерции — после выбора группы и dealType */}
      {isCommercial && commercialGroup && dealType && selectedCat?.subgroups && (
        <div ref={subtypeRef} className="space-y-3">
          {selectedCat.subgroups
            .filter(sg => {
              if (commercialGroup === "office") return sg.label === "Офисная недвижимость"
              if (commercialGroup === "retail") return sg.label === "Торговая недвижимость"
              if (commercialGroup === "warehouse") return sg.label === "Складская и производственная"
              if (commercialGroup === "service") return sg.label === "Сервис и общепит"
              if (commercialGroup === "mixed") return sg.label === "Смешанные и универсальные"
              return false
            })
            .map(sg => (
              <div key={sg.label}>
                <p className="text-[11px] text-violet-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-3 h-px bg-violet-500/40 inline-block"></span>
                  {sg.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sg.items.map(st => (
                    <button
                      key={st}
                      onClick={() => setSubtype(st)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        subtype === st
                          ? "border-violet-500 bg-violet-500/15 text-violet-300"
                          : "border-[#1f1f1f] bg-[#111] text-gray-400 hover:border-[#3a3a3a] hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {!subtype && (
            <p className="text-[11px] text-gray-600">Выберите тип — поля формы подстроятся автоматически</p>
          )}
        </div>
      )}

      {/* Выбор подтипа для Жилой — после выбора группы и dealType */}
      {isResidential && residentialGroup && dealType && selectedCat?.subgroups && (
        <div ref={subtypeRef} className="space-y-3">
          {selectedCat.subgroups
            .filter(sg => {
              if (residentialGroup === "urban") return sg.label === "Городская"
              if (residentialGroup === "suburban") return sg.label === "Загородная"
              if (residentialGroup === "premium") return sg.label === "Премиум"
              return false
            })
            .map(sg => (
              <div key={sg.label}>
                <p className="text-[11px] text-sky-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-3 h-px bg-sky-500/40 inline-block"></span>
                  {sg.label} недвижимость
                </p>
                <div className="flex flex-wrap gap-2">
                  {sg.items.map(st => (
                    <button
                      key={st}
                      onClick={() => setSubtype(st)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        subtype === st
                          ? "border-sky-500 bg-sky-500/15 text-sky-300"
                          : "border-[#1f1f1f] bg-[#111] text-gray-400 hover:border-[#3a3a3a] hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          {!subtype && (
            <p className="text-[11px] text-gray-600">Выберите тип — поля формы подстроятся автоматически</p>
          )}
        </div>
      )}

      {/* Выбор подтипа для НЕ курортных, НЕ новостроек, НЕ жилой, НЕ коммерции, НЕ инвестиций, НЕ торгов */}
      {!isResort && !isNewbuild && !isResidential && !isCommercial && !isInvestment && !isAuction && selectedCat?.subtypes && selectedCat.subtypes.length > 0 && (!showDealType || dealType) && (
        <div ref={subtypeRef}>
          <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">
            Тип объекта — {selectedCat.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCat.subtypes.map(st => (
              <button
                key={st}
                onClick={() => setSubtype(st)}
                className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                  subtype === st
                    ? "border-violet-500 bg-violet-500/15 text-violet-300"
                    : "border-[#1f1f1f] bg-[#111] text-gray-400 hover:border-[#3a3a3a] hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          {!subtype && (
            <p className="text-[11px] text-gray-600 mt-2">Выберите тип — это поможет подобрать правильные характеристики</p>
          )}
        </div>
      )}
    </div>
  )
}