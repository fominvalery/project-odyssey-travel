import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { InviteRow, OrgSummary, ROLE_TITLES, RoleCode } from "@/lib/agencyApi"
import { toast } from "@/hooks/use-toast"

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

export function AgencyInvitesTab({ invites }: { invites: InviteRow[] }) {
  return (
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
  )
}

export function AgencyAboutTab({
  org,
}: {
  org: OrgSummary & { my_role: RoleCode }
}) {
  return (
    <Card className="bg-white/5 border-white/10 p-6 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow label="Название" value={org.name} />
        <InfoRow label="ИНН" value={org.inn || "—"} />
        <InfoRow label="Моя роль" value={ROLE_TITLES[org.my_role]} />
        <InfoRow label="Описание" value={org.description || "—"} />
      </div>
    </Card>
  )
}
