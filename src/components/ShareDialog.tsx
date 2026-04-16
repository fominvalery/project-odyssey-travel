import { useState } from "react"
import Icon from "@/components/ui/icon"

interface ShareDialogProps {
  title: string
  url: string
  onClose: () => void
}

export default function ShareDialog({ title, url, onClose }: ShareDialogProps) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [maxHint, setMaxHint] = useState(false)
  const [moreFallback, setMoreFallback] = useState(false)
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(title)

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  async function handleMax() {
    // У MAX нет публичного share-URL, который гарантированно открывает окно "поделиться".
    // Копируем ссылку в буфер и открываем MAX — пользователь вставит её в нужный чат.
    const ok = await copyToClipboard(`${title}\n${url}`)
    if (ok) {
      setMaxHint(true)
      setTimeout(() => setMaxHint(false), 3500)
    }
    window.open("https://max.ru/", "_blank", "noopener,noreferrer")
  }

  const targets = [
    {
      id: "tg",
      name: "Telegram",
      bg: "bg-[#229ED9]",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="white">
          <path d="M21.72 3.06L2.7 10.4c-1.3.52-1.29 1.25-.24 1.57l4.88 1.52 11.3-7.12c.53-.32 1.02-.15.62.21l-9.15 8.26-.35 5.26c.5 0 .72-.23.99-.5l2.38-2.32 4.94 3.65c.91.5 1.56.24 1.8-.84l3.26-15.37c.34-1.33-.5-1.93-1.41-1.66z"/>
        </svg>
      ),
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      id: "yandex",
      name: "Яндекс Почта",
      bg: "bg-[#FC3F1D]",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="white">
          <path d="M13.32 20.968h2.357V3.032h-3.437c-3.455 0-5.269 1.776-5.269 4.392 0 2.09 1 3.316 2.777 4.517l-3.087 4.612-.2.295-.124.178-.047.065c-.003.003-.005.009-.007.013l-1.012 1.864h2.508l3.78-5.634-1.19-.802c-1.446-.978-2.147-1.74-2.147-3.366 0-1.43 1.002-2.4 2.76-2.4h1.338v13.902z"/>
        </svg>
      ),
      href: `https://mail.yandex.ru/compose?subject=${encodedText}&body=${encodedUrl}`,
    },
    {
      id: "vk",
      name: "ВКонтакте",
      bg: "bg-[#0077FF]",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="white">
          <path d="M12.785 16.241s.288-.032.435-.194c.136-.148.132-.427.132-.427s-.02-1.304.576-1.496c.588-.19 1.341 1.26 2.14 1.818.605.422 1.064.33 1.064.33l2.137-.03s1.117-.07.587-.96c-.043-.073-.308-.661-1.588-1.87-1.34-1.264-1.16-1.059.453-3.246.983-1.332 1.376-2.145 1.253-2.493-.117-.332-.84-.244-.84-.244l-2.406.015s-.178-.025-.31.056c-.13.079-.212.261-.212.261s-.38 1.023-.89 1.894c-1.075 1.837-1.505 1.934-1.68 1.818-.411-.269-.308-1.076-.308-1.65 0-1.789.267-2.535-.517-2.725-.26-.063-.452-.105-1.117-.112-.854-.009-1.577.003-1.986.206-.272.135-.482.437-.354.454.157.021.513.097.702.36.244.34.235 1.103.235 1.103s.14 2.08-.329 2.337c-.321.176-.762-.184-1.72-1.854-.491-.854-.862-1.8-.862-1.8s-.072-.177-.2-.272c-.156-.115-.374-.151-.374-.151l-2.286.015s-.344.01-.47.16c-.113.133-.009.41-.009.41s1.79 4.196 3.816 6.311c1.858 1.94 3.968 1.813 3.968 1.813h.956z"/>
        </svg>
      ),
      href: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedText}`,
    },
  ]

  async function copyLink() {
    const ok = await copyToClipboard(url)
    if (ok) {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  async function handleMoreShare() {
    const shareData = { title, text: title, url }
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
    if (nav.share) {
      try {
        await nav.share(shareData)
        return
      } catch {
        /* пользователь отменил или браузер отказал — покажем fallback */
      }
    }
    setMoreFallback(true)
    setTimeout(() => setMoreFallback(false), 3500)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <Icon name="Share2" className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-white">Поделиться</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-4 gap-3 mb-4">
            {/* Telegram */}
            <a
              href={targets[0].href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-2xl ${targets[0].bg} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                {targets[0].icon}
              </div>
              <span className="text-[11px] text-gray-400 group-hover:text-white transition-colors text-center leading-tight">
                {targets[0].name}
              </span>
            </a>

            {/* Яндекс Почта */}
            <a
              href={targets[1].href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-2xl ${targets[1].bg} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                {targets[1].icon}
              </div>
              <span className="text-[11px] text-gray-400 group-hover:text-white transition-colors text-center leading-tight">
                {targets[1].name}
              </span>
            </a>

            {/* MAX — кастомный клик */}
            <button
              type="button"
              onClick={handleMax}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#5D3FE0] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg tracking-tight">M</span>
              </div>
              <span className="text-[11px] text-gray-400 group-hover:text-white transition-colors text-center leading-tight">
                MAX
              </span>
            </button>

            {/* ВКонтакте */}
            <a
              href={targets[2].href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-2xl ${targets[2].bg} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                {targets[2].icon}
              </div>
              <span className="text-[11px] text-gray-400 group-hover:text-white transition-colors text-center leading-tight">
                {targets[2].name}
              </span>
            </a>
          </div>

          {/* Подсказка для MAX */}
          {maxHint && (
            <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 flex items-start gap-2">
              <Icon name="Check" className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-300 leading-relaxed">
                Ссылка скопирована. Откройте MAX и вставьте её в нужный чат.
              </p>
            </div>
          )}

          {/* Неяркая строка "другим способом" */}
          <button
            type="button"
            onClick={handleMoreShare}
            className="w-full flex items-center justify-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-300 transition-colors mb-4 py-1"
          >
            <Icon name="MoreHorizontal" className="h-3.5 w-3.5" />
            Поделиться другим способом
          </button>

          {moreFallback && (
            <div className="mb-4 rounded-xl bg-[#0f0f0f] border border-[#262626] px-3 py-2 flex items-start gap-2">
              <Icon name="Info" className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Ваш браузер не поддерживает системный диалог. Скопируйте ссылку ниже и отправьте вручную.
              </p>
            </div>
          )}

          <div className="rounded-xl bg-[#0f0f0f] border border-[#262626] p-3 flex items-center gap-3">
            <Icon name="Link" className="h-4 w-4 text-gray-500 shrink-0" />
            <input
              readOnly
              value={url}
              className="flex-1 bg-transparent text-sm text-gray-300 outline-none truncate"
              onFocus={e => e.target.select()}
            />
            <button
              onClick={copyLink}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                linkCopied ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {linkCopied ? "Скопировано" : "Копировать"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
