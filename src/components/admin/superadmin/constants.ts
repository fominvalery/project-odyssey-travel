export const STATUS_COLORS: Record<string, string> = {
  basic:  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  broker: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  agency: "bg-violet-500/15 text-violet-300 border-violet-500/30",
}

export const LEVEL_COLORS: Record<string, string> = {
  gray:    "bg-gray-500/10 text-gray-500 border-gray-500/20",
  blue:    "bg-blue-500/15 text-blue-300 border-blue-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  violet:  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  amber:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
  rose:    "bg-rose-500/15 text-rose-300 border-rose-500/30",
}

export const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  paid:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
}

export const LEVELS = [
  { name: "Друг",      color: "blue",    desc: "" },
  { name: "Партнёр",   color: "emerald", desc: "" },
  { name: "Бизнес",    color: "violet",  desc: "" },
  { name: "Амбасадор", color: "amber",   desc: "" },
  { name: "Лидер",     color: "rose",    desc: "" },
]

export type MainTab = "users"
export type UsersFilter = "all" | "unverified"