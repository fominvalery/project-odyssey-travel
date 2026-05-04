import { useState, useEffect } from "react"
import { GlowButton } from "@/components/ui/glow-button"
import Icon from "@/components/ui/icon"
import { AddObjectWizard, type ObjectData } from "@/components/AddObjectWizard"
import ListingsBanner from "./ListingsBanner"
import ObjectsArchive from "./ObjectsArchive"
import ObjectsStats from "./ObjectsStats"
import ObjectsFilters from "./ObjectsFilters"
import ObjectsGrid from "./ObjectsGrid"
import ObjectCard from "./ObjectCard"
import func2url from "../../../backend/func2url.json"

const FREE_LIMIT = 3
const ARCHIVE_STATUSES = ["Продан", "Сдан"]

interface Props {
  objects: ObjectData[]
  loading?: boolean
  showWizard: boolean
  setShowWizard: (v: boolean) => void
  editingObject: ObjectData | null
  onEdit: (obj: ObjectData) => void
  onDelete: (id: string) => void
  onWizardSaved: (obj: ObjectData) => void
  onWizardClose: () => void
  catFilter: string
  setCatFilter: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  objSearch: string
  setObjSearch: (v: string) => void
  userId: string
  isBasic?: boolean
  listingsUsed?: number
  listingsExtra?: number
  userEmail?: string
  userName?: string
  onArchive?: (id: string, status: "Продан" | "Сдан") => void
  onRestore?: (id: string) => void
  onSaveOwner?: (id: string, fields: Record<string, string>) => void
  onReassign?: (obj: import("@/components/AddObjectWizard").ObjectData) => void
  employees?: Array<{ user_id: string; name: string; department_id?: string }>
  departments?: Array<{ id: string; name: string }>
  onNavigateSection?: (target: "analytics" | "crm") => void
}

export default function DashboardObjects({
  objects, loading, showWizard, setShowWizard,
  editingObject, onEdit, onDelete, onWizardSaved, onWizardClose,
  catFilter, setCatFilter, statusFilter, setStatusFilter,
  objSearch, setObjSearch, userId,
  isBasic = false, listingsUsed = 0, listingsExtra = 0,
  userEmail = "", userName = "",
  onArchive, onRestore, onSaveOwner, onReassign,
  employees,
  departments,
  onNavigateSection,
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showArchive, setShowArchive] = useState(false)
  const [showExpired, setShowExpired] = useState(false)
  const [visibleCount, setVisibleCount] = useState(6)
  const [employeeFilter, setEmployeeFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState("")
  const [viewsByObject, setViewsByObject] = useState<Record<string, number>>({})
  const [leadsCount, setLeadsCount] = useState(0)

  useEffect(() => {
    const ids = objects.map(o => String(o.id)).filter(Boolean)
    if (ids.length === 0) {
      setViewsByObject({})
      return
    }
    const url = `${func2url.analytics}?action=views&ids=${encodeURIComponent(ids.join(","))}`
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d && typeof d === "object" && d.counts && typeof d.counts === "object") {
          setViewsByObject(d.counts as Record<string, number>)
        }
      })
      .catch(() => {})
  }, [objects])

  useEffect(() => {
    if (!userId) {
      setLeadsCount(0)
      return
    }
    const url = (func2url as Record<string, string>)["leads"]
    if (!url) return
    fetch(`${url}?owner_id=${userId}`, { headers: { "X-User-Id": userId } })
      .then(r => (r.ok ? r.json() : { leads: [] }))
      .then(d => {
        const leads = Array.isArray(d?.leads) ? d.leads : []
        const objectIds = new Set(objects.map(o => String(o.id)))
        const linked = leads.filter((l: { object_id?: string | null }) => l.object_id && objectIds.has(String(l.object_id)))
        setLeadsCount(linked.length)
      })
      .catch(() => setLeadsCount(0))
  }, [userId, objects])

  const canAddListing = !isBasic || (listingsUsed < FREE_LIMIT + listingsExtra)

  function handleAddObject() {
    if (!canAddListing) return
    setShowWizard(true)
  }

  async function handleExtend(id: string) {
    if (!userId) return
    try {
      const res = await fetch(func2url.objects, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend", id, user_id: userId }),
      })
      if (res.status === 402) {
        // Нет свободных слотов — открываем баннер оплаты
        const banner = document.getElementById("listings-banner-pay")
        banner?.scrollIntoView({ behavior: "smooth", block: "center" })
        alert("Нет свободных слотов. Оплатите пакет объявлений, чтобы продлить.")
        return
      }
      if (res.ok) {
        const data = await res.json()
        if (data?.object) {
          onWizardSaved(data.object)
        }
      }
    } catch {
      // ignore
    }
  }

  const isExpiredObj = (o: ObjectData) => !!o.auto_unpublished
  const archivedObjects = objects.filter(o => ARCHIVE_STATUSES.includes(o.status))
  const expiredObjects = objects.filter(o => !ARCHIVE_STATUSES.includes(o.status) && isExpiredObj(o))
  const activeObjects = objects.filter(o => !ARCHIVE_STATUSES.includes(o.status) && !isExpiredObj(o))
  const requiresPaymentObjects = activeObjects.filter(o => o.requires_payment)

  const deptEmployeeIds = deptFilter && employees
    ? new Set(employees.filter(e => e.department_id === deptFilter).map(e => e.user_id))
    : null

  const filtered = activeObjects.filter(o => {
    const matchCat = catFilter === "Все" || o.type === catFilter
    const matchSt = statusFilter === "Все" || o.status === statusFilter
    const matchSearch = !objSearch
      || o.title.toLowerCase().includes(objSearch.toLowerCase())
      || o.city.toLowerCase().includes(objSearch.toLowerCase())
    const matchEmployee = !employeeFilter || o.user_id === employeeFilter
    const matchDept = !deptEmployeeIds || deptEmployeeIds.has(o.user_id)
    return matchCat && matchSt && matchSearch && matchEmployee && matchDept
  })

  useEffect(() => { setVisibleCount(6) }, [catFilter, statusFilter, objSearch, employeeFilter, deptFilter])

  const visibleFiltered = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  if (showArchive) {
    return (
      <ObjectsArchive
        archivedObjects={archivedObjects}
        showWizard={showWizard}
        editingObject={editingObject}
        userId={userId}
        onWizardSaved={onWizardSaved}
        onWizardClose={onWizardClose}
        onRestore={onRestore}
        onDelete={onDelete}
        onBack={() => setShowArchive(false)}
      />
    )
  }

  if (showExpired) {
    return (
      <div className="p-6 md:p-8 max-w-7xl">
        <button
          onClick={() => setShowExpired(false)}
          className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1.5"
        >
          <Icon name="ArrowLeft" className="h-4 w-4" />
          Назад к объектам
        </button>
        <h1 className="text-2xl font-bold mb-1">Истекшие объявления</h1>
        <p className="text-sm text-gray-500 mb-6">
          Эти объявления автоматически сняты с публикации. Продлите их, чтобы вернуть в работу.
        </p>
        {expiredObjects.length === 0 ? (
          <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] py-20 text-center">
            <Icon name="CheckCircle2" className="h-12 w-12 text-emerald-500/60 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Истёкших объявлений нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {expiredObjects.map((obj) => (
              <ObjectCard
                key={obj.id}
                obj={obj}
                onEdit={onEdit}
                onDelete={onDelete}
                onSaveOwner={onSaveOwner}
                onExtend={handleExtend}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {showWizard && (
        <AddObjectWizard
          onClose={onWizardClose}
          onSave={(obj) => { onWizardSaved(obj); onWizardClose() }}
          userId={userId}
          initial={editingObject ?? undefined}
        />
      )}
      <div className="p-6 md:p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold">Объекты</h1>
          {!isBasic && (
            <GlowButton onClick={() => setShowWizard(true)} className="rounded-xl text-sm px-4 py-2">
              <Icon name="Plus" className="h-4 w-4 mr-2" /> Добавить объект
            </GlowButton>
          )}
        </div>

        {isBasic && (
          <div id="listings-banner-pay">
            <ListingsBanner
              listingsUsed={listingsUsed}
              listingsExtra={listingsExtra}
              userEmail={userEmail}
              userName={userName}
              userId={userId}
              onAddListingClick={handleAddObject}
            />
          </div>
        )}

        {requiresPaymentObjects.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <Icon name="CreditCard" className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-200 text-sm">
                  {requiresPaymentObjects.length} объявлений требуют оплаты
                </p>
                <p className="text-xs text-amber-300/70 mt-0.5">
                  После окончания подписки Клуба эти объекты активны ещё 3 дня. Продлите Клуб или купите пакет объявлений.
                </p>
              </div>
            </div>
          </div>
        )}

        {expiredObjects.length > 0 && (
          <button
            onClick={() => setShowExpired(true)}
            className="mb-5 w-full rounded-2xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 p-3 flex items-center justify-between gap-3 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm text-red-300">
              <Icon name="AlertCircle" className="h-4 w-4" />
              {expiredObjects.length} объявлений истекли — продлите чтобы вернуть в каталог
            </span>
            <Icon name="ArrowRight" className="h-4 w-4 text-red-400" />
          </button>
        )}

        <ObjectsStats
          activeObjects={activeObjects}
          archivedObjects={archivedObjects}
          viewsByObject={viewsByObject}
          leadsCount={leadsCount}
          onNavigate={onNavigateSection}
          onResetFilters={() => {
            setCatFilter("Все")
            setStatusFilter("Все")
            setObjSearch("")
            setEmployeeFilter("")
            setDeptFilter("")
          }}
          onShowArchive={() => setShowArchive(true)}
        />

        <ObjectsFilters
          catFilter={catFilter} setCatFilter={setCatFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          objSearch={objSearch} setObjSearch={setObjSearch}
          viewMode={viewMode} setViewMode={setViewMode}
          archivedCount={archivedObjects.length}
          onShowArchive={() => setShowArchive(true)}
          employees={employees} departments={departments}
          employeeFilter={employeeFilter} setEmployeeFilter={setEmployeeFilter}
          deptFilter={deptFilter} setDeptFilter={setDeptFilter}
        />

        <ObjectsGrid
          loading={loading}
          viewMode={viewMode}
          filtered={filtered}
          visibleFiltered={visibleFiltered}
          hasMore={hasMore}
          visibleCount={visibleCount}
          onShowMore={() => setVisibleCount(v => v + 6)}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
          onSaveOwner={onSaveOwner}
          onReassign={onReassign}
          onExtend={handleExtend}
          onAddObject={handleAddObject}
          employees={employees}
          viewsByObject={viewsByObject}
        />
      </div>
    </>
  )
}