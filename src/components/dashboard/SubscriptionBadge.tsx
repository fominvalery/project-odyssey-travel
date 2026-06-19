import { type UserProfile } from "@/hooks/useAuth"

interface Props {
  user: UserProfile
}

export default function SubscriptionBadge({ user }: Props) {
  if (user.status !== "broker") return null

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium bg-blue-500/15 border-blue-500/30 text-blue-400">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
      Клуб
    </div>
  )
}
