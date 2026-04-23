import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { CATEGORIES, getCategoryFields } from "../wizardTypes"
import type { WizardForm } from "../wizardTypes"

interface Step3Props {
  form: WizardForm
  setForm: (f: WizardForm) => void
  category: string
  subtype: string
  categoryFields: Record<string, string>
  onCategoryField: (key: string, value: string) => void
}

const RESORT_FINANCE_KEYS = new Set(["occupancy", "avg_check", "annual_revenue", "yield", "payback", "entry_price", "revenue_model", "forecast_occupancy"])
const RESORT_INFRA_KEYS = new Set(["pool", "spa", "restaurant", "beach", "parking", "conference"])

export function Step3Details({
  form, setForm, category, subtype, categoryFields, onCategoryField,
}: Step3Props) {
  const catLabel = CATEGORIES.find(c => c.id === category)?.label ?? ""
  const fields = getCategoryFields(category, subtype)
  const isResort = category === "resort"

  const financeFields = isResort ? fields.filter(f => RESORT_FINANCE_KEYS.has(f.key)) : []
  const infraFields = isResort ? fields.filter(f => RESORT_INFRA_KEYS.has(f.key)) : []
  const mainFields = isResort ? fields.filter(f => !RESORT_FINANCE_KEYS.has(f.key) && !RESORT_INFRA_KEYS.has(f.key)) : fields

  return (
    <div className="space-y-6">
      {/* Подтип — напоминание */}
      {subtype && (
        <div className={`flex items-center gap-2 text-xs rounded-xl px-4 py-2.5 ${
          isResort
            ? "text-cyan-300 bg-cyan-500/10 border border-cyan-500/20"
            : "text-violet-300 bg-violet-500/10 border border-violet-500/20"
        }`}>
          <Icon name="Tag" className="h-3.5 w-3.5 shrink-0" />
          <span>Тип: <span className="font-semibold">{subtype}</span> — характеристики подобраны автоматически</span>
        </div>
      )}

      {/* Цена и площадь */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-gray-400 mb-1.5 block">{isResort ? "Цена входа / Стоимость (₽)" : "Цена (₽)"}</Label>
          <Input placeholder={isResort ? "120 000 000" : "18 500 000"} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
            className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600" />
        </div>
        <div>
          <Label className="text-xs text-gray-400 mb-1.5 block">Площадь (м²)</Label>
          <Input placeholder={isResort ? "2 400" : "142"} value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
            className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600" />
        </div>
      </div>

      {/* Основные характеристики */}
      {mainFields.length > 0 && (
        <div className={`border-t pt-4 ${isResort ? "border-cyan-500/20" : "border-[#1f1f1f]"}`}>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${isResort ? "text-cyan-400" : "text-blue-400"}`}>
            {catLabel}{subtype ? ` · ${subtype}` : ""} — параметры объекта
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mainFields.map(field => (
              <div key={field.key}>
                <Label className="text-xs text-gray-400 mb-1.5 block">{field.label}</Label>
                <Input
                  placeholder={field.placeholder}
                  value={categoryFields[field.key] ?? ""}
                  onChange={e => onCategoryField(field.key, e.target.value)}
                  className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Финансовые показатели — курортная */}
      {isResort && financeFields.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-cyan-950/40 to-teal-950/30 border border-cyan-500/20 p-4">
          <p className="text-xs text-cyan-400 font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Icon name="TrendingUp" className="h-3.5 w-3.5" />
            Финансовые показатели
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {financeFields.map(field => (
              <div key={field.key}>
                <Label className="text-xs text-gray-400 mb-1.5 block">{field.label}</Label>
                <Input
                  placeholder={field.placeholder}
                  value={categoryFields[field.key] ?? ""}
                  onChange={e => onCategoryField(field.key, e.target.value)}
                  className="bg-[#0a1a1a] border-cyan-500/20 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Инфраструктура — курортная */}
      {isResort && infraFields.length > 0 && (
        <div className="rounded-2xl bg-[#0f1a14] border border-emerald-500/20 p-4">
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Icon name="Sparkles" className="h-3.5 w-3.5" />
            Инфраструктура и услуги
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {infraFields.map(field => (
              <div key={field.key}>
                <Label className="text-xs text-gray-400 mb-1.5 block">{field.label}</Label>
                <Input
                  placeholder={field.placeholder}
                  value={categoryFields[field.key] ?? ""}
                  onChange={e => onCategoryField(field.key, e.target.value)}
                  className="bg-[#0a140e] border-emerald-500/20 text-white placeholder:text-gray-600 focus-visible:ring-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
