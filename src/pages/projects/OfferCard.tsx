import { Badge } from "@/components/ui/badge"
import Icon from "@/components/ui/icon"
import { Offer, CAT_COLOR, CAT_LABEL, DEFAULT_IMG, formatPrice } from "./projectsConstants"

interface Props {
  offer: Offer
  onOpen: () => void
}

export default function OfferCard({ offer, onOpen }: Props) {
  const color = CAT_COLOR[offer.category] ?? "bg-gray-600"
  const label = CAT_LABEL[offer.category] ?? offer.category
  const photo = offer.photos?.[0] || DEFAULT_IMG
  const commission = offer.extra_fields?.commission || offer.commission || ""

  return (
    <div
      className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all cursor-pointer group"
      onClick={onOpen}
    >
      <div className="relative h-48 overflow-hidden bg-[#0d0d0d]">
        <img
          src={photo}
          alt={offer.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`${color} text-white text-[10px] font-semibold px-2.5 py-1 rounded-full`}>
            {label}
          </span>
          {offer.yield_percent && (
            <span className="bg-emerald-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              {offer.yield_percent}% доход
            </span>
          )}
        </div>

        {offer.presentation_url && (
          <button
            className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm transition-colors"
            onClick={e => { e.stopPropagation(); window.open(offer.presentation_url, "_blank") }}
          >
            <Icon name="FileDown" className="h-3 w-3" />
            PDF
          </button>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="text-base font-bold text-white drop-shadow-lg">
            {offer.price_label || formatPrice(offer.price ?? null)}
          </div>
          {offer.area && offer.category !== "investment" && (
            <div className="text-xs text-gray-300 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {offer.area} м²
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2 leading-snug">{offer.title}</h3>
        <div className="flex items-center justify-between">
          {offer.city ? (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Icon name="MapPin" className="h-3 w-3" />
              {offer.city}
            </span>
          ) : <span />}
          {commission && (
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px] shrink-0">
              {commission}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}