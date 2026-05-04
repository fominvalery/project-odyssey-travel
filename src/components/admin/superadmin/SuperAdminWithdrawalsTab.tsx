import { AdminWithdrawal, AdminWithdrawalsResponse } from "@/lib/superadminApi"
import Icon from "@/components/ui/icon"
import { WITHDRAWAL_STATUS_COLORS } from "./constants"

interface Props {
  withdrawalsData: AdminWithdrawalsResponse | null
  withdrawalsLoading: boolean
  statusFilter: string
  updatingWithdrawalId: number | null
  handleFilterChange: (f: string) => void
  loadWithdrawals: (filter?: string) => void
  changeWithdrawalStatus: (requestId: number, status: string) => void
}

export default function SuperAdminWithdrawalsTab(props: Props) {
  const {
    withdrawalsData, withdrawalsLoading, statusFilter, updatingWithdrawalId,
    handleFilterChange, loadWithdrawals, changeWithdrawalStatus,
  } = props

  return (
    <div>
      {/* Статистика */}
      {withdrawalsData?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "На рассмотрении", value: withdrawalsData.stats.pending,    color: "text-amber-300",   icon: "Clock" },
            { label: "Одобрено",         value: withdrawalsData.stats.approved,   color: "text-blue-300",    icon: "CheckCircle" },
            { label: "Выплачено",        value: withdrawalsData.stats.paid,       color: "text-emerald-300", icon: "Banknote" },
            { label: "Итого выплачено",  value: `${withdrawalsData.stats.total_paid.toLocaleString("ru-RU")} ₽`, color: "text-white", icon: "DollarSign" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] p-4">
              <Icon name={s.icon as "Clock"} size={14} className={`${s.color} mb-2`} />
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Фильтр */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: "",         label: "Все" },
          { value: "pending",  label: "На рассмотрении" },
          { value: "approved", label: "Одобрены" },
          { value: "paid",     label: "Выплачены" },
          { value: "rejected", label: "Отклонены" },
        ].map((f) => (
          <button key={f.value} onClick={() => handleFilterChange(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === f.value ? "bg-blue-600 text-white border-blue-500" : "border-[#2a2a2a] text-gray-400 hover:text-white hover:border-gray-500"
            }`}>
            {f.label}
          </button>
        ))}
        <button onClick={() => loadWithdrawals(statusFilter)} className="ml-auto px-3 py-1.5 rounded-lg text-xs border border-[#2a2a2a] text-gray-400 hover:text-white flex items-center gap-1">
          <Icon name="RefreshCw" size={12} />
          Обновить
        </button>
      </div>

      <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden">
        {withdrawalsLoading ? (
          <div className="p-10 text-center text-gray-500">
            <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />Загрузка…
          </div>
        ) : !withdrawalsData?.requests?.length ? (
          <div className="p-10 text-center text-gray-500">
            <Icon name="Inbox" size={20} className="mx-auto mb-2 opacity-50" />Заявок нет
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0a0a] text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Пользователь</th>
                  <th className="px-4 py-3 text-left font-medium">Реквизиты</th>
                  <th className="px-4 py-3 text-left font-medium">Сумма</th>
                  <th className="px-4 py-3 text-left font-medium">Дата</th>
                  <th className="px-4 py-3 text-left font-medium">Статус</th>
                  <th className="px-4 py-3 text-right font-medium">Действие</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalsData.requests.map((w: AdminWithdrawal) => (
                  <tr key={w.id} className="border-t border-[#1f1f1f] hover:bg-[#111]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{w.user_name || "—"}</div>
                      <div className="text-xs text-gray-500">{w.user_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium">{w.entity_label} · {w.full_name}</div>
                      <div className="text-xs text-gray-500">ИНН: {w.inn}</div>
                      {w.bank_name && <div className="text-xs text-gray-600">{w.bank_name} · {w.account}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {w.amount != null
                        ? <span className="font-semibold text-white">{w.amount.toLocaleString("ru-RU")} ₽</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {w.created_at ? new Date(w.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${WITHDRAWAL_STATUS_COLORS[w.status] || WITHDRAWAL_STATUS_COLORS.pending}`}>
                        {w.status_label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end flex-wrap">
                        {w.status === "pending" && (
                          <>
                            <button disabled={updatingWithdrawalId === w.id}
                              onClick={() => changeWithdrawalStatus(w.id, "approved")}
                              className="text-xs px-2.5 py-1 rounded-lg border border-blue-500/40 text-blue-300 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                              Одобрить
                            </button>
                            <button disabled={updatingWithdrawalId === w.id}
                              onClick={() => changeWithdrawalStatus(w.id, "rejected")}
                              className="text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                              Отклонить
                            </button>
                          </>
                        )}
                        {w.status === "approved" && (
                          <button disabled={updatingWithdrawalId === w.id}
                            onClick={() => changeWithdrawalStatus(w.id, "paid")}
                            className="text-xs px-2.5 py-1 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center gap-1">
                            <Icon name="Check" size={10} />
                            Выплачено
                          </button>
                        )}
                        {(w.status === "paid" || w.status === "rejected") && (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                        {updatingWithdrawalId === w.id && (
                          <Icon name="Loader2" size={14} className="animate-spin text-gray-400" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
