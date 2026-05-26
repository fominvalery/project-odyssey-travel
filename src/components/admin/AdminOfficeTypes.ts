export interface OfficeMember {
  id: string
  user_id: string
  department_id: string | null
  role_code: string
  role_label: string
  job_title: string | null
  status: string
  joined_at: string
  name: string
  email: string
  phone: string
  avatar: string
  dept_name: string | null
}

export interface OfficeDepartment {
  id: string
  name: string
  description: string | null
  head_id: string | null
  head_name: string | null
  color: string
  members_count: number
  created_at: string
}

export interface OfficeInvite {
  id: string
  email: string
  role_code: string
  role_label: string
  department_id: string | null
  dept_name: string | null
  job_title: string | null
  token: string
  status: string
  expires_at: string | null
  created_at: string
}

export interface Role { id: string; label: string }

export type Tab = "members" | "departments" | "invites"

export const DEPT_COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-300",    dot: "bg-blue-400" },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-300",  dot: "bg-violet-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-300",   dot: "bg-amber-400" },
  red:     { bg: "bg-red-500/10",     border: "border-red-500/20",     text: "text-red-300",     dot: "bg-red-400" },
  pink:    { bg: "bg-pink-500/10",    border: "border-pink-500/20",    text: "text-pink-300",    dot: "bg-pink-400" },
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    text: "text-cyan-300",    dot: "bg-cyan-400" },
  orange:  { bg: "bg-orange-500/10",  border: "border-orange-500/20",  text: "text-orange-300",  dot: "bg-orange-400" },
}

export const ROLE_COLOR: Record<string, string> = {
  owner:     "text-red-300 bg-red-500/10",
  director:  "text-orange-300 bg-orange-500/10",
  head:      "text-amber-300 bg-amber-500/10",
  analyst:   "text-blue-300 bg-blue-500/10",
  support:   "text-emerald-300 bg-emerald-500/10",
  developer: "text-violet-300 bg-violet-500/10",
  marketer:  "text-pink-300 bg-pink-500/10",
  staff:     "text-gray-400 bg-gray-500/10",
}

export const DEPT_COLORS = ["blue", "violet", "emerald", "amber", "red", "pink", "cyan", "orange"]

export function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}
