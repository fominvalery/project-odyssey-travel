import Icon from "@/components/ui/icon"
import { OfferDetail, CAT_LABEL, DEFAULT_IMG, REGULATION_KEYS } from "./ProjectDetailTypes"

interface ProjectDetailContentProps {
  offer: OfferDetail
  photos: string[]
  photoIdx: number
  onPhotoIdx: (i: number) => void
}

export function ProjectDetailContent({ offer, photos, photoIdx, onPhotoIdx }: ProjectDetailContentProps) {
  const ef = offer.extra_fields || {}
  const commission = ef.commission || offer.commission || ""
  const commissionNotes = ef.commission_notes || offer.commission_notes || ""
  const adRules = ef.ad_rules || ""
  const workRules = ef.work_rules || ""
  const hasRegulations = Boolean(commission || adRules || workRules)
  const charFields = Object.entries(ef).filter(([k]) => !REGULATION_KEYS.has(k))

  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Галерея */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
        <div className="relative h-72 bg-[#0d0d0d]">
          <img
            src={photos[photoIdx]}
            alt={offer.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG }}
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {CAT_LABEL[offer.category] || offer.category}
            </span>
            {offer.subtype && (
              <span className="bg-[#1a1a1a]/80 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                {offer.subtype}
              </span>
            )}
          </div>
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {photos.map((p, i) => (
              <button
                key={i}
                onClick={() => onPhotoIdx(i)}
                className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === photoIdx ? "border-blue-500" : "border-transparent"
                }`}
              >
                <img src={p} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMG }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Заголовок */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
        <h1 className="text-xl font-bold text-white mb-2">{offer.title}</h1>
        {(offer.city || offer.address) && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Icon name="MapPin" className="h-4 w-4 shrink-0" />
            {[offer.address, offer.city, offer.region].filter(Boolean).join(", ")}
          </div>
        )}
      </div>

      {/* Характеристики */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Характеристики</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {offer.area && (
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Площадь</div>
              <div className="text-sm font-medium text-white">{offer.area} м²</div>
            </div>
          )}
          {offer.yield_percent && (
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Доходность</div>
              <div className="text-sm font-medium text-emerald-400">{offer.yield_percent}%</div>
            </div>
          )}
          {offer.commission && !ef.commission && (
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Комиссия</div>
              <div className="text-sm font-medium text-white">{offer.commission}</div>
            </div>
          )}
          {charFields.map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-gray-500 mb-0.5 capitalize">{k}</div>
              <div className="text-sm font-medium text-white">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Описание */}
      {offer.description && (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Описание</h2>
          <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{offer.description}</p>
        </div>
      )}

      {/* Регламент для брокеров */}
      {hasRegulations && (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Регламент для брокеров</h2>

          {commission && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Percent" className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Комиссия</span>
              </div>
              <p className="text-sm text-white font-medium">{commission}</p>
              {commissionNotes && (
                <p className="text-xs text-gray-400 mt-1">{commissionNotes}</p>
              )}
            </div>
          )}

          {workRules && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="ClipboardList" className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Регламент работы</span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{workRules}</p>
            </div>
          )}

          {adRules && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Megaphone" className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Регламент рекламы</span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{adRules}</p>
            </div>
          )}
        </div>
      )}

      {/* Видео */}
      {offer.videos && offer.videos.length > 0 && (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Видео</h2>
          <div className="space-y-2">
            {offer.videos.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl hover:border-blue-500/40 transition-colors text-sm text-blue-400 hover:text-blue-300"
              >
                <Icon name="Play" className="h-4 w-4 shrink-0" />
                {url.length > 60 ? url.slice(0, 60) + "..." : url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
