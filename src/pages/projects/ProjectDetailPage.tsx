import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../../backend/func2url.json"
import { OfferDetail, DEFAULT_IMG } from "./ProjectDetailTypes"
import { ProjectDetailContent } from "./ProjectDetailContent"
import { ProjectDetailSidebar } from "./ProjectDetailSidebar"
import { FixationDialog, ContactDialog } from "./ProjectDetailDialogs"

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIdx, setPhotoIdx] = useState(0)

  // Фиксация клиента
  const [fixDialog, setFixDialog] = useState(false)
  const [fixLoading, setFixLoading] = useState(false)
  const [fixSuccess, setFixSuccess] = useState(false)
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [fixNotes, setFixNotes] = useState("")

  // Связь с менеджером
  const [contactDialog, setContactDialog] = useState(false)

  useEffect(() => {
    if (!id) return
    const url = `${(func2url as Record<string, string>)["agg-offers"]}?id=${id}`
    fetch(url)
      .then(r => r.json())
      .then(d => setOffer(d.offer || null))
      .catch(() => setOffer(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleFixation = async () => {
    if (!clientName.trim()) return
    setFixLoading(true)
    try {
      await fetch((func2url as Record<string, string>)["agg-fixations"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id || "",
        },
        body: JSON.stringify({
          offer_id: id,
          full_name: clientName,
          phone: clientPhone,
          email: clientEmail,
          notes: fixNotes,
        }),
      })
      setFixSuccess(true)
    } catch {
      // pass
    } finally {
      setFixLoading(false)
    }
  }

  const resetFixDialog = () => {
    setFixDialog(false)
    setFixSuccess(false)
    setClientName("")
    setClientPhone("")
    setClientEmail("")
    setFixNotes("")
  }

  if (loading) {
    return (
      <div className="flex-1 bg-[#0d0d0d] flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex-1 bg-[#0d0d0d] flex flex-col items-center justify-center min-h-screen gap-4">
        <Icon name="AlertCircle" className="h-12 w-12 text-gray-700" />
        <p className="text-gray-500">Предложение не найдено</p>
        <Button variant="ghost" onClick={() => navigate("/projects")}>← Назад</Button>
      </div>
    )
  }

  const photos = offer.photos && offer.photos.length > 0 ? offer.photos : [DEFAULT_IMG]

  // Данные менеджера из extra_fields
  const ef = offer.extra_fields || {}
  const managerName = ef.manager_name || ""
  const managerPhone = ef.manager_phone || ""
  const managerEmail = ef.manager_email || ""
  const hasManager = Boolean(managerName || managerPhone || managerEmail)

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Навигация */}
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-5 transition-colors"
        >
          <Icon name="ChevronLeft" className="h-4 w-4" />
          База / Проекты
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProjectDetailContent
            offer={offer}
            photos={photos}
            photoIdx={photoIdx}
            onPhotoIdx={setPhotoIdx}
          />

          <ProjectDetailSidebar
            offer={offer}
            managerName={managerName}
            managerPhone={managerPhone}
            managerEmail={managerEmail}
            hasManager={hasManager}
            onFixDialog={() => setFixDialog(true)}
            onContactDialog={() => setContactDialog(true)}
            onNavigateFixations={() => navigate("/projects/fixations")}
          />
        </div>
      </div>

      <FixationDialog
        open={fixDialog}
        offerTitle={offer.title}
        offerCity={offer.city}
        fixSuccess={fixSuccess}
        fixLoading={fixLoading}
        clientName={clientName}
        clientPhone={clientPhone}
        clientEmail={clientEmail}
        fixNotes={fixNotes}
        onOpenChange={v => { if (!v) resetFixDialog(); else setFixDialog(true) }}
        onClientName={setClientName}
        onClientPhone={setClientPhone}
        onClientEmail={setClientEmail}
        onFixNotes={setFixNotes}
        onSubmit={handleFixation}
        onNavigateFixations={() => navigate("/projects/fixations")}
      />

      <ContactDialog
        open={contactDialog}
        offerTitle={offer.title}
        managerName={managerName}
        managerPhone={managerPhone}
        managerEmail={managerEmail}
        onOpenChange={setContactDialog}
      />
    </div>
  )
}
