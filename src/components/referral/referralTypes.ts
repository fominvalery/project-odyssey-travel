export interface WithdrawalRequest {
  id: number
  entity_type: string
  entity_label: string
  full_name: string
  inn: string
  bank_name: string
  account: string
  amount: number | null
  status: string
  status_label: string
  created_at: string | null
}

export interface ReferralLevel {
  name: string
  level: number
  color: string
  commission1: number
  commission2: number
  withdrawal: boolean
}

export interface ReferralStats {
  referral_count: number
  referral_count_week: number
  line2_count: number
  activated_count: number
  paid_count: number
  conversion: number
  earned_line1: number
  earned_line2: number
  earned_total: number
  paid_out: number
  balance: number
  line1_payments: number
  line2_payments: number
  level: ReferralLevel
  referred_users: { id: string; name: string; email: string; status: string; joined_at: string | null }[]
  ref_code: string
}

export const LEVEL_BORDER: Record<string, string> = {
  gray:    "border-gray-500/30 from-gray-900/60",
  blue:    "border-blue-500/30 from-blue-950/60",
  emerald: "border-emerald-500/30 from-emerald-950/60",
  violet:  "border-violet-500/30 from-violet-950/60",
  amber:   "border-amber-500/30 from-amber-950/60",
  rose:    "border-rose-500/30 from-rose-950/60",
}

export const LEVEL_ICON_COLOR: Record<string, string> = {
  gray:    "text-gray-400 bg-gray-500/20",
  blue:    "text-blue-400 bg-blue-500/20",
  emerald: "text-emerald-400 bg-emerald-500/20",
  violet:  "text-violet-400 bg-violet-500/20",
  amber:   "text-amber-400 bg-amber-500/20",
  rose:    "text-rose-400 bg-rose-500/20",
}

export const ALL_LEVELS = [
  { name: "Друг",      refs: "1–2 реф.",   percent: "5%",  extra: "",       withdrawal: false },
  { name: "Партнёр",   refs: "3–9 реф.",   percent: "7%",  extra: "",       withdrawal: false },
  { name: "Бизнес",    refs: "10–29 реф.", percent: "7%",  extra: "",       withdrawal: true  },
  { name: "Амбасадор", refs: "30–99 реф.", percent: "10%", extra: "",       withdrawal: true  },
  { name: "Адвокат",   refs: "100+ реф.",  percent: "10%", extra: "+2% L2", withdrawal: true  },
]