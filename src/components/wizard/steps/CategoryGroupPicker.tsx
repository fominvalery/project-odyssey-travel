import Icon from "@/components/ui/icon"

interface GroupItem {
  id: string
  label: string
  desc: string
  icon: string
  bg: string
}

interface CategoryGroupPickerProps {
  title: string
  groups: GroupItem[]
  activeGroup: string
  onSelect: (id: string) => void
  accentBorder?: string
  accentBg?: string
  accentIcon?: string
  accentDesc?: string
  minHeight?: number
  cols?: string
  containerRef?: React.RefObject<HTMLDivElement>
  fallbackIcon?: string
}

export default function CategoryGroupPicker({
  title,
  groups,
  activeGroup,
  onSelect,
  accentBorder = "border-blue-500 shadow-lg shadow-blue-500/20",
  accentBg = "rgba(23,37,84,0.68)",
  accentIcon = "bg-blue-500/40 border border-blue-400/50",
  accentDesc = "text-blue-200/80",
  minHeight = 120,
  cols = "grid-cols-2",
  containerRef,
  fallbackIcon = "Building2",
}: CategoryGroupPickerProps) {
  return (
    <div ref={containerRef} className="space-y-3">
      <p className="text-[11px] text-gray-500 uppercase tracking-widest">{title}</p>
      <div className={`grid ${cols} gap-3`}>
        {groups.map(g => {
          const isActive = activeGroup === g.id
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className={`relative rounded-2xl border overflow-hidden text-center transition-all duration-300 group ${
                isActive ? accentBorder : "border-[#2a2a2a] hover:border-white/30"
              }`}
              style={{ minHeight }}
            >
              <img src={g.bg} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div
                className="absolute inset-0 transition-all duration-300"
                style={{ background: isActive ? accentBg : "rgba(0,0,0,0.60)" }}
              />
              <div className="relative z-10 p-4 flex flex-col items-center justify-center h-full">
                <div className={`w-9 h-9 rounded-xl mb-2 flex items-center justify-center backdrop-blur-sm transition-all ${
                  isActive ? accentIcon : "bg-white/10 border border-white/15 group-hover:bg-white/15"
                }`}>
                  <Icon
                    name={g.icon as "Home"}
                    fallback={fallbackIcon as "Home"}
                    className={`h-4 w-4 ${isActive ? accentDesc.replace("text-", "text-").replace("/80", "") : "text-white/80"}`}
                  />
                </div>
                <p className="font-bold text-white text-xs mb-0.5 drop-shadow">{g.label}</p>
                <p className={`text-[10px] leading-snug drop-shadow ${isActive ? accentDesc : "text-white/50"}`}>{g.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
