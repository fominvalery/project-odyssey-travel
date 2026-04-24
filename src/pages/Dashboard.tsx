import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuthContext } from "@/context/AuthContext"
import { type ObjectData } from "@/components/AddObjectWizard"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import DashboardHome from "@/components/dashboard/DashboardHome"
import DashboardObjects from "@/components/dashboard/DashboardObjects"
import { DashboardCRM, DashboardReferral, DashboardProfile } from "@/components/dashboard/DashboardSections"
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics"
import DashboardSupport from "@/components/dashboard/DashboardSupport"
import DashboardClub from "@/components/dashboard/DashboardClub"
import DashboardMessages from "@/components/dashboard/DashboardMessages"
import AiChatBubble from "@/components/AiChatBubble"
import NotificationBell from "@/components/dashboard/NotificationBell"
import SubscriptionBadge from "@/components/dashboard/SubscriptionBadge"
import { ClubPayDialog } from "@/components/pricing/ClubPayDialog"
import { useToast } from "@/hooks/use-toast"
import func2url from "../../backend/func2url.json"

const YOOKASSA_URL = (func2url as Record<string, string>)["yookassa-yookassa"]

type Section = "dashboard" | "objects" | "crm" | "analytics" | "referral" | "club" | "messages" | "profile" | "support"

function mapFromServer(o: Record<string, unknown>): ObjectData {
  const ef = (o.extra_fields as Record<string, string>) ?? {}
  return {
    id: String(o.id),
    type: (o.type as string) ?? "",
    subtype: (o.subtype as string) || ef.subtype || "",
    title: (o.title as string) ?? "",
    city: (o.city as string) ?? "",
    address: (o.address as string) ?? "",
    price: (o.price as string) ?? "",
    area: (o.area as string) ?? "",
    yield: (o.yield_percent as string) ?? "",
    yield_percent: (o.yield_percent as string) ?? "",
    description: (o.description as string) ?? "",
    status: (o.status as string) ?? "Активен",
    category: (o.category as string) ?? "",
    published: Boolean(o.published),
    photos: Array.isArray(o.photos) ? (o.photos as string[]) : [],
    user_id: (o.user_id as string) ?? null,
    extra_fields: ef,
    presentation_url: (o.presentation_url as string) ?? null,
  }
}

export default function Dashboard() {
  const { user, updateProfile, logout, refreshProfile } = useAuthContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const isBasic = !user?.isSuperadmin && (!user?.status || user?.status === "basic")
  const [section, setSection] = useState<Section>(isBasic ? "objects" : "dashboard")
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    middleName: user?.middleName ?? "",
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    company: user?.company ?? "",
    city: user?.city ?? "",
    specializations: user?.specializations ?? ([] as string[]),
    bio: user?.bio ?? "",
    experience: user?.experience ?? "",
    telegram: user?.telegram ?? "",
    vk: user?.vk ?? "",
    max: user?.max ?? "",
    website: user?.website ?? "",
  })
  const [saved, setSaved] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [openPartnerId, setOpenPartnerId] = useState<string | null>(null)
  const [openPartnerName, setOpenPartnerName] = useState<string | null>(null)
  const [openPartnerAvatar, setOpenPartnerAvatar] = useState<string | null>(null)
  const [openPartnerStatus, setOpenPartnerStatus] = useState<string | null>(null)
  const [showRenewDialog, setShowRenewDialog] = useState(false)

  function handleOpenMessage(partnerId: string, partnerName: string, partnerAvatar: string | null, partnerStatus: string) {
    setOpenPartnerId(partnerId)
    setOpenPartnerName(partnerName)
    setOpenPartnerAvatar(partnerAvatar)
    setOpenPartnerStatus(partnerStatus)
    setSection("messages")
  }
  const [objects, setObjects] = useState<ObjectData[]>([])
  const [loadingObjects, setLoadingObjects] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [editingObject, setEditingObject] = useState<ObjectData | null>(null)
  const [catFilter, setCatFilter] = useState("Все")
  const [statusFilter, setStatusFilter] = useState("Все")
  const [objSearch, setObjSearch] = useState("")

  // Проверяем возврат после оплаты ЮКассы
  useEffect(() => {
    const pendingRaw = localStorage.getItem("yookassa_pending_order")
    if (!pendingRaw || !user?.id) return

    const pending = JSON.parse(pendingRaw)
    const paymentId = pending.payment_id
    if (!paymentId) return

    async function checkPayment() {
      try {
        const r = await fetch(`${YOOKASSA_URL}?action=check&payment_id=${paymentId}`)
        const data = await r.json()
        if (data.status === "succeeded") {
          localStorage.removeItem("yookassa_pending_order")
          const qty = pending.qty || 0
          const isSubscription = pending.order_type === "subscription"
          if (isSubscription) {
            await refreshProfile()
            toast({ title: "Тариф Клуб активирован!", description: "Добро пожаловать в клуб" })
            setSection("dashboard")
          } else {
            if (qty > 0) {
              updateProfile({ listingsExtra: (user!.listingsExtra ?? 0) + qty })
            }
            toast({
              title: "Оплата прошла успешно!",
              description: qty > 0 ? `Добавлено ${qty} объявлений` : "Заказ оформлен",
            })
            setSection("objects")
          }
        } else if (data.status === "canceled") {
          localStorage.removeItem("yookassa_pending_order")
          toast({ title: "Оплата отменена", description: "Попробуйте снова", variant: "destructive" })
        }
      } catch {
        // ignore
      }
    }
    checkPayment()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

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
    updateProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      middleName: form.middleName,
      name: form.name || [form.lastName, form.firstName, form.middleName].filter(Boolean).join(" "),
      phone: form.phone,
      company: form.company,
      city: form.city,
      specializations: form.specializations,
      bio: form.bio,
      experience: form.experience,
      telegram: form.telegram,
      vk: form.vk,
      max: form.max,
      website: form.website,
    })
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
        unreadMessages={unreadMessages}
      />

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Топ-бар с колокольчиком */}
        <div className="sticky top-0 z-40 flex items-center justify-end gap-3 px-6 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm">
          <SubscriptionBadge user={user} onRenew={() => setShowRenewDialog(true)} />
          <NotificationBell userId={user.id} />
        </div>
        <ClubPayDialog open={showRenewDialog} onClose={() => setShowRenewDialog(false)} />
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
            isBasic={isBasic}
            listingsUsed={user.listingsUsed ?? objects.length}
            listingsExtra={user.listingsExtra ?? 0}
            userEmail={user.email}
            userName={user.name}
            // userId пробрасывается через userId выше
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
            onAvatarCropped={async (dataUrl) => {
              updateProfile({ avatar: dataUrl })
              try {
                const uploadRes = await fetch(func2url["upload-photo"], {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ image_base64: dataUrl, folder: "avatars" }),
                }).then(r => r.json())
                if (uploadRes.url) {
                  updateProfile({ avatar: uploadRes.url })
                }
              } catch {
                // оставляем base64 локально
              }
            }}
            onStatusChange={(status) => updateProfile({ status })}
          />
        )}

        {section === "club" && (
          <DashboardClub userId={user.id} onMessage={handleOpenMessage} />
        )}

        {section === "messages" && (
          <DashboardMessages
            userId={user.id}
            openPartnerId={openPartnerId}
            openPartnerName={openPartnerName}
            openPartnerAvatar={openPartnerAvatar}
            openPartnerStatus={openPartnerStatus}
            onClearOpen={() => { setOpenPartnerId(null); setOpenPartnerName(null); setOpenPartnerAvatar(null); setOpenPartnerStatus(null) }}
            onUnreadChange={setUnreadMessages}
          />
        )}

        {section === "support" && <DashboardSupport />}
      </main>

      {section !== "support" && <AiChatBubble />}
    </div>
  )
}