import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import ShareDialog from "@/components/ShareDialog"
import ObjectGallery from "@/components/object-detail/ObjectGallery"
import ObjectSidebar from "@/components/object-detail/ObjectSidebar"
import ObjectLeadForm from "@/components/object-detail/ObjectLeadForm"
import { ObjectDetailData } from "@/components/object-detail/types"
import func2url from "../../backend/func2url.json"

export default function ObjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [obj, setObj] = useState<ObjectDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activePhoto, setActivePhoto] = useState(0)
  const [showContacts, setShowContacts] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "", message: "" })
  const [sending, setSending] = useState(false)
  const [leadSent, setLeadSent] = useState(false)
  const [leadError, setLeadError] = useState("")
  const [shareOpen, setShareOpen] = useState(false)

  async function handleSendLead(e: React.FormEvent) {
    e.preventDefault()
    if (!obj || !obj.user_id) return
    setLeadError("")
    setSending(true)
    try {
      const res = await fetch(func2url.leads, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: obj.user_id,
          object_id: obj.id,
          object_title: obj.title,
          name: leadForm.name,
          phone: leadForm.phone,
          email: leadForm.email,
          message: leadForm.message,
          source: "Маркетплейс",
          stage: "Лид",
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setLeadError(data.error || "Не удалось отправить заявку")
        return
      }
      setLeadSent(true)
      setLeadForm({ name: "", phone: "", email: "", message: "" })
    } catch {
      setLeadError("Ошибка сети. Попробуйте ещё раз.")
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`${func2url.objects}?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (data?.object) {
          setObj(data.object as ObjectDetailData)
        } else {
          setError("Объект не найден")
        }
      })
      .catch(() => setError("Не удалось загрузить объект"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="py-32 text-center">
          <Icon name="Loader2" className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
        </div>
      </main>
    )
  }

  if (error || !obj) {
    return (
      <main className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="py-32 text-center text-gray-400">
          <Icon name="SearchX" className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="mb-6">{error || "Объект не найден"}</p>
          <Button onClick={() => navigate("/marketplace")} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
            <Icon name="ArrowLeft" className="h-4 w-4 mr-2" /> К каталогу
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <section className="max-w-6xl mx-auto px-4 md:px-8 pt-8 pb-24">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <Icon name="ArrowLeft" className="h-4 w-4" /> К каталогу
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка — галерея + описание */}
          <ObjectGallery
            obj={obj}
            activePhoto={activePhoto}
            setActivePhoto={setActivePhoto}
          />

          {/* Правая колонка — цена + контакты + форма заявки */}
          <aside className="lg:col-span-1 space-y-4">
            <ObjectSidebar
              obj={obj}
              showContacts={showContacts}
              setShowContacts={setShowContacts}
              onShareClick={() => setShareOpen(true)}
            />

            {shareOpen && (
              <ShareDialog
                title={obj.title}
                url={typeof window !== "undefined" ? window.location.href : ""}
                onClose={() => setShareOpen(false)}
              />
            )}

            {/* Форма заявки */}
            {obj.user_id && (
              <ObjectLeadForm
                leadForm={leadForm}
                setLeadForm={setLeadForm}
                sending={sending}
                leadSent={leadSent}
                setLeadSent={setLeadSent}
                leadError={leadError}
                onSubmit={handleSendLead}
              />
            )}
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  )
}