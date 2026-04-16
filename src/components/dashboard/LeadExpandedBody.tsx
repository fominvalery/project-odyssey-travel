import { useState, useCallback, useRef, useEffect } from "react"
import Icon from "@/components/ui/icon"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import func2url from "../../../backend/func2url.json"
import { type Lead, type Comment, type LeadFile, formatDateTime, formatSize } from "./leadCard.types"

interface LeadExpandedBodyProps {
  lead: Lead
  ownerId: string
  onDelete: (id: string) => void
}

export function LeadExpandedBody({ lead, ownerId, onDelete }: LeadExpandedBodyProps) {
  // Комментарии
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [commentsLoaded, setCommentsLoaded] = useState(false)

  // Файлы
  const [files, setFiles] = useState<LeadFile[]>([])
  const [filesLoaded, setFilesLoaded] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadComments = useCallback(async () => {
    if (commentsLoaded) return
    const url = `${func2url["lead-extras"]}?kind=comments&lead_id=${lead.id}&owner_id=${ownerId}`
    const r = await fetch(url).then(r => r.json()).catch(() => ({ comments: [] }))
    setComments(r.comments || [])
    setCommentsLoaded(true)
  }, [lead.id, ownerId, commentsLoaded])

  const loadFiles = useCallback(async () => {
    if (filesLoaded) return
    const url = `${func2url["lead-extras"]}?kind=files&lead_id=${lead.id}&owner_id=${ownerId}`
    const r = await fetch(url).then(r => r.json()).catch(() => ({ files: [] }))
    setFiles(r.files || [])
    setFilesLoaded(true)
  }, [lead.id, ownerId, filesLoaded])

  // Load on first render (component only mounts when expanded=true)
  useEffect(() => {
    loadComments()
    loadFiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addComment() {
    const text = commentText.trim()
    if (!text) return
    const r = await fetch(`${func2url["lead-extras"]}?kind=comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: lead.id, owner_id: ownerId, text }),
    }).then(r => r.json()).catch(() => null)
    if (r?.comment) {
      setComments(prev => [r.comment, ...prev])
      setCommentText("")
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const result = reader.result as string
        const base64 = result.split(",")[1] || ""
        const r = await fetch(`${func2url["lead-extras"]}?kind=files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: lead.id,
            owner_id: ownerId,
            name: file.name,
            mime: file.type || "application/octet-stream",
            data_base64: base64,
          }),
        }).then(r => r.json()).catch(() => null)
        if (r?.file) setFiles(prev => [r.file, ...prev])
        setUploadingFile(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
      reader.readAsDataURL(file)
    } catch {
      setUploadingFile(false)
    }
  }

  return (
    <div className="border-t border-[#1a1a1a] px-5 py-4 space-y-5">
      {/* Контакты */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Телефон</p>
          <a href={`tel:${lead.phone}`} className="text-white font-medium hover:text-blue-400">{lead.phone}</a>
        </div>
        {lead.email && (
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <a href={`mailto:${lead.email}`} className="text-white font-medium truncate hover:text-blue-400">{lead.email}</a>
          </div>
        )}
      </div>

      {/* Объект + файлы */}
      {lead.object_title && (
        <div className="rounded-xl bg-[#0d0d0d] border border-[#1a1a1a] p-3">
          <p className="text-xs text-gray-500 mb-1">Объект</p>
          {lead.object_id ? (
            <a
              href={`/marketplace/${lead.object_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-medium hover:text-blue-400 flex items-center gap-1 group"
            >
              <span className="truncate">{lead.object_title}</span>
              <Icon name="ExternalLink" className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-400 shrink-0" />
            </a>
          ) : (
            <p className="text-white font-medium truncate">{lead.object_title}</p>
          )}

          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Предложения для клиента (PDF и др.)</p>
            {files.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {files.map(f => (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-gray-300 hover:text-blue-400 bg-[#111] rounded-lg px-3 py-2 border border-[#1a1a1a]"
                  >
                    <Icon name="FileText" className="h-4 w-4 text-red-400 shrink-0" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-gray-600">{formatSize(f.size_bytes)}</span>
                    <Icon name="Download" className="h-3.5 w-3.5 text-gray-500" />
                  </a>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-[#111] border border-dashed border-[#2a2a2a] text-gray-400 hover:text-white hover:border-blue-400 transition-colors w-full justify-center disabled:opacity-50"
            >
              {uploadingFile ? (
                <><Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" /> Загружаю...</>
              ) : (
                <><Icon name="Upload" className="h-3.5 w-3.5" /> Добавить файл</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Сообщение от клиента */}
      {lead.message && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Сообщение от клиента</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{lead.message}</p>
        </div>
      )}

      {/* Комментарии */}
      <div>
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
          <Icon name="MessageCircle" className="h-3.5 w-3.5" /> Мои комментарии ({comments.length})
        </p>
        <div className="flex gap-2 mb-2">
          <Textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Оставьте себе комментарий по этому клиенту..."
            className="bg-[#0d0d0d] border-[#1a1a1a] text-white resize-none text-sm"
            rows={2}
          />
          <Button
            onClick={addComment}
            disabled={!commentText.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white self-end"
            size="sm"
          >
            <Icon name="Send" className="h-4 w-4" />
          </Button>
        </div>
        {comments.length > 0 && (
          <div className="space-y-2 mt-3">
            {comments.map(c => (
              <div key={c.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-3 py-2">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.text}</p>
                <p className="text-[10px] text-gray-600 mt-1">{formatDateTime(c.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Удаление */}
      <div className="flex justify-end pt-2 border-t border-[#1a1a1a]">
        <button
          onClick={() => onDelete(lead.id)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          <Icon name="Trash2" className="h-3.5 w-3.5" /> Удалить лид
        </button>
      </div>
    </div>
  )
}