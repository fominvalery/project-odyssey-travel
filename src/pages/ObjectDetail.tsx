import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import func2url from "../../backend/func2url.json"

interface Owner {
  name: string
  phone: string
  company: string
  avatar_url: string
}

interface ObjectDetailData {
  id: string
  user_id: string | null
  category: string
  type: string
  title: string
  city: string
  address: string
  price: string
  area: string
  description: string
  yield_percent: string
  extra_fields: Record<string, string>
  status: string
  published: boolean
  created_at: string
  photos: string[]
  owner?: Owner
}

const FIELD_LABELS: Record<string, string> = {
  roi: "ROI",
  yield: "Доходность",
  payback: "Срок окупаемости",
  rent: "Арендный доход",
  strategy: "Стратегия",
  subtype: "Подтип",
  floor: "Этаж",
  floors_total: "Этажей в здании",
  ceiling: "Высота потолков",
  class: "Класс объекта",
  etp: "ЭТП",
  lot_number: "Номер лота",
  auction_date: "Дата аукциона",
  start_price: "Начальная цена",
  deposit: "Залог",
  complex: "ЖК",
  developer: "Застройщик",
  delivery: "Срок сдачи",
  corpus: "Корпус / секция",
  chess: "Шахматка",
}

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

  const photos = obj.photos?.length ? obj.photos : []
  const extra = obj.extra_fields ?? {}
  const extraKeys = Object.keys(extra).filter(k => extra[k] && extra[k].toString().trim())

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <section className="max-w-6xl mx-auto px-4 md:px-8 pt-8 pb-24">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <Icon name="ArrowLeft" className="h-4 w-4" /> К каталогу
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка — галерея + описание */}
          <div className="lg:col-span-2">
            {/* Галерея */}
            <div className="rounded-2xl overflow-hidden bg-[#111] border border-[#1f1f1f] mb-4">
              {photos.length > 0 ? (
                <img
                  src={photos[activePhoto]}
                  alt={obj.title}
                  className="w-full h-[260px] sm:h-[400px] object-cover"
                />
              ) : (
                <div className="w-full h-[260px] sm:h-[400px] flex items-center justify-center">
                  <Icon name="Building2" className="h-20 w-20 text-gray-700" />
                </div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mb-8 pb-2">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activePhoto ? "border-blue-500" : "border-transparent hover:border-[#333]"
                    }`}
                  >
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Заголовок / адрес */}
            <div className="mb-6">
              <p className="text-sm text-blue-400 mb-2">{obj.type}</p>
              <h1 className="text-3xl font-bold mb-3">{obj.title}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <Icon name="MapPin" className="h-4 w-4 text-violet-400" />
                <span>{[obj.city, obj.address].filter(Boolean).join(", ") || "Адрес не указан"}</span>
              </div>
            </div>

            {/* Характеристики */}
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Характеристики</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {obj.area && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Площадь</p>
                    <p className="font-medium">{obj.area} м²</p>
                  </div>
                )}
                {obj.yield_percent && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Доходность</p>
                    <p className="font-medium text-emerald-400">{obj.yield_percent}%</p>
                  </div>
                )}
                {extraKeys.map(k => (
                  <div key={k}>
                    <p className="text-xs text-gray-500 mb-1">{FIELD_LABELS[k] ?? k}</p>
                    <p className="font-medium">{extra[k]}</p>
                  </div>
                ))}
                {obj.area === "" && !obj.yield_percent && extraKeys.length === 0 && (
                  <p className="text-gray-500 text-sm col-span-full">Характеристики не заполнены</p>
                )}
              </div>
            </div>

            {/* Описание */}
            {obj.description && (
              <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
                <h2 className="text-lg font-semibold mb-3">Описание</h2>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{obj.description}</p>
              </div>
            )}
          </div>

          {/* Правая колонка — цена + контакты + форма заявки */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
              <p className="text-xs text-gray-500 mb-1">Стоимость</p>
              <p className="text-3xl font-bold mb-6">{obj.price ? `${obj.price} ₽` : "По запросу"}</p>

              {obj.owner && (
                <div className="border-t border-[#1f1f1f] pt-5 mb-5">
                  <p className="text-xs text-gray-500 mb-3">Владелец</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-blue-900/30 flex items-center justify-center overflow-hidden shrink-0">
                      {obj.owner.avatar_url ? (
                        <img src={obj.owner.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="User" className="h-5 w-5 text-blue-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{obj.owner.name || "Владелец"}</p>
                      {obj.owner.company && (
                        <p className="text-xs text-gray-400 truncate">{obj.owner.company}</p>
                      )}
                    </div>
                  </div>

                  {showContacts && obj.owner.phone ? (
                    <a
                      href={`tel:${obj.owner.phone}`}
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-medium transition-colors"
                    >
                      <Icon name="Phone" className="h-4 w-4" />
                      {obj.owner.phone}
                    </a>
                  ) : (
                    <Button
                      onClick={() => setShowContacts(true)}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3"
                      disabled={!obj.owner.phone}
                    >
                      <Icon name="Phone" className="h-4 w-4 mr-2" />
                      {obj.owner.phone ? "Показать телефон" : "Контакты не указаны"}
                    </Button>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: obj.title, url: window.location.href }).catch(() => {})
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                  }
                }}
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] py-2.5 text-sm transition-colors"
              >
                <Icon name="Share2" className="h-4 w-4" />
                Поделиться
              </button>
            </div>

            {/* Форма заявки */}
            {obj.user_id && (
              <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="MessageSquare" className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold">Оставить заявку</h3>
                </div>

                {leadSent ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                      <Icon name="Check" className="h-6 w-6 text-emerald-400" />
                    </div>
                    <p className="font-medium mb-1">Заявка отправлена</p>
                    <p className="text-sm text-gray-400 mb-4">Владелец свяжется с вами в ближайшее время</p>
                    <button
                      onClick={() => setLeadSent(false)}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Отправить ещё одну
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendLead} className="space-y-3">
                    <input
                      required
                      placeholder="Ваше имя *"
                      value={leadForm.name}
                      onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="Телефон *"
                      value={leadForm.phone}
                      onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email (необязательно)"
                      value={leadForm.email}
                      onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                      className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <textarea
                      placeholder="Сообщение"
                      rows={3}
                      value={leadForm.message}
                      onChange={e => setLeadForm({ ...leadForm, message: e.target.value })}
                      className="w-full rounded-xl bg-[#0f0f0f] border border-[#262626] text-white placeholder:text-gray-600 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />

                    {leadError && (
                      <p className="text-xs text-red-400">{leadError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={sending}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                    >
                      {sending ? (
                        <><Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />Отправка...</>
                      ) : (
                        <><Icon name="Send" className="h-4 w-4 mr-2" />Отправить заявку</>
                      )}
                    </Button>
                    <p className="text-[11px] text-gray-500 text-center">
                      Нажимая «Отправить», вы соглашаетесь на обработку персональных данных
                    </p>
                  </form>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}