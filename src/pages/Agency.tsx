import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import {
  agencyApi,
  Department,
  Employee,
  InviteRow,
  OrgSummary,
  RoleCode,
} from "@/lib/agencyApi"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import InviteModal from "@/components/agency/InviteModal"
import DepartmentModal from "@/components/agency/DepartmentModal"
import AgencyHeader from "@/components/agency/AgencyHeader"
import AgencyEmployeesTab from "@/components/agency/AgencyEmployeesTab"
import AgencyDepartmentsTab from "@/components/agency/AgencyDepartmentsTab"
import {
  AgencyInvitesTab,
  AgencyAboutTab,
} from "@/components/agency/AgencyInvitesTab"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

export default function Agency() {
  const { id: orgId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [org, setOrg] = useState<(OrgSummary & { my_role: RoleCode }) | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deptModalOpen, setDeptModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)
  const [deptFilter, setDeptFilter] = useState<string>("all")

  useEffect(() => {
    if (!user) {
      navigate("/")
      return
    }
    if (!orgId) return
    localStorage.setItem("k24_active_org", orgId)
    void reload()
     
  }, [user, orgId])

  const reload = async () => {
    if (!user || !orgId) return
    setLoading(true)
    setError(null)
    try {
      const [o, emp, inv, deps] = await Promise.all([
        agencyApi.getOrg(user.id, orgId),
        agencyApi.listEmployees(user.id, orgId),
        agencyApi
          .listInvites(user.id, orgId)
          .catch(() => [] as InviteRow[]),
        agencyApi
          .listDepartments(user.id, orgId)
          .catch(() => [] as Department[]),
      ])
      setOrg(o as OrgSummary & { my_role: RoleCode })
      setEmployees(emp)
      setInvites(inv)
      setDepartments(deps)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  const changeDepartment = async (targetUserId: string, deptId: string | null) => {
    if (!user || !orgId) return
    try {
      await agencyApi.updateEmployee(user.id, orgId, {
        user_id: targetUserId,
        department_id: deptId,
      })
      toast({ title: "Отдел обновлён" })
      reload()
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось",
        variant: "destructive",
      })
    }
  }

  const confirmDeleteDept = async () => {
    if (!user || !orgId || !deletingDept) return
    try {
      await agencyApi.deleteDepartment(user.id, orgId, deletingDept.id)
      toast({ title: "Отдел архивирован" })
      setDeletingDept(null)
      reload()
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось",
        variant: "destructive",
      })
    }
  }

  const changeRole = async (targetUserId: string, role: RoleCode) => {
    if (!user || !orgId) return
    try {
      await agencyApi.updateEmployee(user.id, orgId, {
        user_id: targetUserId,
        role_code: role,
      })
      toast({ title: "Роль обновлена" })
      reload()
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "Не удалось",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3">
          <Icon name="Loader2" size={24} className="animate-spin" />
          <div>Загружаем кабинет агентства...</div>
        </div>
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Card className="p-6 max-w-md">
          <Icon name="AlertCircle" size={32} className="text-red-500 mb-3" />
          <div className="font-semibold mb-1">Ошибка доступа</div>
          <div className="text-sm text-muted-foreground mb-4">
            {error || "Кабинет не найден"}
          </div>
          <Button onClick={() => navigate("/dashboard")}>В личный кабинет</Button>
        </Card>
      </div>
    )
  }

  const isDirector = org.my_role === "director"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <AgencyHeader
        org={org}
        employeesCount={employees.length}
        departmentsCount={departments.length}
        pendingInvitesCount={invites.filter((i) => i.status === "pending").length}
        onInviteClick={() => setInviteOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-6 pt-6">
        <Tabs defaultValue="employees">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="employees">Сотрудники</TabsTrigger>
            <TabsTrigger value="departments">Отделы</TabsTrigger>
            <TabsTrigger value="invites">Приглашения</TabsTrigger>
            <TabsTrigger value="about">Об агентстве</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="mt-4">
            <AgencyEmployeesTab
              employees={employees}
              departments={departments}
              deptFilter={deptFilter}
              setDeptFilter={setDeptFilter}
              isDirector={isDirector}
              currentUserId={user?.id}
              onChangeRole={changeRole}
              onChangeDepartment={changeDepartment}
            />
          </TabsContent>

          <TabsContent value="departments" className="mt-4">
            <AgencyDepartmentsTab
              departments={departments}
              isDirector={isDirector}
              onCreate={() => {
                setEditingDept(null)
                setDeptModalOpen(true)
              }}
              onEdit={(d) => {
                setEditingDept(d)
                setDeptModalOpen(true)
              }}
              onDelete={(d) => setDeletingDept(d)}
            />
          </TabsContent>

          <TabsContent value="invites" className="mt-4">
            <AgencyInvitesTab invites={invites} />
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            <AgencyAboutTab org={org} />
          </TabsContent>
        </Tabs>
      </div>

      {orgId && (
        <>
          <InviteModal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            orgId={orgId}
            departments={departments}
            onInvited={reload}
          />
          <DepartmentModal
            open={deptModalOpen}
            onClose={() => setDeptModalOpen(false)}
            orgId={orgId}
            employees={employees}
            department={editingDept}
            onSaved={reload}
          />
        </>
      )}

      <Dialog
        open={!!deletingDept}
        onOpenChange={(v) => !v && setDeletingDept(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить отдел?</DialogTitle>
            <DialogDescription>
              Отдел «{deletingDept?.name}» будет архивирован. Сотрудники
              останутся в агентстве, но будут отвязаны от этого отдела.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDept(null)}>
              Отмена
            </Button>
            <Button
              onClick={confirmDeleteDept}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
