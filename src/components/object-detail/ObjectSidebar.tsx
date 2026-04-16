import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { ObjectDetailData } from "./types"

interface ObjectSidebarProps {
  obj: ObjectDetailData
  showContacts: boolean
  setShowContacts: (v: boolean) => void
  onShareClick: () => void
}

export default function ObjectSidebar({
  obj,
  showContacts,
  setShowContacts,
  onShareClick,
}: ObjectSidebarProps) {
  return (
    <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
      <p className="text-xs text-gray-500 mb-1">Стоимость</p>
      <p className="text-3xl font-bold mb-6">{obj.price ? `${obj.price} ₽` : "По запросу"}</p>

      {obj.owner && (
        <div className="border-t border-[#1f1f1f] pt-5 mb-5">
          <p className="text-xs text-gray-500 mb-3">Владелец</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-blue-900/30 flex items-center justify-center overflow-hidden shrink-0">
              {obj.owner.avatar_url ? (
                <img src={obj.owner.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="User" className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{obj.owner.name || "Владелец"}</p>
              {obj.owner.company && (
                <p className="text-xs text-gray-400 truncate">{obj.owner.company}</p>
              )}
            </div>
          </div>

          {showContacts && obj.owner.phone ? (
            <a
              href={`tel:${obj.owner.phone}`}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-medium transition-colors"
            >
              <Icon name="Phone" className="h-4 w-4" />
              {obj.owner.phone}
            </a>
          ) : (
            <Button
              onClick={() => setShowContacts(true)}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3"
              disabled={!obj.owner.phone}
            >
              <Icon name="Phone" className="h-4 w-4 mr-2" />
              {obj.owner.phone ? "Показать телефон" : "Контакты не указаны"}
            </Button>
          )}
        </div>
      )}

      <button
        onClick={onShareClick}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] py-2.5 text-sm transition-colors"
      >
        <Icon name="Share2" className="h-4 w-4" />
        Поделиться
      </button>
    </div>
  )
}
