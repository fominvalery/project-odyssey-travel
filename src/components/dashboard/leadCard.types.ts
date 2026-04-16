export type FunnelStage = "Лид" | "Подбор" | "Показ" | "Переговоры" | "Сделка" | "Отказ"

export interface Lead {
  id: string
  owner_id: string | null
  object_id: string | null
  object_title: string
  name: string
  phone: string
  email: string
  message: string
  source: string
  stage: FunnelStage
  created_at: string
}

export interface Comment {
  id: string
  text: string
  created_at: string
}

export interface Task {
  id: string
  done_text: string
  todo_text: string
  due_at: string | null
  completed: boolean
  created_at: string
}

export interface LeadFile {
  id: string
  name: string
  url: string
  mime: string
  size_bytes: number
  created_at: string
}

export const FUNNEL_STAGES: { stage: FunnelStage; color: string; bg: string; icon: string }[] = [
  { stage: "Лид",        color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    icon: "UserPlus" },
  { stage: "Подбор",     color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20", icon: "Search" },
  { stage: "Показ",      color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",  icon: "Eye" },
  { stage: "Переговоры", color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20", icon: "MessageSquare" },
  { stage: "Сделка",     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "Handshake" },
  { stage: "Отказ",      color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",      icon: "XCircle" },
]

export function formatDate(iso: string) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("ru", { day: "numeric", month: "short" })
  } catch {
    return ""
  }
}

export function formatDateTime(iso: string | null) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    return d.toLocaleString("ru", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return ""
  }
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

export function nowTime() {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 30)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export const ruLocale = {
  localize: {
    month: (n: number) => ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"][n],
    day: (n: number) => ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][n],
    ordinalNumber: (n: number) => String(n),
    era: (n: number) => ["до н.э.", "н.э."][n],
    quarter: (n: number) => `Q${n + 1}`,
    dayPeriod: (v: string) => v,
  },
  formatLong: {
    date: () => "dd.MM.yyyy",
    time: () => "HH:mm",
    dateTime: () => "dd.MM.yyyy HH:mm",
  },
  match: {
    month: () => ({ value: 0, rest: "" }),
    day: () => ({ value: 0, rest: "" }),
    ordinalNumber: () => ({ value: 0, rest: "" }),
    era: () => ({ value: 0, rest: "" }),
    quarter: () => ({ value: 0, rest: "" }),
    dayPeriod: () => ({ value: "am", rest: "" }),
  },
  options: { weekStartsOn: 1 as const, firstWeekContainsDate: 1 },
  formatRelative: () => "",
  code: "ru",
  formatDistance: () => "",
} as unknown as Locale
