import { useState, useEffect } from "react"
import func2url from "../../../backend/func2url.json"
import { ReferralStats, WithdrawalRequest } from "@/components/referral/referralTypes"
import { cacheGet, cacheSet, TTL } from "@/lib/cache"
import DashboardReferralHeader from "@/components/referral/DashboardReferralHeader"
import DashboardReferralTabs from "@/components/referral/DashboardReferralTabs"

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
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)

  const authHeaders = { "X-User-Id": userId }

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetch(`${AUTH_URL}?action=referral-stats&user_id=${encodeURIComponent(userId)}`, { headers: authHeaders })
      .then(r => r.text())
      .then(raw => {
        console.log('[referral-stats] raw response:', raw.slice(0, 300))
        const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
        console.log('[referral-stats] parsed:', data)
        if (data && !data.error) { setStats(data) }
        else { console.warn('[referral-stats] error from backend:', data) }
      })
      .catch((e) => { console.error('[referral-stats] fetch error:', e) })
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    if (activeTab !== "withdrawals" || !userId || withdrawals.length > 0) return
    const cacheKey = `withdrawal_history:${userId}`
    const cached = cacheGet<WithdrawalRequest[]>(cacheKey)
    if (cached) { setWithdrawals(cached); return }
    setWithdrawalsLoading(true)
    fetch(`${AUTH_URL}?action=withdrawal-history&user_id=${encodeURIComponent(userId)}`, { headers: authHeaders })
      .then(r => r.text())
      .then(raw => {
        const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
        if (data?.requests) { setWithdrawals(data.requests); cacheSet(cacheKey, data.requests, TTL.HOUR_1) }
      })
      .catch(() => {})
      .finally(() => setWithdrawalsLoading(false))
  }, [activeTab, userId])

  const refreshWithdrawals = () => {
    if (!userId) return
    setWithdrawalsLoading(true)
    fetch(`${AUTH_URL}?action=withdrawal-history&user_id=${encodeURIComponent(userId)}`, { headers: authHeaders })
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
      <h1 className="text-2xl font-bold mb-6">Ваш рейтинг в «Кабинет-24»</h1>

      <DashboardReferralHeader
        stats={stats}
        loading={loading}
        refLink={refLink}
        copied={copied}
        onCopy={copyLink}
      />

      <DashboardReferralTabs
        stats={stats}
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        withdrawals={withdrawals}
        withdrawalsLoading={withdrawalsLoading}
        onNewWithdrawal={() => {}}
      />




    </div>
  )
}