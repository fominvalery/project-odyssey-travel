import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { UUID_RE } from "./marketplaceData"
import type { MarketObject } from "./marketplaceData"

interface MarketplaceCardProps {
  obj: MarketObject
  onShare: (target: { id: string; title: string }) => void
}

export default function MarketplaceCard({ obj, onShare }: MarketplaceCardProps) {
  const isResort = obj.type === "Курортная"
  const ef = (obj as Record<string, unknown>).extra_fields as Record<string, string> | undefined
  const occupancy = ef?.occupancy ?? ""
  const avgCheck = ef?.avg_check ?? ""
  const units = ef?.units ?? ""

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-colors group ${
        isResort
          ? "bg-gradient-to-b from-[#0d1a1c] to-[#111] border border-cyan-900/40 hover:border-cyan-500/50"
          : "bg-[#111111] border border-[#1f1f1f] hover:border-blue-500/40"
      }`}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={obj.img}
          alt={obj.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {obj.badge && (
          <span className={`absolute top-3 left-3 ${obj.badgeColor} text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
            {obj.badge}
          </span>
        )}
        {isResort && obj.yield !== "—" && (
          <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-cyan-400 text-xs font-bold px-2.5 py-1 rounded-full border border-cyan-500/30">
            {obj.yield} доход
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <p className={`text-xs ${isResort ? "text-cyan-500/70" : "text-gray-500"}`}>{obj.type}</p>
          {(obj as Record<string, unknown>).subtype && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              isResort
                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400/70"
                : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400"
            }`}>
              {(obj as Record<string, unknown>).subtype as string}
            </span>
          )}
        </div>
        <h3 className="text-white font-semibold text-sm mb-2 leading-snug">{obj.title}</h3>
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
          <Icon name="MapPin" className={`h-3.5 w-3.5 ${isResort ? "text-cyan-500" : "text-violet-400"}`} />
          {obj.city}
        </div>

        {isResort && (occupancy || avgCheck || units) ? (
          <div className="flex gap-3 mb-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/15">
            {units && (
              <div className="text-center flex-1">
                <p className="text-white font-semibold text-sm">{units}</p>
                <p className="text-[10px] text-cyan-400/60">номеров</p>
              </div>
            )}
            {occupancy && (
              <div className="text-center flex-1 border-l border-cyan-500/20">
                <p className="text-white font-semibold text-sm">{occupancy}%</p>
                <p className="text-[10px] text-cyan-400/60">загрузка</p>
              </div>
            )}
            {avgCheck && (
              <div className="text-center flex-1 border-l border-cyan-500/20">
                <p className="text-white font-semibold text-sm">{Number(avgCheck).toLocaleString("ru")}₽</p>
                <p className="text-[10px] text-cyan-400/60">ср. чек</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-bold text-white">{obj.price}</p>
              <p className="text-xs text-gray-500">{obj.area}</p>
            </div>
            {obj.yield !== "—" && (
              <div className="text-right">
                <p className="text-green-400 font-semibold text-sm">{obj.yield}</p>
                <p className="text-xs text-gray-500">доходность</p>
              </div>
            )}
          </div>
        )}

        {isResort && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-base font-bold text-white">{obj.price}</p>
              <p className="text-xs text-gray-500">{obj.area}</p>
            </div>
            {obj.yield !== "—" && !occupancy && (
              <div className="text-right">
                <p className="text-cyan-400 font-semibold text-sm">{obj.yield}</p>
                <p className="text-xs text-gray-500">доходность</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {UUID_RE.test(String(obj.id)) ? (
            <Link to={`/object/${obj.id}`} className="flex-1">
              <Button className={`w-full rounded-xl text-white text-sm ${isResort ? "bg-cyan-600 hover:bg-cyan-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                Подробнее
              </Button>
            </Link>
          ) : (
            <Button disabled className="flex-1 rounded-xl bg-[#1a1a1a] text-gray-500 text-sm cursor-not-allowed">
              Демо-объект
            </Button>
          )}
          {UUID_RE.test(String(obj.id)) && (
            <button
              onClick={() => onShare({ id: String(obj.id), title: obj.title })}
              aria-label="Поделиться"
              className={`shrink-0 w-10 h-10 rounded-xl border bg-[#1a1a1a] flex items-center justify-center transition-colors ${
                isResort
                  ? "border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40"
                  : "border-[#262626] text-gray-300 hover:text-white hover:border-blue-500/40"
              }`}
            >
              <Icon name="Share2" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
