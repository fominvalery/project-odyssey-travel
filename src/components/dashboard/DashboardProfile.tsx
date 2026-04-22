import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Icon from "@/components/ui/icon"
import { STATUS_LABELS } from "@/hooks/useAuth"

type UserStatus = "basic" | "broker" | "agency"

interface ProfileProps {
  user: { name: string; email: string; plan: string; avatar: string | null; status: UserStatus }
  initials: string
  form: { name: string; phone: string; company: string }
  setForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; company: string }>>
  saved: boolean
  onSave: (e: React.FormEvent) => void
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onStatusChange: (status: UserStatus) => void
}

export function DashboardProfile({ user, initials, form, setForm, saved, onSave, onAvatarChange }: ProfileProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

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
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
        </div>
        <div>
          <p className="font-bold">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Icon name="Star" className="h-3 w-3" />
            {STATUS_LABELS[user.status as keyof typeof STATUS_LABELS] ?? user.status}
          </span>
        </div>
      </div>

      {/* Личные данные */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-6 max-w-xl">
        <h2 className="font-semibold mb-5">Личные данные</h2>
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">ФИО</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Телефон</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Компания</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="bg-[#0f0f0f] border-[#262626] text-white focus-visible:ring-blue-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Email</Label>
            <Input value={user.email} disabled className="bg-[#0a0a0a] border-[#1f1f1f] text-gray-600 cursor-not-allowed" />
          </div>
          <GlowButton type="submit" className="w-full rounded-xl py-2 text-sm">
            {saved ? <span className="flex items-center gap-2"><Icon name="CheckCircle" className="h-4 w-4" />Сохранено</span> : "Сохранить"}
          </GlowButton>
        </form>
      </div>
    </div>
  )
}