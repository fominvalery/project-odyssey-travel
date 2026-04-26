import { useRef, useState } from "react"
import Icon from "@/components/ui/icon"
import { CATEGORIES, CATEGORY_GROUPS } from "../wizardTypes"
import type { WizardForm } from "../wizardTypes"
import CategoryGroupPicker from "./CategoryGroupPicker"
import CategorySubtypePicker from "./CategorySubtypePicker"
import {
  DEAL_TYPE_CATEGORIES,
  RESIDENTIAL_GROUPS,
  RESORT_GROUPS,
  AUCTION_GROUPS,
  INVESTMENT_GROUPS,
  COMMERCIAL_GROUPS,
  NEWBUILD_GROUPS,
  CAT_BG,
} from "./step1CategoryData"

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
      {/* Главная сетка категорий */}
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

      {/* Выбор группы для Жилой */}
      {isResidential && (
        <CategoryGroupPicker
          title="Тип жилой недвижимости"
          groups={RESIDENTIAL_GROUPS}
          activeGroup={residentialGroup}
          onSelect={id => handleResidentialGroupSelect(id as "urban" | "suburban" | "premium")}
          accentBorder="border-blue-500 shadow-lg shadow-blue-500/20"
          accentBg="rgba(23,37,84,0.72)"
          accentIcon="bg-blue-500/40 border border-blue-400/50"
          accentDesc="text-blue-200/80"
          minHeight={130}
          cols="grid-cols-3"
          containerRef={residentialGroupRef}
          fallbackIcon="Home"
        />
      )}

      {/* Выбор группы для Коммерции */}
      {isCommercial && (
        <CategoryGroupPicker
          title="Тип коммерческой недвижимости"
          groups={COMMERCIAL_GROUPS}
          activeGroup={commercialGroup}
          onSelect={id => handleCommercialGroupSelect(id as "office" | "retail" | "warehouse" | "service" | "mixed")}
          accentBorder="border-violet-500 shadow-lg shadow-violet-500/20"
          accentBg="rgba(76,29,149,0.68)"
          accentIcon="bg-violet-500/40 border border-violet-400/50"
          accentDesc="text-violet-200/80"
          minHeight={120}
          cols="grid-cols-2 sm:grid-cols-3"
          containerRef={commercialGroupRef}
          fallbackIcon="Building2"
        />
      )}

      {/* Выбор группы для Инвестиций */}
      {isInvestment && (
        <CategoryGroupPicker
          title="Тип инвестиционного объекта"
          groups={INVESTMENT_GROUPS}
          activeGroup={investmentGroup}
          onSelect={id => handleInvestmentGroupSelect(id as "gab" | "redevelopment" | "land" | "special")}
          accentBorder="border-amber-500 shadow-lg shadow-amber-500/20"
          accentBg="rgba(120,53,15,0.68)"
          accentIcon="bg-amber-500/40 border border-amber-400/50"
          accentDesc="text-amber-200/80"
          minHeight={120}
          cols="grid-cols-2"
          containerRef={investmentGroupRef}
          fallbackIcon="TrendingUp"
        />
      )}

      {/* Подтипы для Инвестиций */}
      {isInvestment && investmentGroup && selectedCat?.subgroups && (
        <CategorySubtypePicker
          subgroups={selectedCat.subgroups}
          filterLabel={
            investmentGroup === "gab" ? "Готовый арендный бизнес" :
            investmentGroup === "redevelopment" ? "Редевелопмент и девелопмент" :
            investmentGroup === "land" ? "Земельные участки" :
            "Специальные форматы"
          }
          subtype={subtype}
          onSubtypeSelect={setSubtype}
          accentColor="amber"
          containerRef={subtypeRef}
        />
      )}

      {/* Выбор группы для Торгов */}
      {isAuction && (
        <CategoryGroupPicker
          title="Тип торгов"
          groups={AUCTION_GROUPS}
          activeGroup={auctionGroup}
          onSelect={id => handleAuctionGroupSelect(id as "bankruptcy" | "state" | "pledge" | "special")}
          accentBorder="border-green-500 shadow-lg shadow-green-500/20"
          accentBg="rgba(5,46,22,0.72)"
          accentIcon="bg-green-500/40 border border-green-400/50"
          accentDesc="text-green-200/80"
          minHeight={120}
          cols="grid-cols-2"
          containerRef={auctionGroupRef}
          fallbackIcon="Gavel"
        />
      )}

      {/* Подтипы для Торгов */}
      {isAuction && auctionGroup && selectedCat?.subgroups && (
        <CategorySubtypePicker
          subgroups={selectedCat.subgroups}
          filterLabel={
            auctionGroup === "bankruptcy" ? "Банкротство" :
            auctionGroup === "state" ? "Государственные и муниципальные" :
            auctionGroup === "pledge" ? "Залоговое имущество" :
            "Специальные форматы"
          }
          subtype={subtype}
          onSubtypeSelect={setSubtype}
          accentColor="green"
          containerRef={subtypeRef}
        />
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

      {/* Выбор группы для Новостроек */}
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

      {/* Выбор группы для Курортной */}
      {isResort && (
        <CategoryGroupPicker
          title="Тип курортного объекта"
          groups={RESORT_GROUPS}
          activeGroup={resortGroup}
          onSelect={id => handleResortGroupSelect(id as "accommodation" | "wellness" | "nature" | "invest")}
          accentBorder="border-cyan-500 shadow-lg shadow-cyan-500/20"
          accentBg="rgba(8,51,68,0.72)"
          accentIcon="bg-cyan-500/40 border border-cyan-400/50"
          accentDesc="text-cyan-200/80"
          minHeight={120}
          cols="grid-cols-2"
          containerRef={resortGroupRef}
          fallbackIcon="Palmtree"
        />
      )}

      {/* Подтипы для Курортной */}
      {isResort && resortGroup && selectedCat?.subgroups && (
        <CategorySubtypePicker
          subgroups={selectedCat.subgroups}
          filterLabel={
            resortGroup === "accommodation" ? "Размещение" :
            resortGroup === "wellness" ? "Оздоровление и SPA" :
            resortGroup === "nature" ? "Загородный и eco-отдых" :
            "Инвестиции и проекты"
          }
          subtype={subtype}
          onSubtypeSelect={setSubtype}
          accentColor="cyan"
          showIcons={true}
          emptyHint="Выберите тип — характеристики подберутся автоматически"
          containerRef={subtypeRef}
        />
      )}

      {/* Подтипы для Новостроек */}
      {isNewbuild && newbuildGroup && selectedCat?.subgroups && (
        <CategorySubtypePicker
          subgroups={selectedCat.subgroups}
          filterLabel={newbuildGroup === "commercial" ? "Коммерческие" : "Жилые"}
          subtype={subtype}
          onSubtypeSelect={setSubtype}
          accentColor="blue"
          labelSuffix=" новостройки"
          emptyHint="Выберите тип — характеристики подберутся автоматически"
          containerRef={subtypeRef}
        />
      )}

      {/* Подтипы для Коммерции */}
      {isCommercial && commercialGroup && dealType && selectedCat?.subgroups && (
        <CategorySubtypePicker
          subgroups={selectedCat.subgroups}
          filterLabel={
            commercialGroup === "office" ? "Офисная недвижимость" :
            commercialGroup === "retail" ? "Торговая недвижимость" :
            commercialGroup === "warehouse" ? "Складская и производственная" :
            commercialGroup === "service" ? "Сервис и общепит" :
            "Смешанные и универсальные"
          }
          subtype={subtype}
          onSubtypeSelect={setSubtype}
          accentColor="violet"
          containerRef={subtypeRef}
        />
      )}

      {/* Подтипы для Жилой */}
      {isResidential && residentialGroup && dealType && selectedCat?.subgroups && (
        <CategorySubtypePicker
          subgroups={selectedCat.subgroups}
          filterLabel={
            residentialGroup === "urban" ? "Городская" :
            residentialGroup === "suburban" ? "Загородная" :
            "Премиум"
          }
          subtype={subtype}
          onSubtypeSelect={setSubtype}
          accentColor="sky"
          labelSuffix=" недвижимость"
          containerRef={subtypeRef}
        />
      )}

      {/* Подтипы для НЕ курортных, НЕ новостроек, НЕ жилой, НЕ коммерции, НЕ инвестиций, НЕ торгов */}
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
