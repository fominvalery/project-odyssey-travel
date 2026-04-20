import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../backend/func2url.json"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

const planLabels: Record<string, { label: string; color: string; price: string }> = {
  basic: { label: "Базовый", color: "text-green-400 bg-green-500/10 border-green-500/20", price: "Бесплатно" },
  pro: { label: "Клуб", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", price: "990 ₽/мес" },
  business: { label: "Бизнес", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", price: "14 900 ₽/мес" },
}

type View = "register" | "verify" | "login" | "forgot" | "forgot-verify" | "success"

interface RegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId?: string
}

export function RegisterModal({ open, onOpenChange, planId = "basic" }: RegisterModalProps) {
  const { register, login: ctxLogin } = useAuthContext()
  const navigate = useNavigate()
  const plan = planLabels[planId] ?? planLabels.basic

  const [view, setView] = useState<View>("register")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [verifyCode, setVerifyCode] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")

  function resetState() {
    setView("register")
    setLoading(false)
    setErrorMsg("")
    setSuccessMsg("")
    setVerifyCode("")
    setResetCode("")
    setNewPassword("")
  }

  function handleClose(v: boolean) {
    onOpenChange(v)
    if (!v) setTimeout(resetState, 300)
  }

  async function apiPost(action: string, body: object) {
    const res = await fetch(`${AUTH_URL}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const raw = await res.text()
    const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
    return { ok: res.ok, status: res.status, data }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    setLoading(true)
    try {
      const { ok, status, data } = await apiPost("register", {
        email: form.email,
        password: form.password,
        name: form.name,
      })
      if (status === 409) { setErrorMsg("Пользователь с таким email уже зарегистрирован"); return }
      if (!ok) { setErrorMsg(data?.error || "Ошибка регистрации"); return }

      if (data.email_verification_required) {
        setView("verify")
      } else {
        await doLogin(form.email, form.password)
      }
    } catch {
      setErrorMsg("Ошибка сети, попробуйте снова")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    setLoading(true)
    try {
      const { ok, data } = await apiPost("verify-email", { email: form.email, code: verifyCode })
      if (!ok) { setErrorMsg(data?.error || "Неверный код"); return }
      await doLogin(form.email, form.password)
    } catch {
      setErrorMsg("Ошибка сети, попробуйте снова")
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    setLoading(true)
    try {
      await doLogin(form.email, form.password)
    } catch {
      setErrorMsg("Ошибка сети, попробуйте снова")
    } finally {
      setLoading(false)
    }
  }

  async function doLogin(email: string, password: string) {
    const result = await ctxLogin(email, password)
    if (result.ok) {
      setView("success")
    } else {
      setErrorMsg(result.error || "Неверный email или пароль")
    }
  }

  async function handleForgotRequest(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    setLoading(true)
    try {
      const { ok, data } = await apiPost("reset-password", { email: resetEmail })
      if (!ok) { setErrorMsg(data?.error || "Ошибка"); return }
      setSuccessMsg("Код отправлен на вашу почту")
      setView("forgot-verify")
    } catch {
      setErrorMsg("Ошибка сети, попробуйте снова")
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotVerify(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg("")
    setLoading(true)
    try {
      const { ok, data } = await apiPost("reset-password", {
        email: resetEmail,
        code: resetCode,
        new_password: newPassword,
      })
      if (!ok) { setErrorMsg(data?.error || "Неверный код или пароль слишком короткий"); return }
      setSuccessMsg("Пароль успешно изменён. Войдите с новым паролем.")
      setForm(f => ({ ...f, email: resetEmail, password: "" }))
      setView("login")
    } catch {
      setErrorMsg("Ошибка сети, попробуйте снова")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "bg-[#0f0f0f] border-[#262626] text-white placeholder-gray-600 focus:border-blue-500"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#141414] border border-[#262626] text-white max-w-md p-0 overflow-hidden">

        {/* Успех */}
        {view === "success" && (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
              <Icon name="CheckCircle" className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Добро пожаловать!</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Вы успешно вошли в систему. Переходите в личный кабинет.
            </p>
            <Button onClick={() => { handleClose(false); navigate("/dashboard") }} className="rounded-full bg-blue-600 hover:bg-blue-700 text-white mt-2 px-8">
              Перейти в кабинет
            </Button>
            <button onClick={() => handleClose(false)} className="text-xs text-gray-500 hover:text-gray-400">
              Закрыть
            </button>
          </div>
        )}

        {/* Регистрация */}
        {view === "register" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
                  <Icon name="UserPlus" className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">Регистрация</DialogTitle>
                  <p className="text-xs text-gray-500">Создайте аккаунт Кабинет-24</p>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium w-fit mb-2 ${plan.color}`}>
                <Icon name="CheckCircle" className="h-3.5 w-3.5" />
                Тариф: {plan.label} — {plan.price}
              </div>
            </DialogHeader>

            <form onSubmit={handleRegister} className="px-6 pb-6 pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Ваше имя</Label>
                <Input required placeholder="Иван Иванов" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Email</Label>
                <Input required type="email" placeholder="ivan@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Пароль</Label>
                <div className="relative">
                  <Input required type={showPassword ? "text" : "password"} placeholder="Минимум 6 символов"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    <Icon name={showPassword ? "EyeOff" : "Eye"} className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <Icon name="AlertCircle" className="h-3.5 w-3.5 shrink-0" />{errorMsg}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Регистрация..." : "Создать аккаунт"}
              </Button>

              <p className="text-center text-xs text-gray-500">
                Уже есть аккаунт?{" "}
                <button type="button" onClick={() => { setErrorMsg(""); setView("login") }}
                  className="text-blue-400 hover:underline">Войти</button>
              </p>
            </form>
          </>
        )}

        {/* Верификация email */}
        {view === "verify" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
                  <Icon name="Mail" className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">Подтвердите email</DialogTitle>
                  <p className="text-xs text-gray-500">Код отправлен на {form.email}</p>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleVerify} className="px-6 pb-6 pt-4 space-y-4">
              <p className="text-sm text-gray-400">
                Введите 6-значный код из письма для подтверждения аккаунта.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Код подтверждения</Label>
                <Input required placeholder="123456" maxLength={6} value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  className={`${inputCls} text-center text-2xl tracking-widest font-bold`} />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <Icon name="AlertCircle" className="h-3.5 w-3.5 shrink-0" />{errorMsg}
                </p>
              )}

              <Button type="submit" disabled={loading || verifyCode.length !== 6}
                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Проверка..." : "Подтвердить"}
              </Button>

              <p className="text-center text-xs text-gray-500">
                <button type="button" onClick={() => { setErrorMsg(""); setView("register") }}
                  className="text-gray-500 hover:text-gray-300">← Назад</button>
              </p>
            </form>
          </>
        )}

        {/* Вход */}
        {view === "login" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
                  <Icon name="LogIn" className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">Вход</DialogTitle>
                  <p className="text-xs text-gray-500">Войдите в аккаунт Кабинет-24</p>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleLogin} className="px-6 pb-6 pt-4 space-y-4">
              {successMsg && (
                <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  {successMsg}
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Email</Label>
                <Input required type="email" placeholder="ivan@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-400">Пароль</Label>
                  <button type="button" onClick={() => { setErrorMsg(""); setSuccessMsg(""); setResetEmail(form.email); setView("forgot") }}
                    className="text-xs text-gray-500 hover:text-blue-400">Забыли пароль?</button>
                </div>
                <div className="relative">
                  <Input required type={showPassword ? "text" : "password"} placeholder="••••••••"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    <Icon name={showPassword ? "EyeOff" : "Eye"} className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <Icon name="AlertCircle" className="h-3.5 w-3.5 shrink-0" />{errorMsg}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Вход..." : "Войти"}
              </Button>

              <p className="text-center text-xs text-gray-500">
                Нет аккаунта?{" "}
                <button type="button" onClick={() => { setErrorMsg(""); setSuccessMsg(""); setView("register") }}
                  className="text-blue-400 hover:underline">Зарегистрироваться</button>
              </p>
            </form>
          </>
        )}

        {/* Сброс пароля — запрос кода */}
        {view === "forgot" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
                  <Icon name="KeyRound" className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">Восстановление пароля</DialogTitle>
                  <p className="text-xs text-gray-500">Отправим код на ваш email</p>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleForgotRequest} className="px-6 pb-6 pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Email</Label>
                <Input required type="email" placeholder="ivan@example.com" value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)} className={inputCls} />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <Icon name="AlertCircle" className="h-3.5 w-3.5 shrink-0" />{errorMsg}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full rounded-full bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? "Отправка..." : "Получить код"}
              </Button>

              <p className="text-center text-xs text-gray-500">
                <button type="button" onClick={() => { setErrorMsg(""); setView("login") }}
                  className="text-gray-500 hover:text-gray-300">← Назад ко входу</button>
              </p>
            </form>
          </>
        )}

        {/* Сброс пароля — ввод кода и нового пароля */}
        {view === "forgot-verify" && (
          <>
            <DialogHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1f1f] border border-[#2a2a2a]">
                  <Icon name="KeyRound" className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">Новый пароль</DialogTitle>
                  <p className="text-xs text-gray-500">Код отправлен на {resetEmail}</p>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleForgotVerify} className="px-6 pb-6 pt-4 space-y-4">
              {successMsg && (
                <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  {successMsg}
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Код из письма</Label>
                <Input required placeholder="123456" maxLength={6} value={resetCode}
                  onChange={e => setResetCode(e.target.value.replace(/\D/g, ""))}
                  className={`${inputCls} text-center text-2xl tracking-widest font-bold`} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">Новый пароль</Label>
                <Input required type="password" placeholder="Минимум 6 символов" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} className={inputCls} />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <Icon name="AlertCircle" className="h-3.5 w-3.5 shrink-0" />{errorMsg}
                </p>
              )}

              <Button type="submit" disabled={loading || resetCode.length !== 6}
                className="w-full rounded-full bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? "Сохранение..." : "Установить пароль"}
              </Button>
            </form>
          </>
        )}

      </DialogContent>
    </Dialog>
  )
}