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
const RATING_URL = (func2url as Record<string, string>)["agent-rating"]

interface ReferralProps {
  userId: string
}

interface MyRatingData {
  rank: number
  total: number
  points: number
  deal_count: number
  active_listings: number
  months_on_platform: number
  profile_score: number
  agent_status: string
  activity: string
}

export function DashboardReferral({ userId }: ReferralProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [myRating, setMyRating] = useState<MyRatingData | null>(null)
  const [ratingLoading, setRatingLoading] = useState(true)

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

  useEffect(() => {
    if (!userId) return
    setRatingLoading(true)
    fetch(`${RATING_URL}?user_id=${encodeURIComponent(userId)}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data?.my_data && data?.total) {
          setMyRating({ ...data.my_data, total: data.total })
        }
      })
      .catch(() => {})
      .finally(() => setRatingLoading(false))
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
        myRating={myRating}
        ratingLoading={ratingLoading}
      />

      <DashboardReferralTabs
        stats={stats}
        loading={loading}
      />
    </div>
  )
}
