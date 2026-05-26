import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { OfferDetail, formatPrice } from "./ProjectDetailTypes"

interface ProjectDetailSidebarProps {
  offer: OfferDetail
  managerName: string
  managerPhone: string
  managerEmail: string
  hasManager: boolean
  onFixDialog: () => void
  onContactDialog: () => void
  onNavigateFixations: () => void
}

export function ProjectDetailSidebar({
  offer,
  managerName,
  managerPhone,
  managerEmail,
  hasManager,
  onFixDialog,
  onContactDialog,
  onNavigateFixations,
}: ProjectDetailSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Цена */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5">
        <div className="text-2xl font-bold text-white mb-1">
          {offer.price_label || formatPrice(offer.price ?? null)}
        </div>
        {offer.area && offer.price && (
          <div className="text-xs text-gray-500">
            {Math.round(offer.price / offer.area).toLocaleString("ru")} ₽/м²
          </div>
        )}
      </div>

      {/* Действия */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-5 space-y-3">
        {offer.presentation_url && (
          <Button
            className="w-full bg-white text-black hover:bg-gray-100 font-semibold"
            onClick={() => window.open(offer.presentation_url, "_blank")}
          >
            <Icon name="FileDown" className="h-4 w-4 mr-2" />
            Скачать презентацию
          </Button>
        )}

        {/* Фиксация клиента */}
        <Button
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
          onClick={onFixDialog}
        >
          <Icon name="BookmarkPlus" className="h-4 w-4 mr-2" />
          Зафиксировать клиента
        </Button>

        {/* Связаться с менеджером */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          onClick={onContactDialog}
          disabled={!hasManager}
        >
          <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
          Связаться с менеджером
        </Button>

        <button
          onClick={onNavigateFixations}
          className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
        >
          Мои фиксации →
        </button>
      </div>

      {/* Карточка менеджера (если данные есть) */}
      {hasManager && (
        <div className="bg-[#111] border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="UserCheck" className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Менеджер проекта</span>
          </div>
          {managerName && (
            <p className="text-sm font-semibold text-white mb-2">{managerName}</p>
          )}
          <div className="space-y-1.5">
            {managerPhone && (
              <a
                href={`tel:${managerPhone}`}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Icon name="Phone" className="h-3.5 w-3.5" />
                {managerPhone}
              </a>
            )}
            {managerEmail && (
              <a
                href={`mailto:${managerEmail}`}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                <Icon name="Mail" className="h-3.5 w-3.5" />
                {managerEmail}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
