import Icon from "@/components/ui/icon"
import { ObjectDetailData, FIELD_LABELS } from "./types"

interface ObjectGalleryProps {
  obj: ObjectDetailData
  activePhoto: number
  setActivePhoto: (i: number) => void
}

export default function ObjectGallery({ obj, activePhoto, setActivePhoto }: ObjectGalleryProps) {
  const photos = obj.photos?.length ? obj.photos : []
  const extra = obj.extra_fields ?? {}
  const extraKeys = Object.keys(extra).filter(k => extra[k] && extra[k].toString().trim())

  return (
    <div className="lg:col-span-2">
      {/* Галерея */}
      <div className="rounded-2xl overflow-hidden bg-[#111] border border-[#1f1f1f] mb-4">
        {photos.length > 0 ? (
          <img
            src={photos[activePhoto]}
            alt={obj.title}
            className="w-full h-[260px] sm:h-[400px] object-cover"
          />
        ) : (
          <div className="w-full h-[260px] sm:h-[400px] flex items-center justify-center">
            <Icon name="Building2" className="h-20 w-20 text-gray-700" />
          </div>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto mb-8 pb-2">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActivePhoto(i)}
              className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                i === activePhoto ? "border-blue-500" : "border-transparent hover:border-[#333]"
              }`}
            >
              <img src={p} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Заголовок / адрес */}
      <div className="mb-6">
        <p className="text-sm text-blue-400 mb-2">{obj.type}</p>
        <h1 className="text-3xl font-bold mb-3">{obj.title}</h1>
        <div className="flex items-center gap-2 text-gray-400">
          <Icon name="MapPin" className="h-4 w-4 text-violet-400" />
          <span>{[obj.city, obj.address].filter(Boolean).join(", ") || "Адрес не указан"}</span>
        </div>
      </div>

      {/* Характеристики */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Характеристики</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {obj.area && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Площадь</p>
              <p className="font-medium">{obj.area} м²</p>
            </div>
          )}
          {obj.yield_percent && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Доходность</p>
              <p className="font-medium text-emerald-400">{obj.yield_percent}%</p>
            </div>
          )}
          {extraKeys.map(k => (
            <div key={k}>
              <p className="text-xs text-gray-500 mb-1">{FIELD_LABELS[k] ?? k}</p>
              <p className="font-medium">{extra[k]}</p>
            </div>
          ))}
          {obj.area === "" && !obj.yield_percent && extraKeys.length === 0 && (
            <p className="text-gray-500 text-sm col-span-full">Характеристики не заполнены</p>
          )}
        </div>
      </div>

      {/* Описание */}
      {obj.description && (
        <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
          <h2 className="text-lg font-semibold mb-3">Описание</h2>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{obj.description}</p>
        </div>
      )}
    </div>
  )
}
