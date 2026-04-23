import func2url from "../../backend/func2url.json"

const BASE = (func2url as Record<string, string>).agency

export type RoleCode =
  | "founder"
  | "director"
  | "rop"
  | "broker"
  | "manager"
  | "marketer"
  | "accountant"
  | "lawyer"
  | "mortgage_broker"

export const ROLE_TITLES: Record<RoleCode, string> = {
  founder: "Учредитель",
  director: "Директор",
  rop: "Руководитель отдела продаж",
  broker: "Брокер",
  manager: "Менеджер",
  marketer: "Маркетолог",
  accountant: "Бухгалтер",
  lawyer: "Юрист",
  mortgage_broker: "Ипотечный брокер",
}

export const ROLE_LEVEL: Record<RoleCode, number> = {
  founder: 110,
  director: 100,
  rop: 80,
  broker: 60,
  manager: 40,
  marketer: 40,
  accountant: 40,
  lawyer: 40,
  mortgage_broker: 40,
}

// Роли с правами управления
export const ADMIN_ROLES: RoleCode[] = ["founder", "director"]

export function isAdmin(role: RoleCode): boolean {
  return ADMIN_ROLES.includes(role)
}

export interface OrgSummary {
  id: string
  name: string
  logo_url: string | null
  inn: string | null
  description: string
  role_code: RoleCode
  role_title: string
  department_id: string | null
}

export interface Employee {
  user_id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  role_code: RoleCode
  role_title: string
  department_id: string | null
  status: string
  joined_at: string
}

export interface Department {
  id: string
  name: string
  head_id: string | null
  head_name: string | null
  members_count: number
}

export interface InviteRow {
  id: string
  email: string
  phone: string | null
  full_name: string
  role_code: RoleCode
  department_id: string | null
  status: string
  token: string
  expires_at: string
  created_at: string
}

export interface InviteLookup {
  id: string
  email: string
  full_name: string
  role_code: RoleCode
  role_title: string
  status: string
  expires_at: string
  organization_id: string
  organization_name: string
  logo_url: string | null
}

async function call<T>(params: {
  action: string
  userId?: string | null
  orgId?: string | null
  method?: "GET" | "POST"
  body?: Record<string, unknown>
  query?: Record<string, string | undefined>
}): Promise<T> {
  const { action, userId, orgId, method = "POST", body, query } = params
  const qs = new URLSearchParams({ action, ...(query as Record<string, string>) })
  const url = `${BASE}?${qs.toString()}`

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (userId) headers["X-User-Id"] = userId
  if (orgId) headers["X-Org-Id"] = orgId

  const init: RequestInit = { method, headers }
  if (method !== "GET" && body) init.body = JSON.stringify(body)

  const res = await fetch(url, init)
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text }
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error || `HTTP ${res.status}`
    throw new Error(err)
  }
  return data as T
}

export const agencyApi = {
  listMyOrgs: (userId: string) =>
    call<OrgSummary[]>({ action: "list_my_orgs", userId, method: "GET" }),

  createOrg: (
    userId: string,
    payload: { name: string; inn?: string; logo_url?: string; description?: string },
  ) => call<OrgSummary>({ action: "create_org", userId, body: payload }),

  getOrg: (userId: string, orgId: string) =>
    call<OrgSummary & { admin_id: string; created_at: string; my_role: RoleCode }>({
      action: "get_org",
      userId,
      orgId,
      method: "GET",
    }),

  updateOrg: (
    userId: string,
    orgId: string,
    patch: Partial<{ name: string; inn: string; logo_url: string; description: string }>,
  ) => call<{ ok: true }>({ action: "update_org", userId, orgId, body: patch }),

  listEmployees: (userId: string, orgId: string, departmentId?: string | null) =>
    call<Employee[]>({
      action: "list_employees",
      userId,
      orgId,
      method: "GET",
      query: departmentId ? { department_id: departmentId } : undefined,
    }),

  updateEmployee: (
    userId: string,
    orgId: string,
    payload: { user_id: string; role_code?: RoleCode; department_id?: string | null; status?: string },
  ) => call<{ ok: true }>({ action: "update_employee", userId, orgId, body: payload }),

  listDepartments: (userId: string, orgId: string) =>
    call<Department[]>({ action: "list_departments", userId, orgId, method: "GET" }),

  createDepartment: (
    userId: string,
    orgId: string,
    payload: { name: string; head_id?: string | null },
  ) => call<Department>({ action: "create_department", userId, orgId, body: payload }),

  updateDepartment: (
    userId: string,
    orgId: string,
    payload: { department_id: string; name?: string; head_id?: string | null },
  ) => call<{ ok: true }>({ action: "update_department", userId, orgId, body: payload }),

  deleteDepartment: (userId: string, orgId: string, departmentId: string) =>
    call<{ ok: true; archived: boolean }>({
      action: "delete_department",
      userId,
      orgId,
      body: { department_id: departmentId },
    }),

  createInvite: (
    userId: string,
    orgId: string,
    payload: {
      full_name: string
      email: string
      phone?: string
      role_code: RoleCode
      department_id?: string | null
    },
  ) =>
    call<{
      invite_id: string
      token: string
      invite_url: string
      expires_at: string
      auto_joined: boolean
    }>({ action: "create_invite", userId, orgId, body: payload }),

  listInvites: (userId: string, orgId: string) =>
    call<InviteRow[]>({ action: "list_invites", userId, orgId, method: "GET" }),

  lookupInvite: (token: string) =>
    call<InviteLookup>({ action: "lookup_invite", method: "GET", query: { token } }),

  acceptInvite: (userId: string, token: string) =>
    call<{ ok: true; organization_id: string }>({
      action: "accept_invite",
      userId,
      body: { token },
    }),

  orgAnalytics: (userId: string, orgId: string) =>
    call<OrgAnalytics>({ action: "org_analytics", userId, orgId, method: "GET" }),

  getOrgFull: (userId: string, orgId: string) =>
    call<OrgFull>({ action: "get_org_full", userId, orgId, method: "GET" }),

  updateOrgFull: (
    userId: string,
    orgId: string,
    patch: Partial<OrgFullPatch>,
  ) => call<{ ok: true }>({ action: "update_org", userId, orgId, body: patch }),

  listDeals: (userId: string, orgId: string, status?: string) =>
    call<Deal[]>({
      action: "list_deals",
      userId,
      orgId,
      method: "GET",
      query: status ? { status } : undefined,
    }),

  createDeal: (userId: string, orgId: string, payload: Partial<Deal>) =>
    call<{ id: string }>({ action: "create_deal", userId, orgId, body: payload as Record<string, unknown> }),

  updateDeal: (userId: string, orgId: string, payload: Partial<Deal> & { deal_id: string }) =>
    call<{ ok: true }>({ action: "update_deal", userId, orgId, body: payload as Record<string, unknown> }),

  listReviews: (orgId: string) =>
    call<{ reviews: Review[]; avg_rating: number; count: number }>({
      action: "list_reviews",
      method: "GET",
      query: { org_id: orgId },
    }),

  createReview: (userId: string, orgId: string, payload: Partial<Review>) =>
    call<{ id: string }>({ action: "create_review", userId, orgId, body: payload as Record<string, unknown> }),

  publicAgency: (orgId: string) =>
    call<OrgPublic>({ action: "public_agency", method: "GET", query: { org_id: orgId } }),
}

export interface DeptObjectStat {
  dept_id: string
  dept_name: string
  total: number
  published: number
  active: number
}

export interface DeptLeadStat {
  dept_id: string
  dept_name: string
  total: number
  deals: number
  new_leads: number
}

export interface EmployeeStat {
  user_id: string
  full_name: string
  avatar_url: string | null
  role_code: RoleCode
  role_title: string
  department_id: string | null
  objects_count?: number
  leads_count?: number
  deals_count?: number
}

export interface OrgAnalytics {
  summary: {
    total_objects: number
    published_objects: number
    total_leads: number
    total_deals: number
  }
  dept_objects: DeptObjectStat[]
  dept_leads: DeptLeadStat[]
  top_by_objects: EmployeeStat[]
  top_by_leads: EmployeeStat[]
}

export interface OrgFull {
  id: string
  name: string
  inn: string | null
  logo_url: string | null
  description: string
  admin_id: string
  created_at: string
  city: string
  website: string
  telegram_username: string
  vk_username: string
  specializations: string[]
  bio: string
  experience: string
  license_number: string
  founded_year: number | null
  is_public: boolean
  agents_count: number
  deals_count: number
  rating: number
  review_count: number
  my_role: RoleCode
  my_role_title: string
}

export type OrgFullPatch = Partial<Omit<OrgFull, "id" | "admin_id" | "created_at" | "my_role" | "my_role_title" | "agents_count" | "deals_count" | "rating" | "review_count">>

export interface Deal {
  id: string
  title: string
  deal_type: string
  amount: number | null
  commission_total: number | null
  commission_agent_pct: number
  commission_agency_pct: number
  commission_agent: number | null
  commission_agency: number | null
  status: string
  client_name: string
  client_phone: string
  notes: string
  closed_at: string | null
  created_at: string
  agent_id: string
  agent_name: string
  agent_avatar: string | null
}

export interface Review {
  id: string
  author_name: string
  rating: number
  text: string
  deal_type: string
  created_at: string
}

export interface OrgPublic {
  id: string
  name: string
  logo_url: string | null
  description: string
  city: string
  website: string
  telegram_username: string
  vk_username: string
  specializations: string[]
  bio: string
  experience: string
  founded_year: number | null
  is_public: boolean
  members: Array<{ id: string; name: string; avatar_url: string | null; role_code: RoleCode; role_title: string }>
  agents_count: number
  rating: number
  review_count: number
}