import { useState, useCallback, useEffect } from "react"
import Icon from "@/components/ui/icon"
import { Button } from "@/components/ui/button"
import func2url from "../../../backend/func2url.json"

interface MatchObject {
  id: string
  title: string
  category: string
  type: string
  city: string
  price: string
  area: string
  status: string
  photos: string[]
}

interface Match {
  match_id: string | null
  object_id?: string
  added_to_proposals: boolean
  seen: boolean
  match_created: string
  object: MatchObject
}

interface LeadMatchesProps {
  leadId: string
  ownerId: string
}

export function LeadMatches({ leadId, ownerId }: LeadMatchesProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(
      `${func2url["lead-extras"]}?kind=matches&lead_id=${leadId}&owner_id=${ownerId}`
    ).then(r => r.json()).catch(() => ({ matches: [] }))
    setMatches(r.matches || [])
    setLoaded(true)
    setLoading(false)
  }, [leadId, ownerId])

  useEffect(() => {
    load()
  }, [load])

  // Пометить как просмотренные все новые при монтировании
  useEffect(() => {
    if (!loaded) return
    const unseen = matches.filter(m => !m.seen && m.match_id)
    if (unseen.length === 0) return
    unseen.forEach(m => {
      fetch(`${func2url["lead-extras"]}?kind=matches`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: m.match_id, owner_id: ownerId, seen: true }),
      }).catch(() => {})
    })
    setMatches(prev => prev.map(m => ({ ...m, seen: true })))
  }, [loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  async function addToProposals(match: Match) {
    if (!match.match_id || match.added_to_proposals) return
    setAddingId(match.match_id)
    const r = await fetch(`${func2url["lead-extras"]}?kind=matches`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: match.match_id, owner_id: ownerId, added_to_proposals: true }),
    }).then(r => r.json()).catch(() => null)
    if (r?.ok) {
      setMatches(prev => prev.map(m => m.match_id === match.match_id ? { ...m, added_to_proposals: true } : m))
    }
    setAddingId(null)
  }

  // Новые — те что появились в БД после того как клиент уже был в системе (seen=false изначально)
  const newCount = matches.filter(m => !m.seen).length

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
        <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" />
        Подбираем объекты...
      </div>
    )
  }

  if (!loaded || matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#1f1f1f] py-5 text-center">
        <p className="text-xs text-gray-600">Подходящих объектов не найдено</p>
        <p className="text-[10px] text-gray-700 mt-0.5">Добавьте объекты с похожей категорией в маркетплейс</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {newCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
          <Icon name="Sparkles" className="h-3.5 w-3.5" />
          {newCount} новых объектов подходит этому клиенту!
        </div>
      )}

      {matches.map(match => {
        const obj = match.object
        const isNew = !match.seen
        return (
          <div
            key={match.match_id || obj.id}
            className={`rounded-xl border p-3 flex items-start gap-3 transition-colors ${
              isNew
                ? "border-emerald-500/30 bg-emerald-500/5"
                : match.added_to_proposals
                  ? "border-blue-500/20 bg-blue-500/5"
                  : "border-[#1f1f1f] bg-[#0d0d0d]"
            }`}
          >
            {/* Фото или заглушка */}
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#1a1a1a] flex items-center justify-center">
              {obj.photos && obj.photos.length > 0 ? (
                <img src={obj.photos[0]} alt={obj.title} className="w-full h-full object-cover" />
              ) : (
                <Icon name="Building2" className="h-6 w-6 text-gray-600" />
              )}
            </div>

            {/* Инфо */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {isNew && (
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Новый</span>
                  )}
                  <p className="text-sm font-semibold text-white truncate">{obj.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {obj.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-400">{obj.category}</span>
                    )}
                    {obj.type && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-400">{obj.type}</span>
                    )}
                    {obj.city && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-400 flex items-center gap-0.5">
                        <Icon name="MapPin" className="h-2.5 w-2.5" />{obj.city}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1.5">
                    {obj.price && <p className="text-xs font-semibold text-white">{obj.price} ₽</p>}
                    {obj.area && <p className="text-xs text-gray-400">{obj.area} м²</p>}
                  </div>
                </div>

                {/* Действия */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <a
                    href={`/object/${obj.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
                    title="Открыть объект"
                  >
                    <Icon name="ExternalLink" className="h-3.5 w-3.5" />
                  </a>
                  {match.added_to_proposals ? (
                    <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                      <Icon name="Check" className="h-3 w-3" /> В предложениях
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => addToProposals(match)}
                      disabled={addingId === match.match_id}
                      className="h-7 text-[11px] px-2 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {addingId === match.match_id ? (
                        <Icon name="Loader2" className="h-3 w-3 animate-spin" />
                      ) : (
                        <><Icon name="Plus" className="h-3 w-3 mr-0.5" />Предложить</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <button
        onClick={load}
        className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
      >
        <Icon name="RotateCw" className="h-3 w-3" /> Обновить подборку
      </button>
    </div>
  )
}