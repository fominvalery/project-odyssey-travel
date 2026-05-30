import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { Offer, CAT_COLOR, CAT_LABEL, DEFAULT_IMG, formatPrice } from "./projectsConstants"

interface Props {
  offer: Offer
  onOpen: () => void
}

const SHARES_SUBTYPES = [
  "Доля в ООО / бизнесе",
  "Акции / Ценные бумаги",
  "Займ с фиксированной доходностью",
  "Облигации",
  "Коллективная покупка объекта",
]

export default function OfferCard({ offer, onOpen }: Props) {
  const color = CAT_COLOR[offer.category] ?? "bg-gray-600"
  const label = CAT_LABEL[offer.category] ?? offer.category
  const photo = offer.photos?.[0] || DEFAULT_IMG
  const commissionRaw = offer.extra_fields?.commission || offer.commission || ""
  const commission = commissionRaw ? (commissionRaw.includes("%") ? commissionRaw : `${commissionRaw}%`) : ""
  const ef = offer.extra_fields || {}
  const isShares = SHARES_SUBTYPES.includes(offer.subtype ?? "")
  const entryPrice = ef.entry_price || ef.min_investment || ""

  return (
    <div
      className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-blue-500/40 transition-colors group cursor-pointer"
      onClick={onOpen}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={photo}
          alt={offer.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG }}
        />

        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={`${color} text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
            {label}
          </span>
          {isShares && (
            <span className="bg-violet-600/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Icon name="PieChart" className="h-3 w-3" />
              Доли / Акции
            </span>
          )}
        </div>

        {offer.yield_percent && (
          <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/30">
            {offer.yield_percent}% доход
          </span>
        )}

        {offer.presentation_url && (
          <button
            className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm transition-colors"
            onClick={e => { e.stopPropagation(); window.open(offer.presentation_url, "_blank") }}
          >
            <Icon name="FileDown" className="h-3 w-3" />
            PDF
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-gray-500">{label}</p>
          {offer.subtype && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[#1a1a1a] border-[#2a2a2a] text-gray-400">
              {offer.subtype}
            </span>
          )}
        </div>

        <h3 className="text-white font-semibold text-sm mb-2 leading-snug line-clamp-2">{offer.title}</h3>

        {offer.city && (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
            <Icon name="MapPin" className="h-3.5 w-3.5 text-violet-400" />
            {offer.city}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-white">
              {offer.price_label || (offer.price ? `${Number(offer.price).toLocaleString("ru")} ₽` : "—")}
            </p>
            {isShares && entryPrice ? (
              <p className="text-xs text-gray-500">порог входа от {entryPrice} ₽</p>
            ) : offer.area && offer.category !== "investment" ? (
              <p className="text-xs text-gray-500">{offer.area} м²</p>
            ) : null}
          </div>
          {commission && (
            <div className="text-right">
              <p className="text-emerald-400 font-semibold text-sm">{commission}</p>
              <p className="text-xs text-gray-500">комиссия</p>
            </div>
          )}
        </div>

        <Button
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm"
          onClick={e => { e.stopPropagation(); onOpen() }}
        >
          Подробнее
        </Button>
      </div>
    </div>
  )
}