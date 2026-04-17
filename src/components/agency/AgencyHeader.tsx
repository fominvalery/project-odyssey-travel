import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Icon from "@/components/ui/icon"
import { OrgSummary, ROLE_TITLES, ROLE_LEVEL, RoleCode } from "@/lib/agencyApi"

interface Props {
  org: OrgSummary & { my_role: RoleCode }
  employeesCount: number
  departmentsCount: number
  pendingInvitesCount: number
  onInviteClick: () => void
}

export default function AgencyHeader({
  org,
  employeesCount,
  departmentsCount,
  pendingInvitesCount,
  onInviteClick,
}: Props) {
  const navigate = useNavigate()
  const canInvite = ROLE_LEVEL[org.my_role] >= ROLE_LEVEL.rop

  const stats = [
    { label: "Сотрудников", value: employeesCount, icon: "Users", color: "from-violet-500 to-indigo-500" },
    { label: "Отделов", value: departmentsCount, icon: "Network", color: "from-emerald-500 to-teal-500" },
    { label: "Активных приглашений", value: pendingInvitesCount, icon: "Send", color: "from-blue-500 to-cyan-500" },
    { label: "Моя роль", value: ROLE_TITLES[org.my_role], icon: "Shield", color: "from-pink-500 to-rose-500" },
  ]

  return (
    <>
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

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 space-y-6">
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
              onClick={onInviteClick}
              className="bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
            >
              <Icon name="UserPlus" size={16} className="mr-2" />
              Пригласить сотрудника
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </div>
    </>
  )
}
