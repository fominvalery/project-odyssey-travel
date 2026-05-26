import { useState } from "react"
import Icon from "@/components/ui/icon"
import { CATEGORIES, WizardForm } from "../wizardTypes"

interface Step6PublishBaseProps {
  form: WizardForm
  category: string
  publishToBase: boolean
  setPublishToBase: (v: boolean) => void
}

export function Step6PublishBase({ form, category, publishToBase, setPublishToBase }: Step6PublishBaseProps) {
  const catLabel = CATEGORIES.find(c => c.id === category)?.label ?? category

  return (
    <div className="space-y-4">
      {/* Сводка объекта */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
        <h2 className="font-semibold mb-4 text-white">Сводка объекта</h2>
        <div className="space-y-3">
          {[
            { label: "Тип", value: catLabel },
            { label: "Название", value: form.title || "—" },
            { label: "Город", value: form.city || "—" },
            { label: "Адрес", value: form.address || "—" },
            { label: "Цена", value: form.price ? `${form.price} ₽` : "—" },
            { label: "Площадь", value: form.area ? `${form.area} м²` : "—" },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-sm border-b border-[#1a1a1a] pb-2 last:border-0">
              <span className="text-gray-500">{row.label}</span>
              <span className="text-white font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Переключатель — размещение в Базе */}
      <button
        type="button"
        onClick={() => setPublishToBase(!publishToBase)}
        className={`w-full rounded-2xl border p-5 flex items-center gap-4 transition-all text-left ${
          publishToBase ? "border-emerald-500 bg-emerald-500/10" : "border-[#1f1f1f] bg-[#111]"
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${publishToBase ? "bg-emerald-500/20" : "bg-[#1a1a1a]"}`}>
          <Icon name="FolderOpen" className={`h-6 w-6 ${publishToBase ? "text-emerald-400" : "text-gray-500"}`} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white">Разместить в Базе / Проектах</p>
          <p className="text-xs text-gray-400 mt-0.5">Объект появится во внутренней базе Кабинет-24 и будет доступен брокерам-партнёрам</p>
        </div>
        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${publishToBase ? "bg-emerald-600" : "bg-[#2a2a2a]"}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${publishToBase ? "translate-x-4" : "translate-x-0"}`} />
        </div>
      </button>

      {/* Блоки функционала при размещении в базе */}
      {publishToBase && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-gray-400 px-1">
            <Icon name="Sparkles" className="h-3.5 w-3.5 text-emerald-400" />
            После размещения для брокеров будут доступны:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Связь с менеджером */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon name="MessageCircle" className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-white">Связаться с менеджером</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Кнопка для брокеров — быстрая связь с менеджером проекта (контакты из шага «Регламент»)
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                <Icon name="Check" className="h-3 w-3" />
                Будет активна при размещении
              </div>
            </div>

            {/* Фиксация клиента */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Icon name="BookmarkCheck" className="h-4 w-4 text-violet-400" />
                </div>
                <span className="text-sm font-medium text-white">Фиксация клиента</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Брокер может зафиксировать клиента — заявка попадёт в CRM (Фиксации) с данными клиента и брокера
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                <Icon name="Check" className="h-3 w-3" />
                Будет активна при размещении
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/20 p-4 flex gap-3">
            <Icon name="CheckCircle" className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">
              Объект появится в разделе <span className="text-white font-medium">«{catLabel}»</span> внутренней базы Кабинет-24 сразу после сохранения.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
