import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegister?: () => void
}

export function LoginModal({ open, onOpenChange, onRegister }: LoginModalProps) {
  const { login } = useAuthContext()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const ok = login(email)
    if (ok) {
      onOpenChange(false)
      setEmail("")
    } else {
      setError("Аккаунт не найден. Проверьте email или зарегистрируйтесь.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#141414] border border-[#262626] text-white max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
              <Icon name="LogIn" className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">Войти в платформу</DialogTitle>
              <p className="text-xs text-gray-500">EstatePro — ваш личный кабинет</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Email</Label>
            <Input
              required
              type="email"
              placeholder="ivan@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError("") }}
              className="bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-violet-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <Icon name="AlertCircle" className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white">
            Войти
          </Button>

          <div className="text-center">
            <span className="text-xs text-gray-500">Нет аккаунта? </span>
            <button
              type="button"
              onClick={() => { onOpenChange(false); onRegister?.() }}
              className="text-xs text-violet-400 hover:text-violet-300 underline"
            >
              Зарегистрироваться
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
