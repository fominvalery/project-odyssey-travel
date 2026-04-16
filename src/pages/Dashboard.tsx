import { useState, useEffect, useCallback } from "react"
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
import func2url from "../../backend/func2url.json"

type Section = "dashboard" | "objects" | "crm" | "analytics" | "referral" | "profile" | "support"

function mapFromServer(o: Record<string, unknown>): ObjectData {
  return {
    id: String(o.id),
    type: (o.type as string) ?? "",
    title: (o.title as string) ?? "",
    city: (o.city as string) ?? "",
    address: (o.address as string) ?? "",
    price: (o.price as string) ?? "",
    area: (o.area as string) ?? "",
    yield: (o.yield_percent as string) ?? "",
    description: (o.description as string) ?? "",
    status: (o.status as string) ?? "Активен",
    category: (o.category as string) ?? "",
    published: Boolean(o.published),
    photos: Array.isArray(o.photos) ? (o.photos as string[]) : [],
    user_id: (o.user_id as string) ?? null,
    extra_fields: (o.extra_fields as Record<string, string>) ?? {},
  }
}

export default function Dashboard() {
  const { user, updateProfile, logout } = useAuthContext()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>("dashboard")
  const [form, setForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", company: user?.company ?? "" })
  const [saved, setSaved] = useState(false)
  const [objects, setObjects] = useState<ObjectData[]>([])
  const [loadingObjects, setLoadingObjects] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [editingObject, setEditingObject] = useState<ObjectData | null>(null)
  const [catFilter, setCatFilter] = useState("Все")
  const [statusFilter, setStatusFilter] = useState("Все")
  const [objSearch, setObjSearch] = useState("")

  const loadObjects = useCallback(async (userId: string) => {
    setLoadingObjects(true)
    try {
      const r = await fetch(`${func2url.objects}?user_id=${encodeURIComponent(userId)}`)
      const data = await r.json()
      const arr = Array.isArray(data.objects) ? data.objects.map(mapFromServer) : []
      setObjects(arr)
    } catch {
      setObjects([])
    } finally {
      setLoadingObjects(false)
    }
  }, [])

  useEffect(() => {
    if (user?.id) loadObjects(user.id)
  }, [user?.id, loadObjects])

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

  async function handleDeleteObject(id: string) {
    if (!user?.id) return
    if (!confirm("Удалить объект? Это действие необратимо.")) return
    try {
      await fetch(`${func2url.objects}?id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      })
      setObjects(prev => prev.filter(o => String(o.id) !== String(id)))
    } catch {
      /* noop */
    }
  }

  function handleEditObject(obj: ObjectData) {
    setEditingObject(obj)
    setShowWizard(true)
  }

  function handleWizardSaved(obj: ObjectData) {
    setObjects(prev => {
      const exists = prev.some(o => String(o.id) === String(obj.id))
      return exists
        ? prev.map(o => (String(o.id) === String(obj.id) ? obj : o))
        : [obj, ...prev]
    })
  }

  function handleWizardClose() {
    setShowWizard(false)
    setEditingObject(null)
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
            loading={loadingObjects}
            showWizard={showWizard}
            setShowWizard={setShowWizard}
            editingObject={editingObject}
            onEdit={handleEditObject}
            onDelete={handleDeleteObject}
            onWizardSaved={handleWizardSaved}
            onWizardClose={handleWizardClose}
            catFilter={catFilter}
            setCatFilter={setCatFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            objSearch={objSearch}
            setObjSearch={setObjSearch}
            userId={user.id}
          />
        )}

        {section === "crm" && <DashboardCRM userId={user.id} />}

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