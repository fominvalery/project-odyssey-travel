import { useRef, useState } from "react"
import { GlowButton } from "@/components/ui/glow-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { STATUS_LABELS } from "@/hooks/useAuth"
import AvatarCropModal from "./AvatarCropModal"

type UserStatus = "basic" | "broker" | "agency"

export interface ProfileForm {
  firstName: string
  lastName: string
  middleName: string
  name: string
  phone: string
  company: string
  city: string
  specializations: string[]
  bio: string
  experience: string
  telegram: string
  vk: string
  max: string
  website: string
}

interface ProfileProps {
  user: { name: string; email: string; plan: string; avatar: string | null; status: UserStatus }
  initials: string
  form: ProfileForm
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>
  saved: boolean
  onSave: (e: React.FormEvent) => void
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAvatarCropped: (dataUrl: string) => void
  onStatusChange: (status: UserStatus) => void
  forceShowClubFields?: boolean
}

const SPECIALIZATIONS = [
  "Коммерческая недвижимость",
  "Жилая недвижимость",
  "Загородная недвижимость",
  "Инвестиции в недвижимость",
  "Складская недвижимость",
  "Офисная недвижимость",
  "Торговая недвижимость",
  "Земельные участки",
  "Отельный бизнес",
  "Другое",
]

const isBroker = (status: UserStatus) => status === "broker" || status === "agency"

function SpecializationPicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  function toggle(s: string) {
    if (value.includes(s)) {
      onChange(value.filter(v => v !== s))
    } else {
      onChange([...value, s])
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between rounded-xl bg-[#0f0f0f] border border-[#262626] text-sm px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-violet-500 hover:border-[#383838] transition-colors"
      >
        <span className={value.length === 0 ? "text-gray-600" : "text-white"}>
          {value.length === 0 ? "Выберите специализации" : `Выбрано: ${value.length}`}
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-gray-500 shrink-0" />
      </button>

      {open && (
        <div className="rounded-xl bg-[#0f0f0f] border border-[#262626] overflow-hidden">
          {SPECIALIZATIONS.map(s => {
            const checked = value.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0 ${
                  checked ? "text-white" : "text-gray-400"
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                  checked ? "bg-violet-600 border-violet-500" : "border-[#3a3a3a]"
                }`}>
                  {checked && <Icon name="Check" className="h-2.5 w-2.5 text-white" />}
                </div>
                {s}
              </button>
            )
          })}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(s => (
            <span key={s} className="inline-flex items-center gap-1 text-xs bg-violet-500/15 text-violet-300 border border-violet-500/25 px-2 py-0.5 rounded-lg">
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:text-white transition-colors">
                <Icon name="X" className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function DashboardProfile({ user, initials, form, setForm, saved, onSave, onAvatarChange, onAvatarCropped, forceShowClubFields }: ProfileProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const club = isBroker(user.status) || !!forceShowClubFields
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const displayName = [form.firstName, form.lastName, form.middleName].filter(Boolean).join(" ") || user.name

  const handleSave = (e: React.FormEvent) => {
    onSave(e)
    setEditing(false)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  function handleCropSave(croppedDataUrl: string) {
    setCropSrc(null)
    onAvatarCropped(croppedDataUrl)
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

      {/* Модалка кропа */}
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onClose={() => setCropSrc(null)}
          onSave={handleCropSave}
        />
      )}

      {/* Аватар + имя */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5 flex items-center gap-5 mb-5">
        <div className="relative">
          <Avatar className="h-16 w-16 cursor-pointer" onClick={() => fileRef.current?.click()}>
            {user.avatar ? <AvatarImage src={user.avatar} /> : null}
            <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">{initials}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center border-2 border-[#111]"
          >
            <Icon name="Camera" className="h-3 w-3 text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>
        <div>
          <p className="font-bold text-base">{displayName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          {form.city && <p className="text-xs text-gray-500 mt-0.5">{form.city}</p>}
          <span className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border ${
            club
              ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
          }`}>
            <Icon name={club ? "Zap" : "User"} className="h-3 w-3" />
            {STATUS_LABELS[user.status as keyof typeof STATUS_LABELS] ?? user.status}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Основные данные */}
        <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-6">
          <h2 className="font-semibold mb-5 text-sm uppercase tracking-widest text-gray-400">Основные данные</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Имя <span className="text-red-400">*</span></Label>
              {editing ? (
                <Input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value, name: [e.target.value, form.lastName, form.middleName].filter(Boolean).join(" ") })}
                  placeholder="Иван"
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-white py-2 min-h-[38px]">{form.firstName || <span className="text-gray-500">—</span>}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Фамилия <span className="text-red-400">*</span></Label>
              {editing ? (
                <Input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value, name: [form.firstName, e.target.value, form.middleName].filter(Boolean).join(" ") })}
                  placeholder="Иванов"
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-white py-2 min-h-[38px]">{form.lastName || <span className="text-gray-500">—</span>}</p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-gray-400">Отчество <span className="text-gray-600">(по желанию)</span></Label>
              {editing ? (
                <Input
                  value={form.middleName}
                  onChange={(e) => setForm({ ...form, middleName: e.target.value, name: [form.firstName, form.lastName, e.target.value].filter(Boolean).join(" ") })}
                  placeholder="Иванович"
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-white py-2 min-h-[38px]">{form.middleName || <span className="text-gray-500">—</span>}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Телефон</Label>
              {editing ? (
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+7 900 000-00-00"
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500" />
              ) : (
                <p className="text-sm text-white py-2 min-h-[38px]">{form.phone || <span className="text-gray-500">—</span>}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Email</Label>
              <Input value={user.email} disabled className="bg-[#0a0a0a] border-[#1f1f1f] text-gray-600 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Компания</Label>
              {editing ? (
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="ООО Ромашка"
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500" />
              ) : (
                <p className="text-sm text-white py-2 min-h-[38px]">{form.company || <span className="text-gray-500">—</span>}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Город</Label>
              {editing ? (
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Москва"
                  className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500" />
              ) : (
                <p className="text-sm text-white py-2 min-h-[38px]">{form.city || <span className="text-gray-500">—</span>}</p>
              )}
            </div>
          </div>
        </div>

        {/* Карточка участника Клуба */}
        {club && (
          <div className="rounded-2xl bg-[#111111] border border-violet-500/20 p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Icon name="Zap" className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <h2 className="font-semibold text-sm uppercase tracking-widest text-violet-400">Карточка Клуба</h2>
            </div>
            <p className="text-xs text-gray-500 mb-5">Ваш публичный профиль для поиска партнёров и клиентов внутри сети</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-gray-400">Специализация</Label>
                {editing ? (
                  <SpecializationPicker value={form.specializations} onChange={(v) => setForm({ ...form, specializations: v })} />
                ) : (
                  <div className="flex flex-wrap gap-1.5 py-2 min-h-[38px]">
                    {form.specializations.length > 0 ? form.specializations.map(s => (
                      <span key={s} className="text-xs bg-violet-500/15 text-violet-300 border border-violet-500/25 px-2 py-0.5 rounded-lg">{s}</span>
                    )) : <span className="text-gray-600 text-sm">—</span>}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Опыт работы</Label>
                {editing ? (
                  <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500">
                    <option value="">Укажите опыт</option>
                    <option value="до 1 года">до 1 года</option>
                    <option value="1–3 года">1–3 года</option>
                    <option value="3–5 лет">3–5 лет</option>
                    <option value="5–10 лет">5–10 лет</option>
                    <option value="более 10 лет">более 10 лет</option>
                  </select>
                ) : (
                  <p className="text-sm text-white py-2 min-h-[38px]">{form.experience || <span className="text-gray-500">—</span>}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Сайт</Label>
                {editing ? (
                  <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://mysite.ru"
                    className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-violet-500" />
                ) : (
                  <p className="text-sm text-white py-2 min-h-[38px]">{form.website || <span className="text-gray-500">—</span>}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-gray-400">О себе</Label>
                {editing ? (
                  <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Расскажите о своём опыте, экспертизе и чём вы можете помочь партнёрам..."
                    rows={3}
                    className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-gray-600" />
                ) : (
                  <p className="text-sm text-white py-2 min-h-[38px]">{form.bio || <span className="text-gray-500">—</span>}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Icon name="Send" className="h-3 w-3" /> Telegram
                </Label>
                {editing ? (
                  <Input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })}
                    placeholder="@username"
                    className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-violet-500" />
                ) : (
                  <p className="text-sm text-white py-2 min-h-[38px]">{form.telegram || <span className="text-gray-500">—</span>}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Icon name="Users" className="h-3 w-3" /> ВКонтакте
                </Label>
                {editing ? (
                  <Input value={form.vk} onChange={(e) => setForm({ ...form, vk: e.target.value })}
                    placeholder="vk.com/username"
                    className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-violet-500" />
                ) : (
                  <p className="text-sm text-white py-2 min-h-[38px]">{form.vk || <span className="text-gray-500">—</span>}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Icon name="MessageCircle" className="h-3 w-3" /> MAX
                </Label>
                {editing ? (
                  <Input value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value })}
                    placeholder="Ссылка или username в MAX"
                    className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-violet-500" />
                ) : (
                  <p className="text-sm text-white py-2 min-h-[38px]">{form.max || <span className="text-gray-500">—</span>}</p>
                )}
              </div>
            </div>

            {/* Превью карточки */}
            {(form.specializations.length > 0 || form.bio || form.experience) && (
              <div className="mt-6 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-4">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Предпросмотр карточки</p>
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    {user.avatar ? <AvatarImage src={user.avatar} /> : null}
                    <AvatarFallback className="bg-violet-600 text-white text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{displayName}</p>
                    {form.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {form.specializations.map(s => (
                          <span key={s} className="text-[10px] bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                    {form.city && <p className="text-xs text-gray-500 mt-0.5">{form.city}{form.experience ? ` · ${form.experience}` : ""}</p>}
                    {form.bio && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{form.bio}</p>}
                    <div className="flex gap-3 mt-2">
                      {form.telegram && <span className="text-xs text-violet-400">{form.telegram}</span>}
                      {form.vk && <span className="text-xs text-blue-400">{form.vk}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {editing ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-xl py-2 text-sm border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#444] transition-all"
            >
              Отмена
            </button>
            <GlowButton type="submit" className="flex-1 rounded-xl py-2 text-sm">
              <span className="flex items-center justify-center gap-2">
                <Icon name="Save" className="h-4 w-4" />
                Сохранить
              </span>
            </GlowButton>
          </div>
        ) : (
          <GlowButton
            type="button"
            onClick={() => setEditing(true)}
            className="w-full rounded-xl py-2 text-sm"
          >
            <span className="flex items-center justify-center gap-2">
              <Icon name="Pencil" className="h-4 w-4" />
              Редактировать профиль
            </span>
          </GlowButton>
        )}
      </form>
    </div>
  )
}