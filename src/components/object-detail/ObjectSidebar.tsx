import { useState } from "react"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { ObjectDetailData } from "./types"
import { RegisterModal } from "@/components/RegisterModal"

interface ObjectSidebarProps {
  obj: ObjectDetailData
  showContacts: boolean
  setShowContacts: (v: boolean) => void
  onShareClick: () => void
  onChatClick: () => void
  isAuthenticated?: boolean
}

export default function ObjectSidebar({
  obj,
  showContacts,
  setShowContacts,
  onShareClick,
  onChatClick,
  isAuthenticated = false,
}: ObjectSidebarProps) {
  const [registerOpen, setRegisterOpen] = useState(false)

  const handleShowPhone = () => {
    if (!isAuthenticated) {
      setRegisterOpen(true)
      return
    }
    setShowContacts(true)
  }
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

          {showContacts && obj.owner.phone && isAuthenticated ? (
            <a
              href={`tel:${obj.owner.phone}`}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-medium transition-colors mb-2"
            >
              <Icon name="Phone" className="h-4 w-4" />
              {obj.owner.phone}
            </a>
          ) : (
            <Button
              onClick={handleShowPhone}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 mb-2"
              disabled={!obj.owner.phone}
            >
              <Icon name="Phone" className="h-4 w-4 mr-2" />
              {!obj.owner.phone
                ? "Контакты не указаны"
                : !isAuthenticated
                ? "Показать телефон"
                : "Показать телефон"}
            </Button>
          )}

          <button
            onClick={onChatClick}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-blue-500/50 text-blue-400 hover:bg-blue-600/10 hover:border-blue-400 py-2.5 text-sm font-medium transition-all"
          >
            <Icon name="MessageCircle" className="h-4 w-4" />
            Перейти в чат
          </button>
        </div>
      )}

      {obj.presentation_url && (
        <a
          href={obj.presentation_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-300 hover:text-violet-200 py-2.5 text-sm font-medium transition-all mb-2"
        >
          <Icon name="FileDown" className="h-4 w-4" />
          Скачать презентацию PDF
        </a>
      )}

      <button
        onClick={onShareClick}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] py-2.5 text-sm transition-colors"
      >
        <Icon name="Share2" className="h-4 w-4" />
        Поделиться
      </button>

      {!isAuthenticated && obj.owner?.phone && (
        <p className="text-xs text-gray-500 text-center mt-3">
          <button onClick={() => setRegisterOpen(true)} className="text-blue-400 hover:underline">
            Войдите
          </button>
          {" "}или{" "}
          <button onClick={() => setRegisterOpen(true)} className="text-blue-400 hover:underline">
            зарегистрируйтесь
          </button>
          {" "}чтобы увидеть контакты
        </p>
      )}

      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />
    </div>
  )
}