import AiChat from "@/components/AiChat"
import Icon from "@/components/ui/icon"

export default function DashboardSupport() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <Icon name="Headphones" className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Поддержка</h1>
            <p className="text-xs text-gray-500">ИИ-помощник платформы</p>
          </div>
        </div>

        <a
          href="https://poehali.dev/help"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#2a2a2a] text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          <Icon name="UserRound" className="h-4 w-4" />
          Живой менеджер
        </a>
      </div>

      <div className="flex-1 overflow-hidden">
        <AiChat />
      </div>
    </div>
  )
}
