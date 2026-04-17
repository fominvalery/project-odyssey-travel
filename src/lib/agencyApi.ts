import func2url from "../../backend/func2url.json"

const BASE = (func2url as Record<string, string>).agency

export type RoleCode =
  | "director"
  | "rop"
  | "broker"
  | "manager"
  | "marketer"
  | "accountant"
  | "lawyer"
  | "mortgage_broker"

export const ROLE_TITLES: Record<RoleCode, string> = {
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
  director: 100,
  rop: 80,
  broker: 60,
  manager: 40,
  marketer: 40,
  accountant: 40,
  lawyer: 40,
  mortgage_broker: 40,
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

  listEmployees: (userId: string, orgId: string) =>
    call<Employee[]>({ action: "list_employees", userId, orgId, method: "GET" }),

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
}
