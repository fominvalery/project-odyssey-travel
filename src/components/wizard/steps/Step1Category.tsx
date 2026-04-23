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
}

const CAT_BG: Record<string, string> = {
  "commercial":  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=60",
  "investment":  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=60",
  "resort":      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=60",
  "auction":     "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=60",
  "residential": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=60",
  "newbuild":    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=60",
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

export function Step1Category({ category, setCategory, subtype, setSubtype }: Step1Props) {
  const selectedCat = CATEGORIES.find(c => c.id === category)
  const isResort = category === "resort"

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
                    onClick={() => { setCategory(cat.id); setSubtype("") }}
                    className={`relative rounded-2xl border overflow-hidden text-center transition-all hover:border-blue-500/50 ${
                      isActive ? "border-blue-500" : "border-[#1f1f1f]"
                    }`}
                    style={{ minHeight: 130 }}
                  >
                      {/* Фоновое фото */}
                    {bg && (
                      <img
                        src={bg}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    {/* Оверлей */}
                    <div className={`absolute inset-0 transition-all ${
                      isActive
                        ? "bg-blue-950/70"
                        : "bg-black/72"
                    }`} />
                    {/* Контент */}
                    <div className="relative z-10 p-5">
                      <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center backdrop-blur-sm ${
                        isActive ? "bg-blue-500/30 border border-blue-400/40" : "bg-white/10 border border-white/10"
                      }`}>
                        <Icon name={cat.icon as "Home"} fallback="Building2" className={`h-5 w-5 ${isActive ? "text-blue-300" : "text-gray-300"}`} />
                      </div>
                      <p className="font-semibold text-white text-sm mb-0.5">{cat.label}</p>
                      <p className={`text-[11px] leading-tight ${isActive ? "text-blue-200/70" : "text-gray-400"}`}>{cat.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Выбор подтипа для Курортной — с подгруппами */}
      {isResort && selectedCat?.subgroups && (
        <div className="space-y-4">
          {selectedCat.subgroups.map(sg => (
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
            <p className="text-[11px] text-gray-600">Выберите тип курортного объекта — характеристики подберутся автоматически</p>
          )}
        </div>
      )}

      {/* Выбор подтипа для НЕ курортных категорий */}
      {!isResort && selectedCat?.subtypes && selectedCat.subtypes.length > 0 && (
        <div>
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