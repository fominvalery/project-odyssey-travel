import { useState, useEffect, useCallback, useRef } from "react"
import Icon from "@/components/ui/icon"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import func2url from "../../../backend/func2url.json"

export type FunnelStage = "Лид" | "Подбор" | "Показ" | "Переговоры" | "Сделка" | "Отказ"

export interface Lead {
  id: string
  owner_id: string | null
  object_id: string | null
  object_title: string
  name: string
  phone: string
  email: string
  message: string
  source: string
  stage: FunnelStage
  created_at: string
}

interface Comment {
  id: string
  text: string
  created_at: string
}
interface Task {
  id: string
  done_text: string
  todo_text: string
  due_at: string | null
  completed: boolean
  created_at: string
}
interface LeadFile {
  id: string
  name: string
  url: string
  mime: string
  size_bytes: number
  created_at: string
}

export const FUNNEL_STAGES: { stage: FunnelStage; color: string; bg: string; icon: string }[] = [
  { stage: "Лид",        color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",    icon: "UserPlus" },
  { stage: "Подбор",     color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20", icon: "Search" },
  { stage: "Показ",      color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",  icon: "Eye" },
  { stage: "Переговоры", color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20", icon: "MessageSquare" },
  { stage: "Сделка",     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "Handshake" },
  { stage: "Отказ",      color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",      icon: "XCircle" },
]

function formatDate(iso: string) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("ru", { day: "numeric", month: "short" })
  } catch {
    return ""
  }
}

function formatDateTime(iso: string | null) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    return d.toLocaleString("ru", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return ""
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function nowTime() {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 30)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

// Счётчик времени: HH:MM крутилки
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(":").map(Number)
  const hours = isNaN(h) ? 9 : h
  const mins = isNaN(m) ? 0 : m

  function adjustH(delta: number) {
    const nh = ((hours + delta + 24) % 24)
    onChange(`${String(nh).padStart(2, "0")}:${String(mins).padStart(2, "0")}`)
  }
  function adjustM(delta: number) {
    const nm = ((mins + delta + 60) % 60)
    onChange(`${String(hours).padStart(2, "0")}:${String(nm).padStart(2, "0")}`)
  }

  return (
    <div className="flex items-center gap-1 justify-center">
      <div className="flex flex-col items-center">
        <button type="button" onClick={() => adjustH(1)} className="px-2 py-0.5 text-gray-400 hover:text-white text-lg leading-none">▲</button>
        <span className="text-2xl font-bold text-white w-10 text-center">{String(hours).padStart(2, "0")}</span>
        <button type="button" onClick={() => adjustH(-1)} className="px-2 py-0.5 text-gray-400 hover:text-white text-lg leading-none">▼</button>
      </div>
      <span className="text-2xl font-bold text-gray-400 mb-0.5">:</span>
      <div className="flex flex-col items-center">
        <button type="button" onClick={() => adjustM(5)} className="px-2 py-0.5 text-gray-400 hover:text-white text-lg leading-none">▲</button>
        <span className="text-2xl font-bold text-white w-10 text-center">{String(mins).padStart(2, "0")}</span>
        <button type="button" onClick={() => adjustM(-5)} className="px-2 py-0.5 text-gray-400 hover:text-white text-lg leading-none">▼</button>
      </div>
    </div>
  )
}

interface LeadCardProps {
  lead: Lead
  ownerId: string
  hasOverdue: boolean
  onStageChange: (id: string, stage: FunnelStage) => void
  onDelete: (id: string) => void
  onOverdueRefresh: () => void
}

export function LeadCard({ lead, ownerId, hasOverdue, onStageChange, onDelete, onOverdueRefresh }: LeadCardProps) {
  const [expanded, setExpanded] = useState(false)
  const stageInfo = FUNNEL_STAGES.find(s => s.stage === lead.stage) ?? FUNNEL_STAGES[0]

  // Комментарии
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [commentsLoaded, setCommentsLoaded] = useState(false)

  // Файлы
  const [files, setFiles] = useState<LeadFile[]>([])
  const [filesLoaded, setFilesLoaded] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Задачи
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoaded, setTasksLoaded] = useState(false)
  const [tasksOpen, setTasksOpen] = useState(false)
  const [doneText, setDoneText] = useState("")
  const [todoText, setTodoText] = useState("")
  const [dueDate, setDueDate] = useState<Date>(new Date())
  const [dueTime, setDueTime] = useState(nowTime())
  const [calOpen, setCalOpen] = useState(false)

  const loadComments = useCallback(async () => {
    const url = `${func2url["lead-extras"]}?kind=comments&lead_id=${lead.id}&owner_id=${ownerId}`
    const r = await fetch(url).then(r => r.json()).catch(() => ({ comments: [] }))
    setComments(r.comments || [])
    setCommentsLoaded(true)
  }, [lead.id, ownerId])

  const loadFiles = useCallback(async () => {
    const url = `${func2url["lead-extras"]}?kind=files&lead_id=${lead.id}&owner_id=${ownerId}`
    const r = await fetch(url).then(r => r.json()).catch(() => ({ files: [] }))
    setFiles(r.files || [])
    setFilesLoaded(true)
  }, [lead.id, ownerId])

  const loadTasks = useCallback(async () => {
    const url = `${func2url["lead-extras"]}?kind=tasks&lead_id=${lead.id}&owner_id=${ownerId}`
    const r = await fetch(url).then(r => r.json()).catch(() => ({ tasks: [] }))
    setTasks(r.tasks || [])
    setTasksLoaded(true)
  }, [lead.id, ownerId])

  useEffect(() => {
    if (expanded && !commentsLoaded) loadComments()
    if (expanded && !filesLoaded) loadFiles()
  }, [expanded, commentsLoaded, filesLoaded, loadComments, loadFiles])

  useEffect(() => {
    if (tasksOpen && !tasksLoaded) loadTasks()
  }, [tasksOpen, tasksLoaded, loadTasks])

  // Сбрасываем форму при открытии диалога
  useEffect(() => {
    if (tasksOpen) {
      setDoneText("")
      setTodoText("")
      setDueDate(new Date())
      setDueTime(nowTime())
    }
  }, [tasksOpen])

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

  async function addTask() {
    if (!doneText.trim() && !todoText.trim()) return
    const [hh, mm] = dueTime.split(":").map(Number)
    const dt = new Date(dueDate)
    dt.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0)
    const due_at = dt.toISOString()

    const r = await fetch(`${func2url["lead-extras"]}?kind=tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: lead.id,
        owner_id: ownerId,
        done_text: doneText,
        todo_text: todoText,
        due_at,
      }),
    }).then(r => r.json()).catch(() => null)
    if (r?.task) {
      setTasks(prev => [r.task, ...prev])
      setDoneText("")
      setTodoText("")
      setDueDate(new Date())
      setDueTime(nowTime())
      onOverdueRefresh()
    }
  }

  async function toggleTask(t: Task) {
    const r = await fetch(`${func2url["lead-extras"]}?kind=tasks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, owner_id: ownerId, completed: !t.completed }),
    }).then(r => r.json()).catch(() => null)
    if (r?.task) {
      setTasks(prev => prev.map(x => x.id === t.id ? r.task : x))
      onOverdueRefresh()
    }
  }

  const formatPickedDate = (d: Date) =>
    d.toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden hover:border-[#2a2a2a] transition-colors">
      <div className="p-5 flex items-center gap-4">
        <div
          className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 text-sm font-bold text-gray-400">
            {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{lead.name || "Без имени"}</p>
            <p className="text-xs text-gray-400">{lead.phone}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {lead.object_title && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 truncate max-w-[180px]">
                  {lead.object_title}
                </span>
              )}
              <span className="text-xs text-gray-500">· {lead.source}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">{formatDate(lead.created_at)}</span>

          {/* Иконка-планировщик */}
          <Dialog open={tasksOpen} onOpenChange={setTasksOpen}>
            <DialogTrigger asChild>
              <button
                className={`relative h-8 w-8 rounded-full flex items-center justify-center border transition-colors ${
                  hasOverdue
                    ? "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25"
                    : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:text-white"
                }`}
                title={hasOverdue ? "Есть просроченные задачи" : "Задачи клиента"}
              >
                <Icon name="ListTodo" className="h-4 w-4" />
                {hasOverdue && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#0d0d0d] border-[#1f1f1f] text-white max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base">Задачи по клиенту: {lead.name || "Без имени"}</DialogTitle>
              </DialogHeader>

              {/* Форма добавления задачи */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Сделано</label>
                  <Textarea
                    value={doneText}
                    onChange={e => setDoneText(e.target.value)}
                    placeholder="Что уже сделано с клиентом..."
                    className="bg-[#111] border-[#1f1f1f] text-white resize-none text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Сделать</label>
                  <Textarea
                    value={todoText}
                    onChange={e => setTodoText(e.target.value)}
                    placeholder="Что нужно сделать на следующем шаге..."
                    className="bg-[#111] border-[#1f1f1f] text-white resize-none text-sm"
                    rows={2}
                  />
                </div>

                {/* Дата + Время */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Календарь */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Дата напоминания</label>
                    <Popover open={calOpen} onOpenChange={setCalOpen}>
                      <PopoverTrigger asChild>
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#1f1f1f] text-sm text-white hover:border-blue-500/40 transition-colors">
                          <Icon name="CalendarDays" className="h-4 w-4 text-blue-400 shrink-0" />
                          <span className="flex-1 text-left truncate text-xs">
                            {formatPickedDate(dueDate)}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-[#0d0d0d] border-[#1f1f1f] text-white"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(d) => { if (d) { setDueDate(d); setCalOpen(false) } }}
                          defaultMonth={dueDate}
                          locale={ruLocale}
                          className="rounded-xl"
                          classNames={{
                            day_selected: "bg-blue-500 text-white hover:bg-blue-600",
                            day_today: "border border-blue-400 text-blue-400",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Счётчик времени */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Время</label>
                    <div className="bg-[#111] border border-[#1f1f1f] rounded-lg px-2 py-1">
                      <TimePicker value={dueTime} onChange={setDueTime} />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={addTask}
                  disabled={!doneText.trim() && !todoText.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Icon name="Plus" className="h-4 w-4 mr-1" /> Добавить задачу
                </Button>
              </div>

              {/* История задач */}
              <div className="border-t border-[#1a1a1a] pt-3 space-y-2">
                <p className="text-xs text-gray-500 mb-2">История задач</p>
                {tasks.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-4">Задач пока нет</p>
                ) : tasks.map(t => {
                  const overdue = !t.completed && t.due_at && new Date(t.due_at) <= new Date()
                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border ${
                        t.completed
                          ? "bg-emerald-500/5 border-emerald-500/20 opacity-70"
                          : overdue
                            ? "bg-red-500/10 border-red-500/30"
                            : "bg-[#111] border-[#1f1f1f]"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleTask(t)}
                          className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            t.completed ? "bg-emerald-500 border-emerald-500" : "border-gray-600 hover:border-emerald-400"
                          }`}
                        >
                          {t.completed && <Icon name="Check" className="h-3 w-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-500">{formatDate(t.created_at)}</p>
                          {t.done_text && (
                            <div className="mt-1">
                              <span className="text-[11px] font-semibold text-emerald-400">Что сделано</span>
                              <p className="text-sm text-gray-200 mt-0.5">{t.done_text}</p>
                            </div>
                          )}
                          {t.todo_text && (
                            <div className="mt-1.5">
                              <span className="text-[11px] font-semibold text-amber-400">Следующий шаг</span>
                              <p className="text-sm text-gray-200 mt-0.5">{t.todo_text}</p>
                            </div>
                          )}
                          {t.due_at && (
                            <p className={`text-[11px] mt-1.5 font-semibold flex items-center gap-1 ${overdue ? "text-red-400" : "text-blue-400"}`}>
                              <Icon name="Clock" className="h-3 w-3" />
                              Напоминание {formatDateTime(t.due_at)}
                              {overdue && " · просрочено"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Этап воронки — выпадающее меню */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`text-xs px-2.5 py-1 rounded-full font-medium border flex items-center gap-1 ${stageInfo.bg} ${stageInfo.color} hover:opacity-80`}
                onClick={e => e.stopPropagation()}
              >
                {lead.stage}
                <Icon name="ChevronDown" className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 p-0 bg-[#0d0d0d] border-[#1f1f1f] text-white"
            >
              {lead.object_title && (
                <div className="px-4 py-3 border-b border-[#1a1a1a] bg-[#111]">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Объект из маркетплейса</p>
                  <p className="text-sm font-semibold text-white truncate mt-0.5">{lead.object_title}</p>
                </div>
              )}
              <div className="p-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 py-1">Переместить в этап</p>
                {FUNNEL_STAGES.map(({ stage, color, bg, icon }) => (
                  <button
                    key={stage}
                    onClick={() => onStageChange(lead.id, stage)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      lead.stage === stage
                        ? `${bg} ${color}`
                        : "text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <Icon name={icon as "Eye"} className="h-4 w-4" />
                    <span>{stage}</span>
                    {lead.stage === stage && (
                      <Icon name="Check" className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <button
            onClick={() => setExpanded(v => !v)}
            className="text-gray-500 hover:text-white"
          >
            <Icon name={expanded ? "ChevronUp" : "ChevronDown"} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#1a1a1a] px-5 py-4 space-y-5">
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

          {lead.message && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Сообщение от клиента</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{lead.message}</p>
            </div>
          )}

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

          <div className="flex justify-end pt-2 border-t border-[#1a1a1a]">
            <button
              onClick={() => onDelete(lead.id)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              <Icon name="Trash2" className="h-3.5 w-3.5" /> Удалить лид
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Простая русская локаль для календаря
const ruLocale = {
  localize: {
    month: (n: number) => ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"][n],
    day: (n: number) => ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][n],
    ordinalNumber: (n: number) => String(n),
    era: (n: number) => ["до н.э.", "н.э."][n],
    quarter: (n: number) => `Q${n + 1}`,
    dayPeriod: (v: string) => v,
  },
  formatLong: {
    date: () => "dd.MM.yyyy",
    time: () => "HH:mm",
    dateTime: () => "dd.MM.yyyy HH:mm",
  },
  match: {
    month: () => ({ value: 0, rest: "" }),
    day: () => ({ value: 0, rest: "" }),
    ordinalNumber: () => ({ value: 0, rest: "" }),
    era: () => ({ value: 0, rest: "" }),
    quarter: () => ({ value: 0, rest: "" }),
    dayPeriod: () => ({ value: "am", rest: "" }),
  },
  options: { weekStartsOn: 1 as const, firstWeekContainsDate: 1 },
  formatRelative: () => "",
  code: "ru",
  formatDistance: () => "",
} as unknown as Locale

export default LeadCard
