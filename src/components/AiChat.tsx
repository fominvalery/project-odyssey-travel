import { useState, useRef, useEffect } from "react"
import Icon from "@/components/ui/icon"

const AI_URL = "https://functions.poehali.dev/a6de59f3-cdaa-4faf-8ed9-8decc0384734"

interface Message {
  role: "user" | "assistant"
  content: string
}

const QUICK_QUESTIONS = [
  "Как добавить объект?",
  "Как работает CRM?",
  "Что такое реферальная программа?",
  "Как настроить профиль?",
]

interface Props {
  compact?: boolean
}

export default function AiChat({ compact = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: "user", content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      setMessages([...next, { role: "assistant", content: data.reply }])
    } catch {
      setMessages([...next, { role: "assistant", content: "Произошла ошибка. Попробуй ещё раз." }])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  const isEmpty = messages.length === 0

  return (
    <div className={`flex flex-col ${compact ? "h-full" : "h-full"}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-4">
              <Icon name="Bot" className="h-7 w-7 text-blue-400" />
            </div>
            <p className="text-gray-300 font-medium mb-1">ИИ-помощник Кабинет-24</p>
            <p className="text-gray-500 text-sm mb-6">
              Напиши вопрос — отвечу мгновенно.<br />
              Если нужен живой менеджер — напиши «нужен человек».
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:bg-blue-600/20 hover:border-blue-500/40 hover:text-blue-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                <Icon name="Bot" className="h-4 w-4 text-blue-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-[#1a1a1a] text-gray-200 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center mr-2 mt-0.5 shrink-0">
              <Icon name="Bot" className="h-4 w-4 text-blue-400" />
            </div>
            <div className="bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-[#1f1f1f]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          >
            <Icon name="Send" className="h-4 w-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  )
}
