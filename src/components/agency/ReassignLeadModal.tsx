import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { Employee, ROLE_TITLES } from "@/lib/agencyApi"
import type { Lead } from "@/components/dashboard/LeadCard"

interface Props {
  lead: Lead
  employees: Employee[]
  currentUserId: string
  onReassign: (leadId: string, toUserId: string) => Promise<void>
  onClose: () => void
}

export default function ReassignLeadModal({ lead, employees, currentUserId, onReassign, onClose }: Props) {
  const [selectedUserId, setSelectedUserId] = useState("")
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  const available = employees.filter(e =>
    e.user_id !== lead.owner_id &&
    e.user_id !== currentUserId &&
    (
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
    )
  )

  async function handleReassign() {
    if (!selectedUserId) return
    setLoading(true)
    try {
      await onReassign(lead.id, selectedUserId)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const selectedEmployee = employees.find(e => e.user_id === selectedUserId)
  const currentOwner = employees.find(e => e.user_id === lead.owner_id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl flex flex-col" style={{ maxHeight: "85vh" }}>
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
          <div>
            <p className="font-semibold text-white flex items-center gap-2">
              <Icon name="ArrowRightLeft" size={16} className="text-blue-400" />
              Переназначить клиента
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">
              {lead.name}{lead.phone ? ` · ${lead.phone}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Объект лида */}
        {lead.object_title && (
          <div className="px-5 py-2.5 border-b border-[#1f1f1f] bg-[#0d0d0d]">
            <p className="text-[11px] text-gray-500 mb-1">Объект интереса</p>
            <p className="text-xs text-white flex items-center gap-1.5">
              <Icon name="Building2" size={12} className="text-blue-400" />
              {lead.object_title}
            </p>
          </div>
        )}

        {/* Текущий владелец */}
        {currentOwner && (
          <div className="px-5 py-3 border-b border-[#1f1f1f] bg-[#0d0d0d]">
            <p className="text-[11px] text-gray-500 mb-2 uppercase tracking-widest">Текущий ответственный</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {currentOwner.avatar_url && <AvatarImage src={currentOwner.avatar_url} />}
                <AvatarFallback className="bg-blue-500/30 text-blue-200 text-xs">
                  {currentOwner.full_name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-white font-medium">{currentOwner.full_name}</p>
                <p className="text-[11px] text-gray-500">{ROLE_TITLES[currentOwner.role_code]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Поиск */}
        <div className="px-5 py-3 border-b border-[#1f1f1f]">
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск сотрудника..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40"
            />
          </div>
        </div>

        {/* Список сотрудников */}
        <div className="overflow-y-auto flex-1">
          {available.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              <Icon name="Users" size={32} className="mx-auto mb-2 opacity-30" />
              Сотрудники не найдены
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {available.map(e => (
                <button
                  key={e.user_id}
                  onClick={() => setSelectedUserId(e.user_id === selectedUserId ? "" : e.user_id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                    selectedUserId === e.user_id
                      ? "bg-blue-500/10 border-l-2 border-blue-500"
                      : "hover:bg-white/5 border-l-2 border-transparent"
                  }`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    {e.avatar_url && <AvatarImage src={e.avatar_url} />}
                    <AvatarFallback className="bg-blue-500/20 text-blue-300 text-sm">
                      {e.full_name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{e.full_name}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {ROLE_TITLES[e.role_code]}
                    </p>
                  </div>
                  {selectedUserId === e.user_id && (
                    <Icon name="CheckCircle2" size={16} className="text-blue-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="px-5 py-4 border-t border-[#1f1f1f] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-[#1a1a1a] hover:bg-[#222] transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleReassign}
            disabled={!selectedUserId || loading}
            className="flex-1 py-2.5 rounded-xl text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Icon name="Loader2" size={14} className="animate-spin" />Передаём...</>
            ) : selectedEmployee ? (
              <><Icon name="ArrowRightLeft" size={14} />Передать {selectedEmployee.full_name.split(" ")[0]}</>
            ) : (
              "Выберите сотрудника"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
