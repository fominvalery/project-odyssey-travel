import Icon from "@/components/ui/icon"
import { ReferralStats, LEVEL_BORDER, LEVEL_ICON_COLOR, ALL_LEVELS } from "./referralTypes"

interface MyRatingData {
  rank: number
  total: number
  points: number
  deal_count: number
  active_listings: number
  lead_count: number
  months_on_platform: number
  profile_score: number
  profile_filled: number
  profile_total: number
  agent_status: string
  activity: string
}

interface Props {
  stats: ReferralStats | null
  loading: boolean
  refLink: string
  copied: boolean
  onCopy: () => void
  myRating?: MyRatingData | null
  ratingLoading?: boolean
}

const ACTIVITY_COLOR: Record<string, string> = {
  "Активен": "text-emerald-400",
  "Был недавно": "text-amber-400",
  "Неактивен": "text-red-400",
}

const ACTIVITY_DOT: Record<string, string> = {
  "Активен": "bg-emerald-400",
  "Был недавно": "bg-amber-400",
  "Неактивен": "bg-red-400",
}

export default function DashboardReferralHeader({ stats, loading, refLink, copied, onCopy, myRating, ratingLoading }: Props) {
  const level = stats?.level
  const color = level?.color || "blue"
  const borderClass = LEVEL_BORDER[color] || LEVEL_BORDER.blue
  const iconClass = LEVEL_ICON_COLOR[color] || LEVEL_ICON_COLOR.blue

  const activityLabel = myRating?.activity || ""
  const activityColor = ACTIVITY_COLOR[activityLabel] || "text-gray-400"
  const activityDot = ACTIVITY_DOT[activityLabel] || "bg-gray-400"

  return (
    <>
      {/* Текущий уровень + позиция в рейтинге */}
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
              {/* Позиция в рейтинге */}
              {!ratingLoading && myRating?.rank ? (
                <span className="text-xs bg-white/10 text-white px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Icon name="Trophy" size={10} className="text-amber-400" />
                  #{myRating.rank} из {myRating.total}
                </span>
              ) : ratingLoading ? (
                <span className="h-5 w-20 bg-white/10 rounded-full animate-pulse inline-block" />
              ) : null}
            </div>
          )}
          {activityLabel && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${activityDot}`} />
              <span className={`text-xs ${activityColor}`}>{activityLabel}</span>
            </div>
          )}
          {!ratingLoading && myRating ? (
            <p className="text-xs text-amber-400 mt-0.5 font-medium">
              ★ {myRating.points}
            </p>
          ) : null}
        </div>
      </div>

      {/* Уровни */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-6">
        {ALL_LEVELS.map((lvl) => {
          const isActive = level?.name === lvl.name
          return (
            <div key={lvl.name} className={`rounded-xl p-2.5 md:p-4 text-center border transition-all ${isActive ? "border-blue-500 bg-blue-500/10" : "border-[#1f1f1f] bg-[#111]"}`}>
              <p className={`text-xs font-semibold mb-0.5 ${isActive ? "text-blue-400" : "text-gray-400"}`}>{lvl.name}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{lvl.refs}</p>
            </div>
          )
        })}
      </div>

      {/* Блок показателей рейтинга */}
      {!ratingLoading && myRating ? (
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Ваши показатели</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
              <Icon name="Handshake" size={16} className="text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{myRating.deal_count}</p>
              <p className="text-[10px] text-gray-500">Сделок</p>
              <p className="text-[10px] text-blue-400">+{myRating.deal_count * 50}</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
              <Icon name="Building2" size={16} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{myRating.active_listings}</p>
              <p className="text-[10px] text-gray-500">Объявлений</p>
              <p className="text-[10px] text-emerald-400">+{myRating.active_listings * 5}</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
              <Icon name="Users" size={16} className="text-cyan-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{myRating.lead_count}</p>
              <p className="text-[10px] text-gray-500">Лидов</p>
              <p className="text-[10px] text-cyan-400">+{myRating.lead_count * 3}</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
              <Icon name="Clock" size={16} className="text-violet-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{myRating.months_on_platform}</p>
              <p className="text-[10px] text-gray-500">Месяцев</p>
              <p className="text-[10px] text-violet-400">+{myRating.months_on_platform}</p>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-3 text-center col-span-2">
              <Icon name="UserCheck" size={16} className="text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{myRating.profile_filled}<span className="text-xs text-gray-500">/{myRating.profile_total}</span></p>
              <p className="text-[10px] text-gray-500 mb-1.5">Профиль</p>
              <div className="w-full bg-[#1a1a1a] rounded-full h-1">
                <div
                  className="bg-amber-400 h-1 rounded-full transition-all"
                  style={{ width: `${Math.round((myRating.profile_filled / myRating.profile_total) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-amber-400 mt-1">+{myRating.profile_score}</p>
            </div>
          </div>
        </div>
      ) : ratingLoading ? (
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 mb-6">
          <div className="h-3 w-24 bg-white/10 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-[#0a0a0a] rounded-xl p-3 h-20 animate-pulse" />
            ))}
          </div>
        </div>
      ) : null}

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