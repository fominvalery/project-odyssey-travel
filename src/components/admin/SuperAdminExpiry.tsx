import { useEffect, useState } from "react"
import Icon from "@/components/ui/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import func2url from "../../../backend/func2url.json"

const ADMIN_URL = (func2url as Record<string, string>)["admin"]

interface Summary {
  total: number
  unlimited: number
  active_with_expiry: number
  expiring_soon: number
  requires_payment: number
  auto_unpublished: number
}

interface ObjRow {
  id: string
  title: string
  user_id: string | null
  user_email: string
  user_status: string
  expires_at: string | null
  requires_payment: boolean
  auto_unpublished: boolean
  published: boolean
}

interface Props {
  actorId: string
}

export default function SuperAdminExpiry({ actorId }: Props) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [objects, setObjects] = useState<ObjRow[]>([])
  const [downgradeUserId, setDowngradeUserId] = useState("")
  const [restoreUserId, setRestoreUserId] = useState("")
  const [setExpiryObjectId, setSetExpiryObjectId] = useState("")
  const [setExpiryDays, setSetExpiryDays] = useState("0")
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(`${ADMIN_URL}?action=expiry_status`, {
        headers: { "X-User-Id": actorId },
      })
      if (!r.ok) throw new Error(await r.text())
      const d = await r.json()
      setSummary(d.summary)
      setObjects(d.objects ?? [])
    } catch (e) {
      toast({ title: "Ошибка загрузки", description: String(e) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (actorId) load()
  }, [actorId])

  async function callAction(action: string, payload: Record<string, unknown> = {}) {
    setBusy(true)
    try {
      const r = await fetch(ADMIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": actorId },
        body: JSON.stringify({ action, ...payload }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || "ошибка")
      toast({ title: "Готово", description: d?.message || "Операция выполнена" })
      await load()
      return d
    } catch (e) {
      toast({ title: "Ошибка", description: String(e) })
    } finally {
      setBusy(false)
    }
  }

  async function runCron() {
    setBusy(true)
    try {
      const r = await fetch(ADMIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": actorId },
        body: JSON.stringify({ action: "run_cron" }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || "ошибка")
      const res = d?.result?.results || {}
      toast({
        title: "Cron выполнен",
        description: `Понижено: ${res.downgraded || 0}, снято: ${res.object_auto_unpublished || 0}, уведомлений: ${res.object_expiring_soon || 0}`,
      })
      await load()
    } catch (e) {
      toast({ title: "Ошибка cron", description: String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-start gap-3">
        <Icon name="FlaskConical" className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="text-amber-200 font-semibold mb-1">Тестовая панель сроков</p>
          <p className="text-amber-200/70">
            Используй для проверки логики автоматического срока размещения объявлений.
            Все действия — реальные изменения в БД, осторожно.
          </p>
        </div>
      </div>

      {/* Сводка */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatBox label="Всего" value={summary.total} icon="Building2" color="text-blue-400" />
          <StatBox label="Бессрочные" value={summary.unlimited} icon="Infinity" color="text-emerald-400" />
          <StatBox label="С сроком" value={summary.active_with_expiry} icon="Clock" color="text-violet-400" />
          <StatBox label="Истекают ≤3 дн." value={summary.expiring_soon} icon="AlertTriangle" color="text-yellow-400" />
          <StatBox label="Требуют оплаты" value={summary.requires_payment} icon="CreditCard" color="text-amber-400" />
          <StatBox label="Сняты автоматом" value={summary.auto_unpublished} icon="EyeOff" color="text-red-400" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={load} disabled={loading || busy} variant="outline" className="border-[#1f1f1f]">
          <Icon name="RefreshCw" className="h-4 w-4 mr-1.5" />
          Обновить
        </Button>
        <Button onClick={runCron} disabled={busy} className="bg-blue-600 hover:bg-blue-700">
          <Icon name="Play" className="h-4 w-4 mr-1.5" />
          Прогнать cron вручную
        </Button>
      </div>

      {/* Действия */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          icon="ArrowDownToLine"
          title="Симулировать понижение"
          desc="Перевести broker → basic. Топ-3 свежих объекта получат 30 дней, остальные — 3 дня + флаг оплаты. Если пользователь — член АН, объекты не урезаются."
        >
          <Input
            placeholder="user_id"
            value={downgradeUserId}
            onChange={(e) => setDowngradeUserId(e.target.value)}
            className="bg-[#0d0d0d] border-[#1f1f1f]"
          />
          <Button
            onClick={() => callAction("force_downgrade", { user_id: downgradeUserId.trim() })}
            disabled={busy || !downgradeUserId.trim()}
            className="w-full bg-red-600 hover:bg-red-700 mt-2"
          >
            Понизить тариф
          </Button>
        </ActionCard>

        <ActionCard
          icon="ArrowUpToLine"
          title="Восстановить Клуб"
          desc="Активировать тариф broker на 30 дней, сбросить срок у всех объектов."
        >
          <Input
            placeholder="user_id"
            value={restoreUserId}
            onChange={(e) => setRestoreUserId(e.target.value)}
            className="bg-[#0d0d0d] border-[#1f1f1f]"
          />
          <Button
            onClick={() => callAction("restore_broker", { user_id: restoreUserId.trim(), days: 30 })}
            disabled={busy || !restoreUserId.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2"
          >
            Восстановить Клуб
          </Button>
        </ActionCard>

        <ActionCard
          icon="Clock"
          title="Установить срок объекту"
          desc="Поставить expires_at = NOW + N дней. 0 = сейчас (для теста автоснятия). Отрицательное = в прошлом."
        >
          <Input
            placeholder="object_id"
            value={setExpiryObjectId}
            onChange={(e) => setSetExpiryObjectId(e.target.value)}
            className="bg-[#0d0d0d] border-[#1f1f1f]"
          />
          <Input
            type="number"
            placeholder="дней (0 = сейчас, -1 = вчера)"
            value={setExpiryDays}
            onChange={(e) => setSetExpiryDays(e.target.value)}
            className="bg-[#0d0d0d] border-[#1f1f1f] mt-2"
          />
          <Button
            onClick={() => callAction("set_expiry", {
              object_id: setExpiryObjectId.trim(),
              days: parseInt(setExpiryDays || "0", 10),
            })}
            disabled={busy || !setExpiryObjectId.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 mt-2"
          >
            Установить срок
          </Button>
        </ActionCard>
      </div>

      {/* Список объектов с особыми статусами */}
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
          <span className="font-semibold">Объекты со сроком / флагами</span>
          <span className="text-xs text-gray-500">показано {objects.length}</span>
        </div>
        {objects.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {loading ? "Загрузка..." : "Объектов с особыми флагами нет"}
          </div>
        ) : (
          <div className="divide-y divide-[#1f1f1f]">
            {objects.map((o) => (
              <div key={o.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{o.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {o.user_email || "—"} ({o.user_status || "—"}) · id: <span className="font-mono">{o.id.slice(0, 8)}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {o.expires_at && (
                    <span className="text-xs text-violet-300">
                      до {new Date(o.expires_at).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                  <div className="flex gap-1">
                    {o.requires_payment && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        требует оплаты
                      </span>
                    )}
                    {o.auto_unpublished && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30">
                        снят автоматом
                      </span>
                    )}
                    {!o.published && !o.auto_unpublished && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/15 text-gray-300 border border-gray-500/30">
                        не опубликован
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(o.id)
                    toast({ title: "ID скопирован" })
                  }}
                  className="p-2 text-gray-500 hover:text-white"
                  title="Скопировать id"
                >
                  <Icon name="Copy" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] p-3">
      <Icon name={icon as "Clock"} className={`h-4 w-4 ${color} mb-2`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  )
}

function ActionCard({
  icon,
  title,
  desc,
  children,
}: {
  icon: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon name={icon as "Clock"} className="h-4 w-4 text-blue-400" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">{desc}</p>
      {children}
    </div>
  )
}
