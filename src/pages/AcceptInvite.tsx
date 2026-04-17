import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { agencyApi, InviteLookup } from "@/lib/agencyApi"
import { useAuthContext } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [invite, setInvite] = useState<InviteLookup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) return
    ;(async () => {
      setLoading(true)
      try {
        const data = await agencyApi.lookupInvite(token)
        setInvite(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка")
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const accept = async () => {
    if (!user) {
      toast({
        title: "Сначала войдите",
        description: "Зарегистрируйтесь или войдите, чтобы принять приглашение",
      })
      navigate("/?auth=login")
      return
    }
    if (!token) return
    setAccepting(true)
    try {
      const res = await agencyApi.acceptInvite(user.id, token)
      localStorage.setItem("k24_active_org", res.organization_id)
      toast({ title: "Готово", description: "Вы присоединились к агентству" })
      navigate(`/agency/${res.organization_id}`)
    } catch (e) {
      toast({
        title: "Не удалось",
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      })
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 flex items-center justify-center p-4 text-white">
      <Card className="max-w-md w-full bg-white/5 border-white/10 p-8">
        {loading ? (
          <div className="flex items-center gap-3 justify-center py-10">
            <Icon name="Loader2" size={20} className="animate-spin" />
            Проверяем приглашение...
          </div>
        ) : error || !invite ? (
          <div className="text-center space-y-3">
            <Icon name="AlertCircle" size={40} className="text-red-400 mx-auto" />
            <div className="font-semibold">Приглашение недоступно</div>
            <div className="text-sm text-slate-400">
              {error || "Ссылка неверна или устарела"}
            </div>
            <Button onClick={() => navigate("/")} variant="outline">
              На главную
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {invite.logo_url ? (
                <img
                  src={invite.logo_url}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                  <Icon name="Building2" size={22} />
                </div>
              )}
              <div>
                <div className="text-xs text-violet-300 tracking-wider">ПРИГЛАШЕНИЕ</div>
                <div className="font-bold text-lg">{invite.organization_name}</div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Приглашён:</span>
                <span>{invite.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span>{invite.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Роль:</span>
                <span className="font-medium text-violet-200">{invite.role_title}</span>
              </div>
            </div>

            {user ? (
              <Button
                onClick={accept}
                disabled={accepting}
                className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90"
              >
                {accepting ? "Принимаем..." : "Присоединиться к агентству"}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-slate-300 text-center">
                  Войдите или зарегистрируйтесь, чтобы принять приглашение
                </div>
                <Button
                  onClick={() => navigate("/?auth=login")}
                  className="w-full bg-gradient-to-r from-violet-500 to-pink-500"
                >
                  Войти / Зарегистрироваться
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
