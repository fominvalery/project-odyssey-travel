import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { CATEGORIES, getCategoryFields, RESIDENTIAL_RENT_FIELDS, COMMERCIAL_RENT_FIELDS_OFFICE, COMMERCIAL_RENT_FIELDS_DEFAULT } from "../wizardTypes"
import type { WizardForm } from "../wizardTypes"

function formatPrice(val: string): string {
  const digits = val.replace(/\D/g, "")
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

function unformatPrice(val: string): string {
  return val.replace(/\s/g, "")
}

// Ключи полей которые нужно форматировать как числа с пробелами
const PRICE_KEYS = new Set([
  "rent", "start_price", "deposit", "entry_price",
  "annual_revenue", "avg_check",
  "rent_price_sqm", "opex", "owner_fee",
])

interface Step3Props {
  form: WizardForm
  setForm: (f: WizardForm) => void
  category: string
  subtype: string
  categoryFields: Record<string, string>
  onCategoryField: (key: string, value: string) => void
  dealType?: string
}

const RESORT_FINANCE_KEYS = new Set(["occupancy", "avg_check", "annual_revenue", "yield", "payback", "entry_price", "revenue_model", "forecast_occupancy"])
const RESORT_INFRA_KEYS = new Set(["pool", "spa", "restaurant", "beach", "parking", "conference"])

function getRentFields(category: string, subtype: string) {
  if (category === "residential") return RESIDENTIAL_RENT_FIELDS
  if (category === "commercial") {
    if (subtype === "Офис / БЦ") return COMMERCIAL_RENT_FIELDS_OFFICE
    return COMMERCIAL_RENT_FIELDS_DEFAULT
  }
  return []
}

export function Step3Details({
  form, setForm, category, subtype, categoryFields, onCategoryField, dealType,
}: Step3Props) {
  const catLabel = CATEGORIES.find(c => c.id === category)?.label ?? ""
  const isResort = category === "resort"
  const isRent = dealType === "rent"
  const showDealBadge = (category === "commercial" || category === "residential") && dealType

  const fields = isRent
    ? getRentFields(category, subtype)
    : getCategoryFields(category, subtype)

  const financeFields = isResort ? fields.filter(f => RESORT_FINANCE_KEYS.has(f.key)) : []
  const infraFields = isResort ? fields.filter(f => RESORT_INFRA_KEYS.has(f.key)) : []
  const mainFields = isResort ? fields.filter(f => !RESORT_FINANCE_KEYS.has(f.key) && !RESORT_INFRA_KEYS.has(f.key)) : fields

  const priceLabel = isResort
    ? "Цена входа / Стоимость (₽)"
    : isRent
      ? "Стоимость аренды (₽/мес)"
      : "Цена (₽)"

  const pricePlaceholder = isResort
    ? "120 000 000"
    : isRent
      ? "150 000"
      : "18 500 000"

  return (
    <div className="space-y-6">
      {/* Бейдж типа сделки */}
      {showDealBadge && (
        <div className={`flex items-center gap-2 text-xs rounded-xl px-4 py-2.5 ${
          isRent
            ? "text-emerald-300 bg-emerald-500/10 border border-emerald-500/20"
            : "text-blue-300 bg-blue-500/10 border border-blue-500/20"
        }`}>
          <Icon name={isRent ? "KeyRound" : "Tag"} className="h-3.5 w-3.5 shrink-0" />
          <span>
            {isRent ? "Аренда" : "Продажа"}
            {subtype ? ` · ${subtype}` : ""} — характеристики подобраны автоматически
          </span>
        </div>
      )}

      {/* Подтип — напоминание (для не deal_type категорий) */}
      {subtype && !showDealBadge && (
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
          <Label className="text-xs text-gray-400 mb-1.5 block">{priceLabel}</Label>
          <Input
            placeholder={pricePlaceholder}
            value={formatPrice(form.price)}
            onChange={e => setForm({ ...form, price: unformatPrice(e.target.value) })}
            inputMode="numeric"
            className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-400 mb-1.5 block">Площадь (м²)</Label>
          <Input
            placeholder={isResort ? "2 400" : "142"}
            value={form.area}
            onChange={e => setForm({ ...form, area: e.target.value })}
            className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Основные характеристики */}
      {mainFields.length > 0 && (
        <div className={`border-t pt-4 ${isResort ? "border-cyan-500/20" : isRent ? "border-emerald-500/20" : "border-[#1f1f1f]"}`}>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${
            isResort ? "text-cyan-400" : isRent ? "text-emerald-400" : "text-blue-400"
          }`}>
            {catLabel}{subtype ? ` · ${subtype}` : ""} — {isRent ? "условия аренды" : "параметры объекта"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mainFields.map(field => {
              const isNum = PRICE_KEYS.has(field.key)
              const val = categoryFields[field.key] ?? ""
              return (
                <div key={field.key}>
                  <Label className="text-xs text-gray-400 mb-1.5 block">{field.label}</Label>
                  <Input
                    placeholder={field.placeholder}
                    value={isNum ? formatPrice(val) : val}
                    onChange={e => onCategoryField(field.key, isNum ? unformatPrice(e.target.value) : e.target.value)}
                    inputMode={isNum ? "numeric" : undefined}
                    className={`bg-[#111] text-white placeholder:text-gray-600 ${
                      isRent ? "border-emerald-500/20 focus-visible:ring-emerald-500" : "border-[#1f1f1f]"
                    }`}
                  />
                </div>
              )
            })}
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
            {financeFields.map(field => {
              const isNum = PRICE_KEYS.has(field.key)
              const val = categoryFields[field.key] ?? ""
              return (
                <div key={field.key}>
                  <Label className="text-xs text-gray-400 mb-1.5 block">{field.label}</Label>
                  <Input
                    placeholder={field.placeholder}
                    value={isNum ? formatPrice(val) : val}
                    onChange={e => onCategoryField(field.key, isNum ? unformatPrice(e.target.value) : e.target.value)}
                    inputMode={isNum ? "numeric" : undefined}
                    className="bg-[#0a1a1a] border-cyan-500/20 text-white placeholder:text-gray-600 focus-visible:ring-cyan-500"
                  />
                </div>
              )
            })}
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