import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

interface CardField { label: string; key: string; placeholder: string; icon: string; multiline?: boolean }

const SECTIONS: { title: string; icon: string; color: string; fields: CardField[] }[] = [
  {
    title: "Реквизиты",
    icon: "Building2",
    color: "text-orange-400",
    fields: [
      { label: "Полное наименование", key: "company_full", placeholder: "ООО «Кабинет-24»", icon: "Building2" },
      { label: "Краткое наименование", key: "company_short", placeholder: "Кабинет-24", icon: "Hash" },
      { label: "ИНН", key: "inn", placeholder: "7701234567", icon: "Hash" },
      { label: "КПП", key: "kpp", placeholder: "770101001", icon: "Hash" },
      { label: "ОГРН", key: "ogrn", placeholder: "1027700132195", icon: "Hash" },
      { label: "Юридический адрес", key: "legal_address", placeholder: "г. Москва, ул. ...", icon: "MapPin", multiline: true },
      { label: "Фактический адрес", key: "actual_address", placeholder: "г. Москва, ул. ...", icon: "MapPin", multiline: true },
    ],
  },
  {
    title: "Банковские реквизиты",
    icon: "Landmark",
    color: "text-blue-400",
    fields: [
      { label: "Расчётный счёт", key: "bank_account", placeholder: "40702810000000000000", icon: "CreditCard" },
      { label: "Банк", key: "bank_name", placeholder: "АО «Тинькофф Банк»", icon: "Landmark" },
      { label: "БИК", key: "bik", placeholder: "044525974", icon: "Hash" },
      { label: "Кор. счёт", key: "bank_corr", placeholder: "30101810145250000974", icon: "CreditCard" },
    ],
  },
  {
    title: "Контакты",
    icon: "Phone",
    color: "text-emerald-400",
    fields: [
      { label: "Генеральный директор", key: "director", placeholder: "Фамилия Имя Отчество", icon: "User" },
      { label: "Телефон", key: "phone", placeholder: "+7 (495) 000-00-00", icon: "Phone" },
      { label: "Email", key: "email", placeholder: "info@kabinet24.ru", icon: "Mail" },
      { label: "Сайт", key: "website", placeholder: "https://kabinet24.ru", icon: "Globe" },
    ],
  },
  {
    title: "Документы",
    icon: "FileText",
    color: "text-violet-400",
    fields: [
      { label: "Шаблон договора", key: "contract_template", placeholder: "Ссылка или описание...", icon: "FileText", multiline: true },
      { label: "Доверенность", key: "power_of_attorney", placeholder: "Ссылка или описание...", icon: "ScrollText", multiline: true },
      { label: "Примечания", key: "notes", placeholder: "Внутренние заметки...", icon: "StickyNote", multiline: true },
    ],
  },
]

const STORAGE_KEY = "office_card_data"

function loadData(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") } catch { return {} }
}

export default function AdminOfficeCard() {
  const [data, setData] = useState<Record<string, string>>(loadData)
  const [saved, setSaved] = useState(false)

  const update = (key: string, val: string) => setData(prev => ({ ...prev, [key]: val }))

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1f1f1f] shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Карточка офиса</h2>
          <p className="text-xs text-gray-500">Реквизиты, контакты, документы Кабинет-24</p>
        </div>
        <Button onClick={save} className={`text-xs ${saved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#1f1f1f] hover:bg-[#2a2a2a]"} text-white border-0`}>
          {saved
            ? <><Icon name="Check" className="h-3.5 w-3.5 mr-1.5 text-emerald-300" />Сохранено</>
            : <><Icon name="Save" className="h-3.5 w-3.5 mr-1.5" />Сохранить</>
          }
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {SECTIONS.map(section => (
          <div key={section.title} className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#1a1a1a]">
              <Icon name={section.icon as "Building2"} className={`h-4 w-4 ${section.color}`} />
              <span className="font-semibold text-white text-sm">{section.title}</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map(f => (
                <div key={f.key} className={f.multiline ? "md:col-span-2" : ""}>
                  <label className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5 block">
                    <Icon name={f.icon as "Hash"} className="h-3 w-3" />
                    {f.label}
                  </label>
                  {f.multiline ? (
                    <textarea
                      value={data[f.key] || ""}
                      onChange={e => update(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full bg-[#111] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-700 resize-none focus:outline-none focus:border-[#3a3a3a] transition-colors"
                    />
                  ) : (
                    <Input
                      value={data[f.key] || ""}
                      onChange={e => update(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="bg-[#111] border-[#1f1f1f] text-white placeholder:text-gray-700 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
