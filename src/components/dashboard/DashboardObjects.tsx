import { useState, useEffect } from "react"
import { GlowButton } from "@/components/ui/glow-button"
import Icon from "@/components/ui/icon"
import { AddObjectWizard, type ObjectData } from "@/components/AddObjectWizard"
import ListingsBanner from "./ListingsBanner"
import ObjectsArchive from "./ObjectsArchive"
import ObjectsStats from "./ObjectsStats"
import ObjectsFilters from "./ObjectsFilters"
import ObjectsGrid from "./ObjectsGrid"
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
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showArchive, setShowArchive] = useState(false)
  const [visibleCount, setVisibleCount] = useState(6)
  const [employeeFilter, setEmployeeFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState("")
  const [viewsByObject, setViewsByObject] = useState<Record<string, number>>({})

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

  const canAddListing = !isBasic || (listingsUsed < FREE_LIMIT + listingsExtra)

  function handleAddObject() {
    if (!canAddListing) return
    setShowWizard(true)
  }

  const activeObjects = objects.filter(o => !ARCHIVE_STATUSES.includes(o.status))
  const archivedObjects = objects.filter(o => ARCHIVE_STATUSES.includes(o.status))

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
          <ListingsBanner
            listingsUsed={listingsUsed}
            listingsExtra={listingsExtra}
            userEmail={userEmail}
            userName={userName}
            userId={userId}
            onAddListingClick={handleAddObject}
          />
        )}

        <ObjectsStats activeObjects={activeObjects} archivedObjects={archivedObjects} />

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
          onAddObject={handleAddObject}
          employees={employees}
          viewsByObject={viewsByObject}
        />
      </div>
    </>
  )
}