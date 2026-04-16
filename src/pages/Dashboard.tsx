import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import { type ObjectData } from "@/components/AddObjectWizard"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import DashboardHome from "@/components/dashboard/DashboardHome"
import DashboardObjects from "@/components/dashboard/DashboardObjects"
import { DashboardCRM, DashboardReferral, DashboardProfile } from "@/components/dashboard/DashboardSections"
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics"
import DashboardSupport from "@/components/dashboard/DashboardSupport"
import AiChatBubble from "@/components/AiChatBubble"

type Section = "dashboard" | "objects" | "crm" | "analytics" | "referral" | "profile" | "support"

const INITIAL_OBJECTS: ObjectData[] = []

export default function Dashboard() {
  const { user, updateProfile, logout } = useAuthContext()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>("dashboard")
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", company: user?.company ?? "" })
  const [saved, setSaved] = useState(false)
  const [objects, setObjects] = useState<ObjectData[]>(INITIAL_OBJECTS)
  const [showWizard, setShowWizard] = useState(false)
  const [catFilter, setCatFilter] = useState("Все")
  const [statusFilter, setStatusFilter] = useState("Все")
  const [objSearch, setObjSearch] = useState("")

  if (!user) {
    navigate("/")
    return null
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => updateProfile({ avatar: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      <DashboardSidebar
        section={section}
        setSection={setSection}
        user={user}
        initials={initials}
        onLogout={() => { logout(); navigate("/") }}
      />

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {section === "dashboard" && (
          <DashboardHome user={user} objects={objects} />
        )}

        {section === "objects" && (
          <DashboardObjects
            objects={objects}
            setObjects={setObjects}
            showWizard={showWizard}
            setShowWizard={setShowWizard}
            catFilter={catFilter}
            setCatFilter={setCatFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            objSearch={objSearch}
            setObjSearch={setObjSearch}
            userId={user.id}
          />
        )}

        {section === "crm" && <DashboardCRM />}

        {section === "analytics" && (
          <DashboardAnalytics objects={objects} />
        )}

        {section === "referral" && <DashboardReferral userId={user.id} />}

        {section === "profile" && (
          <DashboardProfile
            user={user}
            initials={initials}
            form={form}
            setForm={setForm}
            saved={saved}
            onSave={handleSave}
            onAvatarChange={handleAvatarChange}
            onStatusChange={(status) => updateProfile({ status })}
          />
        )}

        {section === "support" && <DashboardSupport />}
      </main>

      {section !== "support" && <AiChatBubble />}
    </div>
  )
}
