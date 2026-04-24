import { useState, useEffect, lazy, Suspense } from "react"
import Icon from "@/components/ui/icon"
import func2url from "../../../backend/func2url.json"
import { ReferralStats, WithdrawalRequest } from "@/components/referral/referralTypes"
import DashboardReferralHeader from "@/components/referral/DashboardReferralHeader"
import DashboardReferralStats from "@/components/referral/DashboardReferralStats"
import DashboardReferralTabs from "@/components/referral/DashboardReferralTabs"

const WithdrawalModal = lazy(() => import("@/components/referral/WithdrawalModal"))

// --- CRM ---
export { DashboardCRM } from "./DashboardCRM"

// --- Profile ---
export { DashboardProfile } from "./DashboardProfile"

const AUTH_URL = (func2url as Record<string, string>)["auth-email-auth"]

interface ReferralProps {
  userId: string
}

type TabId = "referrals" | "commissions" | "bonuses" | "withdrawals"

export function DashboardReferral({ userId }: ReferralProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("referrals")
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetch(`${AUTH_URL}?action=referral-stats&user_id=${encodeURIComponent(userId)}`)
      .then(r => r.text())
      .then(raw => {
        const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
        if (data && !data.error) setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    if (activeTab !== "withdrawals" || !userId || withdrawals.length > 0) return
    setWithdrawalsLoading(true)
    fetch(`${AUTH_URL}?action=withdrawal-history&user_id=${encodeURIComponent(userId)}`)
      .then(r => r.text())
      .then(raw => {
        const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
        if (data?.requests) setWithdrawals(data.requests)
      })
      .catch(() => {})
      .finally(() => setWithdrawalsLoading(false))
  }, [activeTab, userId])

  const refreshWithdrawals = () => {
    if (!userId) return
    setWithdrawalsLoading(true)
    fetch(`${AUTH_URL}?action=withdrawal-history&user_id=${encodeURIComponent(userId)}`)
      .then(r => r.text())
      .then(raw => {
        const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
        if (data?.requests) setWithdrawals(data.requests)
      })
      .catch(() => {})
      .finally(() => setWithdrawalsLoading(false))
  }

  const siteOrigin = window.location.hostname.includes("poehali.dev") || window.location.hostname.includes("localhost")
    ? "https://kabinet-24.ru"
    : window.location.origin
  const refLink = `${siteOrigin}/?ref=${stats?.ref_code ?? userId?.slice(0, 8) ?? "xxxxxxxx"}`

  const copyLink = () => {
    navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Партнёрская программа</h1>
      <p className="text-gray-400 text-sm mb-6">Приглашайте друзей и получайте бонусы за каждую регистрацию и активацию.</p>

      <DashboardReferralHeader
        stats={stats}
        loading={loading}
        refLink={refLink}
        copied={copied}
        onCopy={copyLink}
      />

      <DashboardReferralStats
        stats={stats}
        loading={loading}
        onWithdrawClick={() => setWithdrawalOpen(true)}
        userId={userId}
        onBalanceUpdate={(newBalance) => setStats(s => s ? { ...s, balance: newBalance } : s)}
      />

      <DashboardReferralTabs
        stats={stats}
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        withdrawals={withdrawals}
        withdrawalsLoading={withdrawalsLoading}
        onNewWithdrawal={() => setWithdrawalOpen(true)}
      />

      {/* Как это работает */}
      <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="Lightbulb" className="h-4 w-4 text-blue-400" /> Как это работает
        </h2>
        <div className="flex flex-col gap-3">
          {[
            "Поделитесь своей реферальной ссылкой с друзьями.",
            "Друг регистрируется по вашей ссылке — связь записывается автоматически.",
            "Друг создаёт свой первый объект — вам начисляется 20 бонусов.",
            "Получайте от 5% до 10% от платежей рефералов (в зависимости от уровня).",
            "На уровне «Адвокат» — дополнительно 2% от платежей рефералов ваших рефералов (2-я линия).",
            "Выводите деньги (с уровня Бизнес) или конвертируйте в AI-кредиты.",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
              <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>

      <Suspense fallback={null}>
        <WithdrawalModal
          open={withdrawalOpen}
          onClose={() => {
            setWithdrawalOpen(false)
            setWithdrawals([])
            refreshWithdrawals()
            setActiveTab("withdrawals")
          }}
          userId={userId}
          earnedTotal={stats?.earned_total ?? 0}
        />
      </Suspense>
    </div>
  )
}