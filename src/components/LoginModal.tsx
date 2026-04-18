import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../backend/func2url.json"

const AUTH_URL = func2url["auth-email-auth"]

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegister?: () => void
}

type View = "login" | "reset-request" | "reset-confirm"

export function LoginModal({ open, onOpenChange, onRegister }: LoginModalProps) {
  const { login } = useAuthContext()
  const navigate = useNavigate()

  const [view, setView] = useState<View>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // reset flow
  const [resetEmail, setResetEmail] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState("")

  function resetAll() {
    setView("login")
    setError("")
    setResetEmail("")
    setResetCode("")
    setNewPassword("")
    setResetSuccess("")
  }

  function handleClose(open: boolean) {
    if (!open) resetAll()
    onOpenChange(open)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) {
      onOpenChange(false)
      setEmail("")
      setPassword("")
      navigate("/dashboard")
    } else {
      setError(result.error || "Неверный email или пароль")
    }
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await fetch(`${AUTH_URL}?action=reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      })
      setView("reset-confirm")
    } catch {
      setError("Не удалось отправить запрос. Попробуйте позже.")
    }
    setLoading(false)
  }

  async function handleResetConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`${AUTH_URL}?action=reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode, new_password: newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setResetSuccess("Пароль успешно изменён! Теперь войдите с новым паролем.")
        setTimeout(() => resetAll(), 3000)
      } else {
        setError(data.error || "Неверный или истёкший код")
      }
    } catch {
      setError("Ошибка. Попробуйте позже.")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#141414] border border-[#262626] text-white max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
              <Icon name={view === "login" ? "LogIn" : "KeyRound"} className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                {view === "login" && "Войти в платформу"}
                {view === "reset-request" && "Восстановление пароля"}
                {view === "reset-confirm" && "Введите код из письма"}
              </DialogTitle>
              <p className="text-xs text-gray-500">
                {view === "login" && "Кабинет-24 — ваш личный кабинет"}
                {view === "reset-request" && "Отправим код подтверждения на email"}
                {view === "reset-confirm" && `Код отправлен на ${resetEmail}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* LOGIN */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="px-6 pb-6 pt-4 space-y-4">
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-400">Пароль</Label>
                <button
                  type="button"
                  onClick={() => { setResetEmail(email); setView("reset-request"); setError("") }}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Забыли пароль?
                </button>
              </div>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Ваш пароль"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError("") }}
                  className="bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-violet-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} className="h-4 w-4" />
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <Icon name="AlertCircle" className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              {loading ? <span className="flex items-center gap-2"><Icon name="Loader2" className="h-4 w-4 animate-spin" /> Вход...</span> : "Войти"}
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
        )}

        {/* RESET — шаг 1: ввод email */}
        {view === "reset-request" && (
          <form onSubmit={handleResetRequest} className="px-6 pb-6 pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">Email</Label>
              <Input
                required
                type="email"
                placeholder="ivan@example.com"
                value={resetEmail}
                onChange={(e) => { setResetEmail(e.target.value); setError("") }}
                className="bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-violet-500"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <Icon name="AlertCircle" className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
              {loading ? <span className="flex items-center gap-2"><Icon name="Loader2" className="h-4 w-4 animate-spin" /> Отправка...</span> : "Отправить код"}
            </Button>

            <div className="text-center">
              <button type="button" onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-300">
                ← Вернуться ко входу
              </button>
            </div>
          </form>
        )}

        {/* RESET — шаг 2: код + новый пароль */}
        {view === "reset-confirm" && (
          <form onSubmit={handleResetConfirm} className="px-6 pb-6 pt-4 space-y-4">
            {resetSuccess ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
                <Icon name="CheckCircle" className="h-4 w-4 text-green-400 shrink-0" />
                <p className="text-xs text-green-400">{resetSuccess}</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Код из письма</Label>
                  <Input
                    required
                    type="text"
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => { setResetCode(e.target.value); setError("") }}
                    className="bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-violet-500 tracking-widest text-center text-lg"
                    maxLength={6}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Новый пароль</Label>
                  <div className="relative">
                    <Input
                      required
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Новый пароль"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError("") }}
                      className="bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-violet-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <Icon name={showNewPassword ? "EyeOff" : "Eye"} className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <Icon name="AlertCircle" className="h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={loading} className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">
                  {loading ? <span className="flex items-center gap-2"><Icon name="Loader2" className="h-4 w-4 animate-spin" /> Сохранение...</span> : "Сохранить пароль"}
                </Button>

                <div className="text-center space-y-1">
                  <button type="button" onClick={() => setView("reset-request")} className="text-xs text-gray-500 hover:text-gray-300 block w-full">
                    Не пришёл код? Отправить повторно
                  </button>
                  <button type="button" onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-300">
                    ← Вернуться ко входу
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
