import { useState } from "react"
import { OrgFull, RoleCode, Employee, Department } from "@/lib/agencyApi"
import { type ObjectData } from "@/components/AddObjectWizard"
import type { Lead } from "@/components/dashboard/LeadCard"
import type { ProfileForm } from "@/components/dashboard/DashboardProfile"
import type { UserProfile as User } from "@/hooks/useAuth"

import AgencyCardTab from "@/components/agency/AgencyCardTab"
import AgencyEmployeesTab from "@/components/agency/AgencyEmployeesTab"
import AgencyDepartmentsTab from "@/components/agency/AgencyDepartmentsTab"
import { AgencyInvitesTab } from "@/components/agency/AgencyInvitesTab"
import AgencyAnalyticsTab from "@/components/agency/AgencyAnalyticsTab"
import AgencyDealsTab from "@/components/agency/AgencyDealsTab"
import AgencyReviewsTab from "@/components/agency/AgencyReviewsTab"
import { DashboardCRM } from "@/components/dashboard/DashboardCRM"
import DashboardObjects from "@/components/dashboard/DashboardObjects"
import DashboardClub from "@/components/dashboard/DashboardClub"
import DashboardMessages from "@/components/dashboard/DashboardMessages"
import { DashboardProfile } from "@/components/dashboard/DashboardProfile"
import DashboardJointDeals from "@/components/dashboard/DashboardJointDeals"
import Icon from "@/components/ui/icon"

type AgencySection =
  | "objects" | "crm" | "analytics" | "network" | "joint-deals" | "messages" | "profile"
  | "card" | "employees" | "departments" | "deals" | "invites" | "reviews"

function canSee(roleLevel: (r: RoleCode) => number, role: RoleCode, minRole: RoleCode) {
  return roleLevel(role) >= roleLevel(minRole)
}

interface Props {
  section: AgencySection
  setSection: (s: AgencySection) => void
  user: User
  orgId: string
  org: { name: string }
  orgFull: OrgFull | null
  setOrgFull: (o: OrgFull) => void
  myRole: RoleCode
  myDeptId: string | null
  isRop: boolean
  isDirector: boolean
  isFounder: boolean
  employees: Employee[]
  departments: Department[]
  deptFilter: string
  setDeptFilter: (v: string) => void
  objects: ObjectData[]
  loadingObjects: boolean
  editingObject: ObjectData | null
  setEditingObject: (o: ObjectData | null) => void
  setShowWizard: (v: boolean) => void
  reloadObjects: () => void
  catFilter: string
  setCatFilter: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  objSearch: string
  setObjSearch: (v: string) => void
  handleDeleteObject: (id: string) => void
  initials: string
  profileForm: ProfileForm
  setProfileForm: (f: ProfileForm) => void
  profileSaved: boolean
  handleSaveProfile: (e: React.FormEvent) => void
  updateProfile: (patch: Record<string, unknown>) => void
  invites: import("@/lib/agencyApi").InviteRow[]
  setInviteOpen: (v: boolean) => void
  setEditingDept: (d: Department | null) => void
  setDeptModalOpen: (v: boolean) => void
  setDeletingDept: (d: Department | null) => void
  changeRole: (userId: string, role: RoleCode) => void
  changeDepartment: (userId: string, deptId: string | null) => void
  fireEmployee: (userId: string) => void
  setReassigningObject: (o: ObjectData | null) => void
  setReassigningLead: (l: Lead | null) => void
  roleLevelFn: (r: RoleCode) => number
}

export default function AgencyContent({
  section, setSection,
  user, orgId, org, orgFull, setOrgFull,
  myRole, myDeptId, isRop, isDirector, isFounder,
  employees, departments, deptFilter, setDeptFilter,
  objects, loadingObjects, editingObject, setEditingObject, setShowWizard, reloadObjects,
  catFilter, setCatFilter, statusFilter, setStatusFilter, objSearch, setObjSearch,
  handleDeleteObject, initials,
  profileForm, setProfileForm, profileSaved, handleSaveProfile, updateProfile,
  invites, setInviteOpen,
  setEditingDept, setDeptModalOpen, setDeletingDept,
  changeRole, changeDepartment, fireEmployee,
  setReassigningObject, setReassigningLead,
  roleLevelFn,
}: Props) {
  const [openPartnerId, setOpenPartnerId] = useState<string | null>(null)
  const [openPartnerName, setOpenPartnerName] = useState<string | null>(null)
  const [openPartnerAvatar, setOpenPartnerAvatar] = useState<string | null>(null)
  const [openPartnerStatus, setOpenPartnerStatus] = useState<string | null>(null)

  function handleOpenMessage(partnerId: string, partnerName: string, partnerAvatar: string | null, partnerStatus: string) {
    setOpenPartnerId(partnerId)
    setOpenPartnerName(partnerName)
    setOpenPartnerAvatar(partnerAvatar)
    setOpenPartnerStatus(partnerStatus)
    setSection("messages")
  }

  return (
    <main className="flex-1 overflow-auto pb-20 md:pb-0">
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm">
        <p className="text-sm font-semibold text-white">{org.name}</p>
        {isDirector && (
          <button onClick={() => setInviteOpen(true)} className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
            <Icon name="UserPlus" className="h-4 w-4" />Пригласить
          </button>
        )}
      </div>

      <div className="p-6 md:p-8">
        {section === "objects" && (
          <DashboardObjects
            objects={objects} loading={loadingObjects}
            showWizard={false} setShowWizard={setShowWizard}
            editingObject={editingObject}
            onEdit={(obj) => { setEditingObject(obj); setShowWizard(true) }}
            onDelete={handleDeleteObject}
            onWizardSaved={(obj) => { void obj; reloadObjects() }}
            onWizardClose={() => { setShowWizard(false); setEditingObject(null) }}
            catFilter={catFilter} setCatFilter={setCatFilter}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            objSearch={objSearch} setObjSearch={setObjSearch}
            userId={user.id} isBasic={false}
            onReassign={isDirector ? (obj) => setReassigningObject(obj) : undefined}
            employees={isDirector ? employees.map(emp => ({ user_id: emp.user_id, name: emp.full_name })) : undefined}
          />
        )}

        {section === "crm" && orgId && (
          <DashboardCRM
            userId={user.id} orgId={orgId}
            deptId={isRop ? (myDeptId ?? undefined) : undefined}
            onReassignLead={isDirector ? (lead) => setReassigningLead(lead) : undefined}
          />
        )}

        {section === "analytics" && canSee(roleLevelFn, myRole, "rop") && orgId && (
          <AgencyAnalyticsTab orgId={orgId} />
        )}

        {section === "network" && (
          <DashboardClub userId={user.id} onMessage={handleOpenMessage} />
        )}

        {section === "joint-deals" && (
          <DashboardJointDeals userId={user.id} />
        )}

        {section === "messages" && (
          <DashboardMessages
            userId={user.id}
            openPartnerId={openPartnerId}
            openPartnerName={openPartnerName}
            openPartnerAvatar={openPartnerAvatar}
            openPartnerStatus={openPartnerStatus}
            onClearOpen={() => {
              setOpenPartnerId(null)
              setOpenPartnerName(null)
              setOpenPartnerAvatar(null)
              setOpenPartnerStatus(null)
            }}
            onUnreadChange={() => {}}
          />
        )}

        {section === "profile" && (
          <DashboardProfile
            user={user} initials={initials}
            form={profileForm} setForm={setProfileForm}
            saved={profileSaved} onSave={handleSaveProfile}
            onAvatarChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const r = new FileReader()
              r.onload = (ev) => updateProfile({ avatar: ev.target?.result as string })
              r.readAsDataURL(f)
            }}
            onAvatarCropped={(d) => updateProfile({ avatar: d })}
            onStatusChange={(s) => updateProfile({ status: s })}
            forceShowClubFields
          />
        )}

        {section === "card" && orgFull && orgId && (
          <AgencyCardTab org={orgFull} userId={user.id} orgId={orgId} onSaved={setOrgFull} />
        )}

        {section === "employees" && canSee(roleLevelFn, myRole, "rop") && (
          <AgencyEmployeesTab
            employees={employees} departments={departments}
            deptFilter={deptFilter} setDeptFilter={setDeptFilter}
            isDirector={isDirector} isFounder={isFounder} isRop={isRop}
            currentUserId={user.id} myDeptId={myDeptId}
            onChangeRole={changeRole} onChangeDepartment={changeDepartment}
            onFireEmployee={isDirector ? fireEmployee : undefined}
            onInvite={() => setInviteOpen(true)}
          />
        )}

        {section === "departments" && canSee(roleLevelFn, myRole, "director") && (
          <AgencyDepartmentsTab
            departments={departments} isDirector={isDirector}
            onCreate={() => { setEditingDept(null); setDeptModalOpen(true) }}
            onEdit={(d) => { setEditingDept(d); setDeptModalOpen(true) }}
            onDelete={(d) => setDeletingDept(d)}
          />
        )}

        {section === "deals" && orgId && (
          <AgencyDealsTab
            userId={user.id} orgId={orgId} myRole={myRole}
            employees={isRop ? employees.filter(e => e.department_id === myDeptId) : employees}
          />
        )}

        {section === "invites" && canSee(roleLevelFn, myRole, "rop") && (
          <AgencyInvitesTab invites={invites} />
        )}

        {section === "reviews" && orgId && (
          <AgencyReviewsTab orgId={orgId} userId={user.id ?? null} userName={user.name ?? ""} />
        )}
      </div>
    </main>
  )
}