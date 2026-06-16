import { useState, useEffect } from "react"
import func2url from "../../../backend/func2url.json"
import { ReferralStats } from "@/components/referral/referralTypes"
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

export function DashboardReferral({ userId }: ReferralProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const authHeaders = { "X-User-Id": userId }

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetch(`${AUTH_URL}?action=referral-stats&user_id=${encodeURIComponent(userId)}`, { headers: authHeaders })
      .then(r => r.text())
      .then(raw => {
        const data = JSON.parse(raw.startsWith('"') ? JSON.parse(raw) : raw)
        if (data && !data.error) { setStats(data) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

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
      />
    </div>
  )
}
