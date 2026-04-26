import Icon from "@/components/ui/icon"
import { RESORT_SUBTYPE_ICONS } from "./step1CategoryData"

interface Subgroup {
  label: string
  items: string[]
}

interface CategorySubtypePickerProps {
  subgroups: Subgroup[]
  filterLabel: string
  subtype: string
  onSubtypeSelect: (st: string) => void
  accentColor?: "blue" | "violet" | "sky" | "amber" | "green" | "cyan"
  labelSuffix?: string
  showIcons?: boolean
  emptyHint?: string
  containerRef?: React.RefObject<HTMLDivElement>
}

const ACCENT: Record<string, { border: string; bg: string; text: string; line: string }> = {
  blue:   { border: "border-blue-500",   bg: "bg-blue-500/15",   text: "text-blue-300",   line: "bg-blue-500/40" },
  violet: { border: "border-violet-500", bg: "bg-violet-500/15", text: "text-violet-300", line: "bg-violet-500/40" },
  sky:    { border: "border-sky-500",    bg: "bg-sky-500/15",    text: "text-sky-300",    line: "bg-sky-500/40" },
  amber:  { border: "border-amber-500",  bg: "bg-amber-500/15",  text: "text-amber-300",  line: "bg-amber-500/40" },
  green:  { border: "border-green-500",  bg: "bg-green-500/15",  text: "text-green-300",  line: "bg-green-500/40" },
  cyan:   { border: "border-cyan-500",   bg: "bg-cyan-500/15",   text: "text-cyan-300",   line: "bg-cyan-500/40" },
}

const LABEL_ACCENT: Record<string, string> = {
  blue:   "text-blue-400/70",
  violet: "text-violet-400/70",
  sky:    "text-sky-400/70",
  amber:  "text-amber-400/70",
  green:  "text-green-400/70",
  cyan:   "text-cyan-400/70",
}

export default function CategorySubtypePicker({
  subgroups,
  filterLabel,
  subtype,
  onSubtypeSelect,
  accentColor = "blue",
  labelSuffix = "",
  showIcons = false,
  emptyHint = "Выберите тип — поля формы подстроятся автоматически",
  containerRef,
}: CategorySubtypePickerProps) {
  const a = ACCENT[accentColor]
  const la = LABEL_ACCENT[accentColor]

  const filtered = subgroups.filter(sg => sg.label === filterLabel)

  return (
    <div ref={containerRef} className="space-y-3">
      {filtered.map(sg => (
        <div key={sg.label}>
          <p className={`text-[11px] ${la} uppercase tracking-widest mb-2 flex items-center gap-1.5`}>
            <span className={`w-3 h-px ${a.line} inline-block`}></span>
            {sg.label}{labelSuffix}
          </p>
          <div className="flex flex-wrap gap-2">
            {sg.items.map(st => (
              <button
                key={st}
                onClick={() => onSubtypeSelect(st)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
                  subtype === st
                    ? `${a.border} ${a.bg} ${a.text}`
                    : "border-[#1f1f1f] bg-[#111] text-gray-400 hover:border-[#3a3a3a] hover:text-white"
                }`}
              >
                {showIcons && (
                  <Icon
                    name={(RESORT_SUBTYPE_ICONS[st] ?? "Building2") as "Building2"}
                    fallback="Building2"
                    className="h-3 w-3 shrink-0"
                  />
                )}
                {st}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!subtype && (
        <p className="text-[11px] text-gray-600">{emptyHint}</p>
      )}
    </div>
  )
}
