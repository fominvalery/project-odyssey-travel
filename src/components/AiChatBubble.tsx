import { useState } from "react"
import Icon from "@/components/ui/icon"
import AiChat from "@/components/AiChat"

export default function AiChatBubble() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-120px)] bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Icon name="Bot" className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">ИИ-помощник</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-500">Онлайн</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-[#1a1a1a] flex items-center justify-center text-gray-500 hover:text-white transition-colors"
            >
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <AiChat compact />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{ bottom: open ? undefined : undefined }}
        title="ИИ-помощник"
      >
        {open ? (
          <Icon name="X" className="h-5 w-5 text-white" />
        ) : (
          <Icon name="Bot" className="h-5 w-5 text-white" />
        )}
      </button>
    </>
  )
}
