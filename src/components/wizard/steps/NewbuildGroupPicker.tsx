import Icon from "@/components/ui/icon"
import { NEWBUILD_GROUPS } from "./step1CategoryData"
import CategorySubtypePicker from "./CategorySubtypePicker"

interface Subgroup {
  label: string
  items: string[]
}

interface NewbuildGroupPickerProps {
  newbuildGroup: string
  onGroupSelect: (id: "commercial" | "residential") => void
  subtype: string
  onSubtypeSelect: (st: string) => void
  subgroups?: Subgroup[]
  groupRef?: React.RefObject<HTMLDivElement>
  subtypeRef?: React.RefObject<HTMLDivElement>
}

export default function NewbuildGroupPicker({
  newbuildGroup,
  onGroupSelect,
  subtype,
  onSubtypeSelect,
  subgroups,
  groupRef,
  subtypeRef,
}: NewbuildGroupPickerProps) {
  return (
    <>
      <div ref={groupRef} className="space-y-3">
        <p className="text-[11px] text-gray-500 uppercase tracking-widest">Тип новостройки</p>
        <div className="grid grid-cols-2 gap-3">
          {NEWBUILD_GROUPS.map(g => {
            const isActive = newbuildGroup === g.id
            return (
              <button
                key={g.id}
                onClick={() => onGroupSelect(g.id as "commercial" | "residential")}
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

      {newbuildGroup && subgroups && (
        <CategorySubtypePicker
          subgroups={subgroups}
          filterLabel={newbuildGroup === "commercial" ? "Коммерческие" : "Жилые"}
          subtype={subtype}
          onSubtypeSelect={onSubtypeSelect}
          accentColor="blue"
          labelSuffix=" новостройки"
          emptyHint="Выберите тип — характеристики подберутся автоматически"
          containerRef={subtypeRef}
        />
      )}
    </>
  )
}
