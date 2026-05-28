import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { Offer, CAT_LABEL, STATUS_OPTS, STATUS_COLOR, formatPrice } from "./AggOffersTypes"

const DEFAULT_IMG = "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/755cddaf-8b60-449f-82bf-27fe2c9dab48.jpg"

const CAT_COLOR: Record<string, string> = {
  commercial:  "bg-violet-600",
  investment:  "bg-amber-600",
  resort:      "bg-cyan-600",
  auction:     "bg-green-600",
  residential: "bg-sky-600",
  newbuild:    "bg-blue-600",
  land:        "bg-lime-700",
  parking:     "bg-zinc-600",
}

interface Props {
  offers: Offer[]
  loading: boolean
  onEdit: (o: Offer) => void
  onAdd: () => void
  onDelete: (o: Offer) => void
}

export default function AggOffersTable({ offers, loading, onEdit, onAdd, onDelete }: Props) {
  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#111] border border-[#1f1f1f] rounded-2xl h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon name="FolderOpen" className="h-10 w-10 text-gray-700 mb-3" />
        <p className="text-gray-500">Предложений нет</p>
        <Button onClick={onAdd} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm">
          Добавить первое
        </Button>
      </div>
    )
  }

  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {offers.map(o => {
        const photo = o.photos?.[0] || DEFAULT_IMG
        const catColor = CAT_COLOR[o.category] ?? "bg-gray-600"
        const catLabel = CAT_LABEL[o.category] || o.category
        const statusOpt = STATUS_OPTS.find(s => s.id === o.status)
        const statusCls = STATUS_COLOR[o.status] ?? "text-gray-400 bg-gray-500/10"

        return (
          <div
            key={o.id}
            className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#3a3a3a] transition-all group flex flex-col"
          >
            {/* Фото */}
            <div
              className="relative h-44 overflow-hidden bg-[#0d0d0d] cursor-pointer"
              onClick={() => onEdit(o)}
            >
              <img
                src={photo}
                alt={o.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Бейдж категории */}
              <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                <span className={`${catColor} text-white text-[10px] font-semibold px-2.5 py-1 rounded-full`}>
                  {catLabel}
                </span>
                {o.yield_percent && (
                  <span className="bg-emerald-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    {o.yield_percent}% доход
                  </span>
                )}
              </div>

              {/* Статус */}
              <div className="absolute top-3 right-3">
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusCls}`}>
                  {statusOpt?.label ?? o.status}
                </span>
              </div>

              {/* PDF */}
              {o.presentation_url && (
                <button
                  className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm transition-colors"
                  onClick={e => { e.stopPropagation(); window.open(o.presentation_url, "_blank") }}
                >
                  <Icon name="FileDown" className="h-3 w-3" />
                  PDF
                </button>
              )}

              {/* Цена */}
              <div className="absolute bottom-3 left-3">
                <span className="text-sm font-bold text-white drop-shadow-lg">
                  {o.price_label || formatPrice(o.price ?? null)}
                </span>
              </div>
            </div>

            {/* Контент */}
            <div className="p-4 flex-1 flex flex-col gap-2 cursor-pointer" onClick={() => onEdit(o)}>
              <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">{o.title}</h3>
              {o.subtype && (
                <span className="text-[11px] text-gray-500">{o.subtype}</span>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-auto">
                {o.city && (
                  <>
                    <Icon name="MapPin" className="h-3 w-3 shrink-0" />
                    <span>{o.city}</span>
                  </>
                )}
                {o.area && (
                  <span className="ml-auto text-gray-600">{o.area} м²</span>
                )}
              </div>
            </div>

            {/* Действия */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => onEdit(o)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#222] transition-colors border border-[#2a2a2a]"
              >
                <Icon name="Pencil" className="h-3.5 w-3.5" />
                Редактировать
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(o) }}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-[#2a2a2a]"
              >
                <Icon name="Trash2" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
