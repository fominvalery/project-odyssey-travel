import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { agencyApi, OrgFull, ROLE_TITLES, isAdmin } from "@/lib/agencyApi"
import { toast } from "@/hooks/use-toast"

const SPECIALIZATIONS = [
  "Коммерческая недвижимость", "Жилая недвижимость", "Загородная недвижимость",
  "Инвестиции в недвижимость", "Складская недвижимость", "Офисная недвижимость",
  "Торговая недвижимость", "Земельные участки", "Отельный бизнес", "Курортная недвижимость",
]

const EXPERIENCE_OPTIONS = ["менее 1 года", "1–3 года", "3–5 лет", "5–10 лет", "более 10 лет"]

interface Props {
  org: OrgFull
  userId: string
  orgId: string
  onSaved: (updated: OrgFull) => void
}

export default function AgencyCardTab({ org, userId, orgId, onSaved }: Props) {
  const canEdit = isAdmin(org.my_role)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: org.name,
    inn: org.inn ?? "",
    logo_url: org.logo_url ?? "",
    description: org.description,
    city: org.city,
    website: org.website,
    telegram_username: org.telegram_username,
    vk_username: org.vk_username,
    bio: org.bio,
    experience: org.experience,
    license_number: org.license_number,
    founded_year: org.founded_year ? String(org.founded_year) : "",
    specializations: org.specializations ?? [],
    is_public: org.is_public,
  })

  function toggleSpec(s: string) {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(s)
        ? f.specializations.filter(x => x !== s)
        : [...f.specializations, s],
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await agencyApi.updateOrgFull(userId, orgId, {
        ...form,
        inn: form.inn || null,
        logo_url: form.logo_url || null,
        founded_year: form.founded_year ? Number(form.founded_year) : null,
      })
      onSaved({ ...org, ...form, founded_year: form.founded_year ? Number(form.founded_year) : null })
      setEditing(false)
      toast({ title: "Карточка АН сохранена" })
    } catch (e: unknown) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "bg-[#0f0f0f] border-[#262626] text-white placeholder:text-gray-600 text-sm"
  const initials = org.name.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Шапка — логотип + название + мета */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6 flex items-start gap-5">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20 rounded-2xl">
            {org.logo_url ? <AvatarImage src={org.logo_url} className="object-cover" /> : null}
            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-white text-xl font-bold rounded-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          {canEdit && editing && (
            <div className="mt-2">
              <Input
                placeholder="URL логотипа"
                value={form.logo_url}
                onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                className={`${inputCls} text-xs h-7`}
              />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={`${inputCls} text-lg font-bold mb-2`} />
          ) : (
            <h2 className="text-xl font-bold text-white mb-1">{org.name}</h2>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
              {ROLE_TITLES[org.my_role]}
            </span>
            {org.rating > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                <Icon name="Star" className="h-3 w-3" />
                {org.rating.toFixed(1)} ({org.review_count} отзывов)
              </span>
            )}
            {org.is_public && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Публичный профиль
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Icon name="Users" className="h-3 w-3" />{org.agents_count} агентов</span>
            <span className="flex items-center gap-1"><Icon name="Handshake" className="h-3 w-3" fallback="CheckCircle" />{org.deals_count} сделок</span>
            {org.city && <span className="flex items-center gap-1"><Icon name="MapPin" className="h-3 w-3" />{org.city}</span>}
            {org.founded_year && <span className="flex items-center gap-1"><Icon name="Calendar" className="h-3 w-3" />с {org.founded_year} года</span>}
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              editing
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-[#1a1a1a] hover:bg-[#222] text-gray-400 hover:text-white border border-[#2a2a2a]"
            }`}
          >
            {saving ? "Сохраняю..." : editing ? "Сохранить" : "Редактировать"}
          </button>
        )}
      </div>

      {/* Основное описание */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 space-y-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-widest">О компании</p>
        {editing ? (
          <textarea rows={4} value={form.bio || form.description}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value, description: e.target.value }))}
            className="w-full bg-[#0f0f0f] border border-[#262626] text-white text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-600"
            placeholder="Расскажите об агентстве, специализации, подходе к работе..." />
        ) : (
          <p className="text-gray-300 text-sm leading-relaxed">
            {org.bio || org.description || <span className="text-gray-600 italic">Описание не заполнено</span>}
          </p>
        )}
      </div>

      {/* Специализации */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5">
        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">Специализации</p>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            SPECIALIZATIONS.map(s => (
              <button key={s} onClick={() => toggleSpec(s)}
                className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                  form.specializations.includes(s)
                    ? "border-violet-500 bg-violet-500/15 text-violet-300"
                    : "border-[#2a2a2a] text-gray-500 hover:text-white hover:border-[#3a3a3a]"
                }`}>
                {s}
              </button>
            ))
          ) : org.specializations?.length ? (
            org.specializations.map(s => (
              <span key={s} className="px-3 py-1 rounded-full text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300">{s}</span>
            ))
          ) : (
            <span className="text-gray-600 text-sm italic">Не указаны</span>
          )}
        </div>
      </div>

      {/* Реквизиты и контакты */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-5 space-y-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-widest">Контакты и реквизиты</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editing ? (
            <>
              <div><Label className="text-xs text-gray-400 mb-1 block">Город</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Москва" className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400 mb-1 block">ИНН</Label>
                <Input value={form.inn} onChange={e => setForm(f => ({ ...f, inn: e.target.value }))} placeholder="7700000000" className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400 mb-1 block">Лицензия / свидетельство</Label>
                <Input value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} placeholder="№ 77-001234" className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400 mb-1 block">Год основания</Label>
                <Input value={form.founded_year} onChange={e => setForm(f => ({ ...f, founded_year: e.target.value }))} placeholder="2015" className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400 mb-1 block">Сайт</Label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://myagency.ru" className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400 mb-1 block">Telegram</Label>
                <Input value={form.telegram_username} onChange={e => setForm(f => ({ ...f, telegram_username: e.target.value }))} placeholder="@agency" className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400 mb-1 block">ВКонтакте</Label>
                <Input value={form.vk_username} onChange={e => setForm(f => ({ ...f, vk_username: e.target.value }))} placeholder="vk.com/agency" className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400 mb-1 block">Опыт на рынке</Label>
                <select value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                  className={`${inputCls} w-full rounded-xl px-3 py-2 bg-[#0f0f0f] border border-[#262626]`}>
                  <option value="">Выберите...</option>
                  {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </>
          ) : (
            [
              { icon: "MapPin", label: "Город", value: org.city },
              { icon: "Hash", label: "ИНН", value: org.inn },
              { icon: "Shield", label: "Лицензия", value: org.license_number },
              { icon: "Calendar", label: "Год основания", value: org.founded_year ? String(org.founded_year) : "" },
              { icon: "Globe", label: "Сайт", value: org.website },
              { icon: "Send", label: "Telegram", value: org.telegram_username },
              { icon: "Users", label: "ВКонтакте", value: org.vk_username },
              { icon: "Briefcase", label: "Опыт", value: org.experience },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex items-center gap-2 text-sm">
                <Icon name={row.icon as "MapPin"} className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-500 shrink-0">{row.label}:</span>
                <span className="text-white truncate">{row.value}</span>
              </div>
            ))
          )}
        </div>

        {editing && (
          <div className="flex items-center gap-3 pt-2 border-t border-[#1f1f1f]">
            <button
              onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                form.is_public
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "border-[#2a2a2a] text-gray-500"
              }`}
            >
              <Icon name={form.is_public ? "Eye" : "EyeOff"} className="h-3.5 w-3.5" />
              {form.is_public ? "Виден в Сети" : "Скрыт из Сети"}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
            {saving ? "Сохраняю..." : "Сохранить карточку"}
          </button>
          <button onClick={() => setEditing(false)}
            className="px-6 py-3 rounded-xl border border-[#2a2a2a] text-gray-400 hover:text-white text-sm transition-colors">
            Отмена
          </button>
        </div>
      )}
    </div>
  )
}
