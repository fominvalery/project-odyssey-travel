import Icon from "@/components/ui/icon"
import { CATEGORIES, CATEGORY_GROUPS } from "../wizardTypes"
import { CAT_BG } from "./step1CategoryData"

interface CategoryMainGridProps {
  category: string
  onSelect: (id: string) => void
}

export default function CategoryMainGrid({ category, onSelect }: CategoryMainGridProps) {
  return (
    <>
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
                    onClick={() => onSelect(cat.id)}
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
    </>
  )
}
