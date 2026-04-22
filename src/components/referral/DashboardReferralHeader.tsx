import Icon from "@/components/ui/icon"
import { ReferralStats, LEVEL_BORDER, LEVEL_ICON_COLOR, ALL_LEVELS } from "./referralTypes"

interface Props {
  stats: ReferralStats | null
  loading: boolean
  refLink: string
  copied: boolean
  onCopy: () => void
}

export default function DashboardReferralHeader({ stats, loading, refLink, copied, onCopy }: Props) {
  const level = stats?.level
  const color = level?.color || "blue"
  const borderClass = LEVEL_BORDER[color] || LEVEL_BORDER.blue
  const iconClass = LEVEL_ICON_COLOR[color] || LEVEL_ICON_COLOR.blue

  return (
    <>
      {/* Текущий уровень */}
      <div className={`rounded-2xl border ${borderClass} bg-gradient-to-r to-[#0d0d0d] p-5 mb-6 flex items-start gap-4`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon name="Award" className="h-6 w-6" />
        </div>
        <div className="flex-1">
          {loading ? (
            <div className="h-5 w-32 bg-white/10 rounded animate-pulse mb-2" />
          ) : (
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span className="font-bold text-white text-lg">{level?.name || "—"}</span>
              {level?.level ? (
                <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-medium">
                  Уровень {level.level}
                </span>
              ) : null}
            </div>
          )}
          <p className="text-sm text-gray-300">
            Комиссия: {level?.commission1 || 5}% от платежей рефералов
            {(level?.commission2 ?? 0) > 0 && ` + ${level!.commission2}% (2-я линия)`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Вывод:{" "}
            {level?.withdrawal
              ? <span className="text-emerald-400">Доступен</span>
              : <span className="text-red-400">Недоступен</span>}
          </p>
        </div>
      </div>

      {/* Уровни */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {ALL_LEVELS.map((lvl) => {
          const isActive = level?.name === lvl.name
          return (
            <div key={lvl.name} className={`rounded-xl p-4 text-center border transition-all ${isActive ? "border-blue-500 bg-blue-500/10" : "border-[#1f1f1f] bg-[#111]"}`}>
              <p className={`text-xs font-semibold mb-1 ${isActive ? "text-blue-400" : "text-gray-400"}`}>{lvl.name}</p>
              <p className="text-xs text-gray-500 mb-2">{lvl.refs}</p>
              <p className={`text-xl font-bold ${isActive ? "text-white" : "text-gray-300"}`}>{lvl.percent}</p>
              {lvl.extra && <p className="text-xs text-violet-400">{lvl.extra}</p>}
              {lvl.withdrawal && <p className="text-xs text-emerald-400 mt-1">Вывод ✓</p>}
            </div>
          )
        })}
      </div>

      {/* Реферальная ссылка */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Ваша реферальная ссылка</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-sm text-gray-300 font-mono truncate">
            {refLink}
          </div>
          <button
            onClick={onCopy}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0 ${copied ? "bg-emerald-600 border-emerald-500" : "bg-[#1a1a1a] border-[#2a2a2a] hover:bg-blue-600"}`}
          >
            <Icon name={copied ? "Check" : "Copy"} className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </>
  )
}
