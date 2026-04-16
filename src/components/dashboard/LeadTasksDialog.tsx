import { useState, useEffect, useCallback } from "react"
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
import { type Lead, type Task, formatDate, formatDateTime, nowTime, ruLocale } from "./leadCard.types"

// ── TimePicker ────────────────────────────────────────────────────────────────

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

// ── LeadTasksDialog ───────────────────────────────────────────────────────────

interface LeadTasksDialogProps {
  lead: Lead
  ownerId: string
  hasOverdue: boolean
  onOverdueRefresh: () => void
}

export function LeadTasksDialog({ lead, ownerId, hasOverdue, onOverdueRefresh }: LeadTasksDialogProps) {
  const [tasksOpen, setTasksOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoaded, setTasksLoaded] = useState(false)

  const [doneText, setDoneText] = useState("")
  const [todoText, setTodoText] = useState("")
  const [dueDate, setDueDate] = useState<Date>(new Date())
  const [dueTime, setDueTime] = useState(nowTime())
  const [calOpen, setCalOpen] = useState(false)

  const loadTasks = useCallback(async () => {
    const url = `${func2url["lead-extras"]}?kind=tasks&lead_id=${lead.id}&owner_id=${ownerId}`
    const r = await fetch(url).then(r => r.json()).catch(() => ({ tasks: [] }))
    setTasks(r.tasks || [])
    setTasksLoaded(true)
  }, [lead.id, ownerId])

  useEffect(() => {
    if (tasksOpen && !tasksLoaded) loadTasks()
  }, [tasksOpen, tasksLoaded, loadTasks])

  useEffect(() => {
    if (tasksOpen) {
      setDoneText("")
      setTodoText("")
      setDueDate(new Date())
      setDueTime(nowTime())
    }
  }, [tasksOpen])

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

          <div className="grid grid-cols-2 gap-3">
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
  )
}
