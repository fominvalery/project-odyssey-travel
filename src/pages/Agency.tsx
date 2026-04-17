import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import {
  agencyApi,
  Employee,
  InviteRow,
  OrgSummary,
  ROLE_TITLES,
  ROLE_LEVEL,
  RoleCode,
} from "@/lib/agencyApi"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Icon from "@/components/ui/icon"
import InviteModal from "@/components/agency/InviteModal"
import { toast } from "@/hooks/use-toast"

const EDITABLE_ROLES: RoleCode[] = [
  "director",
  "rop",
  "broker",
  "manager",
  "marketer",
  "accountant",
  "lawyer",
  "mortgage_broker",
]

export default function Agency() {
  const { id: orgId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [org, setOrg] = useState<(OrgSummary & { my_role: RoleCode }) | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

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
      const [o, emp, inv] = await Promise.all([
        agencyApi.getOrg(user.id, orgId),
        agencyApi.listEmployees(user.id, orgId),
        agencyApi
          .listInvites(user.id, orgId)
          .catch(() => [] as InviteRow[]),
      ])
      setOrg(o as OrgSummary & { my_role: RoleCode })
      setEmployees(emp)
      setInvites(inv)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(false)
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

  const canInvite = ROLE_LEVEL[org.my_role] >= ROLE_LEVEL.rop
  const isDirector = org.my_role === "director"

  const stats = [
    { label: "Сотрудников", value: employees.length, icon: "Users", color: "from-violet-500 to-indigo-500" },
    { label: "Активных приглашений", value: invites.filter((i) => i.status === "pending").length, icon: "Send", color: "from-blue-500 to-cyan-500" },
    { label: "Моя роль", value: ROLE_TITLES[org.my_role], icon: "Shield", color: "from-pink-500 to-rose-500" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            В личный кабинет
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/10">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Icon name="Building2" size={14} />
            </div>
            <div className="text-sm">
              <div className="font-semibold leading-tight">{org.name}</div>
              <div className="text-[10px] text-violet-300 leading-tight">
                Кабинет агентства
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
          <div>
            <div className="text-xs text-violet-300 font-medium tracking-widest mb-1">
              АГЕНТСТВО
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{org.name}</h1>
            {org.inn && (
              <div className="text-sm text-slate-400">ИНН: {org.inn}</div>
            )}
            {org.description && (
              <div className="text-sm text-slate-300 mt-2 max-w-2xl">
                {org.description}
              </div>
            )}
          </div>
          {canInvite && (
            <Button
              onClick={() => setInviteOpen(true)}
              className="bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
            >
              <Icon name="UserPlus" size={16} className="mr-2" />
              Пригласить сотрудника
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="bg-white/5 border-white/10 p-5 text-white">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}
                >
                  <Icon name={s.icon} size={20} />
                </div>
                <div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                  <div className="text-xl font-bold">{s.value}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="employees">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="employees">Сотрудники</TabsTrigger>
            <TabsTrigger value="invites">Приглашения</TabsTrigger>
            <TabsTrigger value="about">Об агентстве</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="mt-4">
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              {employees.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <Icon name="Users" size={36} className="mx-auto mb-3 opacity-50" />
                  Пока нет сотрудников
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {employees.map((e) => (
                    <div
                      key={e.user_id}
                      className="p-4 flex items-center gap-4 hover:bg-white/5"
                    >
                      <Avatar className="h-10 w-10">
                        {e.avatar_url && <AvatarImage src={e.avatar_url} />}
                        <AvatarFallback className="bg-violet-500/30 text-violet-200">
                          {e.full_name.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{e.full_name}</div>
                        <div className="text-xs text-slate-400 truncate">
                          {e.email}
                          {e.phone ? ` · ${e.phone}` : ""}
                        </div>
                      </div>
                      {isDirector && e.user_id !== user?.id ? (
                        <Select
                          value={e.role_code}
                          onValueChange={(v) => changeRole(e.user_id, v as RoleCode)}
                        >
                          <SelectTrigger className="w-[220px] bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EDITABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_TITLES[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="border-violet-500/50 text-violet-200">
                          {ROLE_TITLES[e.role_code]}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="mt-4">
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              {invites.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <Icon name="Send" size={36} className="mx-auto mb-3 opacity-50" />
                  Нет приглашений
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {invites.map((i) => (
                    <div key={i.id} className="p-4 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                        <Icon name="Mail" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{i.full_name}</div>
                        <div className="text-xs text-slate-400 truncate">{i.email}</div>
                      </div>
                      <Badge className="bg-white/10 text-slate-200 border-0">
                        {ROLE_TITLES[i.role_code]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          i.status === "pending"
                            ? "border-amber-500/50 text-amber-300"
                            : i.status === "accepted"
                            ? "border-green-500/50 text-green-300"
                            : "border-slate-500/50 text-slate-400"
                        }
                      >
                        {i.status === "pending"
                          ? "Ожидает"
                          : i.status === "accepted"
                          ? "Принято"
                          : "Истекло"}
                      </Badge>
                      {i.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/10"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/invite/${i.token}`,
                            )
                            toast({ title: "Ссылка скопирована" })
                          }}
                        >
                          <Icon name="Copy" size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            <Card className="bg-white/5 border-white/10 p-6 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Название" value={org.name} />
                <InfoRow label="ИНН" value={org.inn || "—"} />
                <InfoRow label="Моя роль" value={ROLE_TITLES[org.my_role]} />
                <InfoRow label="Описание" value={org.description || "—"} />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {orgId && (
        <InviteModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          orgId={orgId}
          onInvited={reload}
        />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  )
}
