/**
 * Единая форма создания и редактирования лида.
 * Используется:
 * 1. В DashboardCRM — кнопка «Создать клиента» (новый лид вручную)
 * 2. В LeadExpandedBody — редактирование существующего лида
 */
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import { type Lead, type FunnelStage, FUNNEL_STAGES } from "./leadCard.types"

const OBJECT_CATEGORIES = ["Офис", "Склад", "Торговый", "Производство", "Жилой", "Другое"]
const OBJECT_TYPES = ["Продажа", "Аренда", "Субаренда", "ГАБ"]

interface LeadFormProps {
  ownerId: string
  /** Если передан — режим редактирования */
  existing?: Lead
  onSave: (lead: Lead) => void
  onCancel: () => void
}

interface FormState {
  name: string
  phone: string
  email: string
  message: string
  source: string
  stage: FunnelStage
  object_title: string
  preferred_category: string
  preferred_type: string
  preferred_city: string
  budget_from: string
  budget_to: string
  area_from: string
  area_to: string
}

function toForm(lead?: Lead): FormState {
  if (!lead) {
    return {
      name: "", phone: "", email: "", message: "",
      source: "Ручное добавление", stage: "Лид",
      object_title: "", preferred_category: "", preferred_type: "",
      preferred_city: "", budget_from: "", budget_to: "",
      area_from: "", area_to: "",
    }
  }
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    message: lead.message,
    source: lead.source,
    stage: lead.stage,
    object_title: lead.object_title,
    preferred_category: lead.preferred_category || "",
    preferred_type: lead.preferred_type || "",
    preferred_city: lead.preferred_city || "",
    budget_from: lead.budget_from != null ? String(lead.budget_from) : "",
    budget_to: lead.budget_to != null ? String(lead.budget_to) : "",
    area_from: lead.area_from != null ? String(lead.area_from) : "",
    area_to: lead.area_to != null ? String(lead.area_to) : "",
  }
}

export function LeadForm({ ownerId, existing, onSave, onCancel }: LeadFormProps) {
  const [form, setForm] = useState<FormState>(() => toForm(existing))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function set(key: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Имя и телефон обязательны")
      return
    }
    setSaving(true)
    setError("")

    const payload = {
      owner_id: ownerId,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      source: form.source.trim() || "Ручное добавление",
      stage: form.stage,
      object_title: form.object_title.trim(),
      preferred_category: form.preferred_category,
      preferred_type: form.preferred_type,
      preferred_city: form.preferred_city.trim(),
      budget_from: form.budget_from ? Number(form.budget_from) : null,
      budget_to: form.budget_to ? Number(form.budget_to) : null,
      area_from: form.area_from ? Number(form.area_from) : null,
      area_to: form.area_to ? Number(form.area_to) : null,
      ...(existing ? { id: existing.id } : {}),
    }

    const r = await fetch(func2url.leads, {
      method: existing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(r => r.json()).catch(() => null)

    setSaving(false)
    if (r?.lead) {
      onSave(r.lead as Lead)
    } else {
      setError(r?.error || "Ошибка сохранения")
    }
  }

  const inputCls = "bg-[#0d0d0d] border-[#1f1f1f] text-white placeholder:text-gray-600 text-sm"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Контактные данные */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Контакт</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Имя *"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            className={inputCls}
          />
          <Input
            placeholder="Телефон *"
            type="tel"
            value={form.phone}
            onChange={e => set("phone", e.target.value)}
            className={inputCls}
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => set("email", e.target.value)}
            className={inputCls}
          />
          <Input
            placeholder="Источник"
            value={form.source}
            onChange={e => set("source", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Объект интереса */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Объект интереса</p>
        <Input
          placeholder="Название объекта или запрос клиента"
          value={form.object_title}
          onChange={e => set("object_title", e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Предпочтения для автоподбора */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Icon name="Sparkles" className="h-3.5 w-3.5 text-violet-400" />
          Параметры подбора
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          {/* Категория */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Категория</label>
            <select
              value={form.preferred_category}
              onChange={e => set("preferred_category", e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-white text-sm rounded-md px-3 py-2"
            >
              <option value="">Любая</option>
              {OBJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {/* Тип */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Тип сделки</label>
            <select
              value={form.preferred_type}
              onChange={e => set("preferred_type", e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-white text-sm rounded-md px-3 py-2"
            >
              <option value="">Любой</option>
              {OBJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* Город */}
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Город</label>
            <Input
              placeholder="Москва, СПб..."
              value={form.preferred_city}
              onChange={e => set("preferred_city", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        {/* Бюджет */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Бюджет от, ₽</label>
            <Input
              placeholder="0"
              type="number"
              value={form.budget_from}
              onChange={e => set("budget_from", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Бюджет до, ₽</label>
            <Input
              placeholder="∞"
              type="number"
              value={form.budget_to}
              onChange={e => set("budget_to", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Площадь от, м²</label>
            <Input
              placeholder="0"
              type="number"
              value={form.area_from}
              onChange={e => set("area_from", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Площадь до, м²</label>
            <Input
              placeholder="∞"
              type="number"
              value={form.area_to}
              onChange={e => set("area_to", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Этап */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Этап воронки</p>
        <div className="flex flex-wrap gap-2">
          {FUNNEL_STAGES.map(({ stage, color, bg }) => (
            <button
              key={stage}
              type="button"
              onClick={() => set("stage", stage)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                form.stage === stage ? `${bg} ${color}` : "bg-[#0d0d0d] border-[#1f1f1f] text-gray-500 hover:text-white"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Сообщение */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Комментарий / сообщение клиента</label>
        <Textarea
          placeholder="Пожелания, детали запроса..."
          value={form.message}
          onChange={e => set("message", e.target.value)}
          className={`${inputCls} resize-none`}
          rows={3}
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
        >
          {saving ? (
            <><Icon name="Loader2" className="h-4 w-4 mr-1.5 animate-spin" />Сохраняю...</>
          ) : existing ? (
            <><Icon name="Check" className="h-4 w-4 mr-1.5" />Сохранить изменения</>
          ) : (
            <><Icon name="UserPlus" className="h-4 w-4 mr-1.5" />Добавить клиента</>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-[#2a2a2a] bg-transparent text-gray-400 hover:text-white">
          Отмена
        </Button>
      </div>
    </form>
  )
}
