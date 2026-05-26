import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Icon from "@/components/ui/icon"
import { AdminFixation, STATUSES, STATUS_MAP, daysLeft } from "./fixations-types"

export default function FixCard({
  fix,
  onStatusChange,
  updating,
  onClick,
}: {
  fix: AdminFixation
  onStatusChange: (id: string, status: string) => void
  updating: string | null
  onClick: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dl = daysLeft(fix.expires_at)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  const openMenu = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const menuHeight = STATUSES.length * 32
      const top = spaceBelow >= menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4
      setMenuPos({ top, left: rect.left, width: rect.width })
    }
    setMenuOpen(v => !v)
  }

  return (
    <div
      className="bg-[#111] border border-[#1f1f1f] rounded-xl p-3 space-y-2 hover:border-[#2a2a2a] transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="text-white text-sm font-medium line-clamp-2 leading-tight">
        {fix.offer_title || "Объект"}
      </div>
      {fix.city && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Icon name="MapPin" className="h-3 w-3" />
          {fix.city}
        </div>
      )}

      <div className="pt-1.5 border-t border-[#1a1a1a]">
        <div className="text-xs text-gray-300 font-medium">{fix.client_name || "—"}</div>
        {fix.client_phone && <div className="text-xs text-gray-500">{fix.client_phone}</div>}
      </div>

      {(fix.broker_name || fix.dept_name) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Icon name="User" className="h-3 w-3 shrink-0" />
          <span className="truncate">{fix.broker_name || "—"}</span>
          {fix.dept_name && <span className="text-gray-700 shrink-0 text-[10px]">· {fix.dept_name}</span>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{new Date(fix.created_at).toLocaleDateString("ru-RU")}</span>
        {dl.text && <span className={`text-xs ${dl.warn ? "text-red-400" : "text-gray-500"}`}>{dl.text}</span>}
      </div>

      <div ref={ref} onClick={e => e.stopPropagation()}>
        <button
          ref={btnRef}
          onClick={openMenu}
          disabled={updating === fix.id}
          className="w-full flex items-center justify-between gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors bg-[#0d0d0d] border-[#2a2a2a] hover:border-[#3a3a3a]"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {updating === fix.id
              ? <Icon name="Loader2" className="h-3 w-3 animate-spin text-gray-400" />
              : <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_MAP[fix.status]?.dot || "bg-gray-500"}`} />
            }
            <span className={`truncate ${STATUS_MAP[fix.status]?.color || "text-gray-400"}`}>
              {STATUS_MAP[fix.status]?.label || fix.status}
            </span>
          </div>
          <Icon name="ChevronDown" className="h-3 w-3 text-gray-600 shrink-0" />
        </button>
        {menuOpen && createPortal(
          <div
            style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 9999 }}
            className="bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden"
          >
            {STATUSES.map(s => (
              <button
                key={s.id}
                onClick={() => { onStatusChange(fix.id, s.id); setMenuOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#1f1f1f] transition-colors ${fix.status === s.id ? "bg-[#1a1a1a]" : ""}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                <span className={s.color}>{s.label}</span>
                {fix.status === s.id && <Icon name="Check" className="h-3 w-3 text-gray-500 ml-auto" />}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
