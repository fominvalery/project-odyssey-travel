import { RefObject } from "react"
import { AdminUser } from "@/lib/superadminApi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { STATUS_LABELS } from "@/hooks/useAuth"
import { STATUS_COLORS, LEVEL_COLORS, LEVELS, UsersFilter } from "./constants"

interface Props {
  users: AdminUser[]
  filteredUsers: AdminUser[]
  search: string
  setSearch: (v: string) => void
  usersLoading: boolean
  updatingId: string | null
  verifyingId: string | null
  levelDropdown: string | null
  setLevelDropdown: (v: string | null) => void
  levelDropdownRef: RefObject<HTMLDivElement>
  statusDropdown: string | null
  setStatusDropdown: (v: string | null) => void
  statusDropdownRef: RefObject<HTMLDivElement>
  usersFilter: UsersFilter
  setUsersFilter: (v: UsersFilter) => void
  unverifiedCount: number
  handleSearch: (e: React.FormEvent) => void
  changeStatus: (targetId: string, status: "basic" | "broker" | "agency") => void
  changeLevel: (targetId: string, levelName: string) => void
  verifyEmailManually: (targetId: string, email: string) => void
  deleteUser: (targetId: string, name: string, email: string) => void
}

const STATUSES = [
  { id: "basic",  label: "Базовый" },
  { id: "broker", label: "Клуб" },
  { id: "agency", label: "Агентство" },
] as const

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function SuperAdminUsersTab(props: Props) {
  const {
    users, filteredUsers, search, setSearch, usersLoading, updatingId, verifyingId,
    levelDropdown, setLevelDropdown, levelDropdownRef,
    statusDropdown, setStatusDropdown, statusDropdownRef,
    usersFilter, setUsersFilter,
    unverifiedCount, handleSearch, changeStatus, changeLevel, verifyEmailManually, deleteUser,
  } = props

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email, имени или телефону"
            className="pl-9 bg-[#0d0d0d] border-[#1f1f1f] text-white" />
        </div>
        <Button type="submit" disabled={usersLoading}>
          {usersLoading ? <Icon name="Loader2" size={14} className="animate-spin" /> : "Найти"}
        </Button>
      </form>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setUsersFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            usersFilter === "all"
              ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
              : "border-[#2a2a2a] text-gray-500 hover:text-white hover:border-gray-500"
          }`}>
          Все ({users.length})
        </button>
        <button
          onClick={() => setUsersFilter("unverified")}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all flex items-center gap-1.5 ${
            usersFilter === "unverified"
              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
              : "border-[#2a2a2a] text-gray-500 hover:text-white hover:border-gray-500"
          }`}>
          <Icon name="MailWarning" size={12} />
          Незавершённая регистрация
          {unverifiedCount > 0 && (
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0 rounded-full">{unverifiedCount}</span>
          )}
        </button>
      </div>

      <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] overflow-hidden">
        {usersLoading && users.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />Загрузка…
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Icon name={usersFilter === "unverified" ? "CheckCircle2" : "Users"} size={20} className="mx-auto mb-2 opacity-50" />
            {usersFilter === "unverified" ? "Все пользователи подтвердили email" : "Пользователей не найдено"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0a0a] text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Пользователь</th>
                  <th className="px-4 py-3 text-left font-medium">Контакты</th>
                  <th className="px-4 py-3 text-left font-medium">Статус</th>
                  <th className="px-4 py-3 text-left font-medium">Уровень</th>
                  <th className="px-4 py-3 text-left font-medium">Регистрация</th>
                  <th className="px-4 py-3 text-left font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-[#1f1f1f] hover:bg-[#111]">

                    {/* Пользователь */}
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-1.5">
                        {u.name || "—"}
                        {u.is_superadmin && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase font-bold">Админ</span>
                        )}
                      </div>
                      {u.company && <div className="text-xs text-gray-500">{u.company}</div>}
                    </td>

                    {/* Контакты */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-300 flex items-center gap-1.5 flex-wrap">
                        <span>{u.email}</span>
                        {!u.email_verified && (
                          <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase font-semibold flex items-center gap-1">
                            <Icon name="MailWarning" size={10} />
                            не подтв.
                          </span>
                        )}
                      </div>
                      {u.phone && <div className="text-xs text-gray-500">{u.phone}</div>}
                      {!u.email_verified && (
                        <button
                          onClick={() => verifyEmailManually(u.id, u.email)}
                          disabled={verifyingId === u.id}
                          className="mt-1.5 text-[11px] px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 disabled:opacity-50">
                          {verifyingId === u.id
                            ? <Icon name="Loader2" size={10} className="animate-spin" />
                            : <Icon name="CheckCircle2" size={10} />}
                          Подтвердить email
                        </button>
                      )}
                    </td>

                    {/* Статус — dropdown */}
                    <td className="px-4 py-3">
                      <div className="relative" ref={statusDropdown === u.id ? statusDropdownRef : undefined}>
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => setStatusDropdown(statusDropdown === u.id ? null : u.id)}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 transition-all hover:opacity-80 ${
                            STATUS_COLORS[u.status] || STATUS_COLORS.basic
                          } ${updatingId === u.id ? "opacity-50" : ""}`}>
                          {updatingId === u.id
                            ? <Icon name="Loader2" size={10} className="animate-spin" />
                            : (STATUS_LABELS[u.status as keyof typeof STATUS_LABELS] || u.status)}
                          <Icon name="ChevronDown" size={10} />
                        </button>
                        {statusDropdown === u.id && (
                          <div className="absolute z-50 top-full mt-1 left-0 w-40 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
                            {STATUSES.map((s) => (
                              <button key={s.id} onClick={() => { changeStatus(u.id, s.id); setStatusDropdown(null) }}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#1f1f1f] transition-colors ${u.status === s.id ? "bg-[#1a1a1a]" : ""}`}>
                                <span className={`font-medium ${
                                  s.id === "basic" ? "text-emerald-300" : s.id === "broker" ? "text-blue-300" : "text-violet-300"
                                }`}>{s.label}</span>
                                {u.status === s.id && <Icon name="Check" size={12} className="text-blue-400 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Уровень — dropdown */}
                    <td className="px-4 py-3">
                      <div className="relative" ref={levelDropdown === u.id ? levelDropdownRef : undefined}>
                        <button disabled={updatingId === u.id}
                          onClick={() => setLevelDropdown(levelDropdown === u.id ? null : u.id)}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 transition-all hover:opacity-80 ${
                            LEVEL_COLORS[u.referral_level?.color] || LEVEL_COLORS.blue
                          } ${updatingId === u.id ? "opacity-50" : ""}`}>
                          {updatingId === u.id
                            ? <Icon name="Loader2" size={10} className="animate-spin" />
                            : (u.referral_level?.name || "Друг")}
                          <Icon name="ChevronDown" size={10} />
                        </button>
                        {u.referral_count > 0 && <span className="text-[10px] text-gray-500 pl-1 block">{u.referral_count} реф.</span>}
                        {levelDropdown === u.id && (
                          <div className="absolute z-50 top-full mt-1 left-0 w-44 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
                            {LEVELS.map((lvl) => (
                              <button key={lvl.name} onClick={() => changeLevel(u.id, lvl.name)}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#1f1f1f] transition-colors ${u.referral_level?.name === lvl.name ? "bg-[#1a1a1a]" : ""}`}>
                                <span className={`font-medium ${lvl.color === "blue" ? "text-blue-300" : lvl.color === "emerald" ? "text-emerald-300" : lvl.color === "violet" ? "text-violet-300" : lvl.color === "amber" ? "text-amber-300" : "text-rose-300"}`}>{lvl.name}</span>
                                {u.referral_level?.name === lvl.name && <Icon name="Check" size={12} className="text-blue-400 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Дата регистрации */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDate(u.created_at)}
                    </td>

                    {/* Удаление */}
                    <td className="px-2 py-3">
                      {!u.is_superadmin && (
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => deleteUser(u.id, u.name, u.email)}
                          title="Удалить аккаунт"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 disabled:opacity-30 p-1 rounded"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
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