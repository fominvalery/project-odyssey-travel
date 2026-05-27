import { useState, useEffect, useRef } from "react"
import Icon from "@/components/ui/icon"
import { CATEGORIES, WizardForm } from "../wizardTypes"
import { agencyApi, OrgSummary } from "@/lib/agencyApi"
import { useAuthContext } from "@/context/AuthContext"
import func2url from "../../../../backend/func2url.json"

interface Offer {
  id: number | string
  title: string
  city: string
  category: string
}

interface Step6PublishBaseProps {
  form: WizardForm
  setForm: (f: WizardForm) => void
  category: string
  publishToBase: boolean
  setPublishToBase: (v: boolean) => void
}

export function Step6PublishBase({ form, setForm, category, publishToBase, setPublishToBase }: Step6PublishBaseProps) {
  const catLabel = CATEGORIES.find(c => c.id === category)?.label ?? category
  const { user } = useAuthContext()

  const [orgSearch, setOrgSearch] = useState(form.developer_org_name ?? "")
  const [orgs, setOrgs] = useState<OrgSummary[]>([])
  const [filteredOrgs, setFilteredOrgs] = useState<OrgSummary[]>([])
  const [showOrgDropdown, setShowOrgDropdown] = useState(false)
  const orgRef = useRef<HTMLDivElement>(null)

  const [projectSearch, setProjectSearch] = useState(form.related_project_name ?? "")
  const [projects, setProjects] = useState<Offer[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Offer[]>([])
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(false)
  const projectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    agencyApi.listMyOrgs(user.id).then(setOrgs).catch(() => {})
  }, [user])

  useEffect(() => {
    const q = orgSearch.toLowerCase()
    setFilteredOrgs(q ? orgs.filter(o => o.name.toLowerCase().includes(q)) : orgs)
  }, [orgSearch, orgs])

  useEffect(() => {
    if (!publishToBase) return
    setProjectsLoading(true)
    const url = new URL((func2url as Record<string, string>)["agg-offers"])
    url.searchParams.set("limit", "100")
    fetch(url.toString())
      .then(r => r.json())
      .then(d => setProjects(d.offers ?? []))
      .catch(() => {})
      .finally(() => setProjectsLoading(false))
  }, [publishToBase])

  useEffect(() => {
    const q = projectSearch.toLowerCase()
    setFilteredProjects(q ? projects.filter(p => p.title.toLowerCase().includes(q) || (p.city ?? "").toLowerCase().includes(q)) : projects)
  }, [projectSearch, projects])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (orgRef.current && !orgRef.current.contains(e.target as Node)) setShowOrgDropdown(false)
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) setShowProjectDropdown(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function selectOrg(org: OrgSummary) {
    setOrgSearch(org.name)
    setForm({ ...form, developer_org_id: org.id, developer_org_name: org.name })
    setShowOrgDropdown(false)
  }

  function clearOrg() {
    setOrgSearch("")
    setForm({ ...form, developer_org_id: undefined, developer_org_name: undefined })
  }

  function selectProject(p: Offer) {
    setProjectSearch(p.title)
    setForm({ ...form, related_project_id: String(p.id), related_project_name: p.title })
    setShowProjectDropdown(false)
  }

  function clearProject() {
    setProjectSearch("")
    setForm({ ...form, related_project_id: undefined, related_project_name: undefined })
  }

  return (
    <div className="space-y-4">
      {/* Сводка объекта */}
      <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] p-6">
        <h2 className="font-semibold mb-4 text-white">Сводка объекта</h2>
        <div className="space-y-3">
          {[
            { label: "Тип", value: catLabel },
            { label: "Название", value: form.title || "—" },
            { label: "Город", value: form.city || "—" },
            { label: "Адрес", value: form.address || "—" },
            { label: "Цена", value: form.price ? `${form.price} ₽` : "—" },
            { label: "Площадь", value: form.area ? `${form.area} м²` : "—" },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-sm border-b border-[#1a1a1a] pb-2 last:border-0">
              <span className="text-gray-500">{row.label}</span>
              <span className="text-white font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Переключатель — размещение в Базе */}
      <button
        type="button"
        onClick={() => setPublishToBase(!publishToBase)}
        className={`w-full rounded-2xl border p-5 flex items-center gap-4 transition-all text-left ${
          publishToBase ? "border-emerald-500 bg-emerald-500/10" : "border-[#1f1f1f] bg-[#111]"
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${publishToBase ? "bg-emerald-500/20" : "bg-[#1a1a1a]"}`}>
          <Icon name="FolderOpen" className={`h-6 w-6 ${publishToBase ? "text-emerald-400" : "text-gray-500"}`} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white">Разместить в Базе / Проектах</p>
          <p className="text-xs text-gray-400 mt-0.5">Объект появится во внутренней базе Кабинет-24 и будет доступен брокерам-партнёрам</p>
        </div>
        <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${publishToBase ? "bg-emerald-600" : "bg-[#2a2a2a]"}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${publishToBase ? "translate-x-4" : "translate-x-0"}`} />
        </div>
      </button>

      {/* Блоки при размещении в базе */}
      {publishToBase && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-gray-400 px-1">
            <Icon name="Sparkles" className="h-3.5 w-3.5 text-emerald-400" />
            После размещения для брокеров будут доступны:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Привязать застройщика/компанию */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon name="Building2" className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-white">Привязать застройщика / компанию</span>
              </div>
              <div className="relative" ref={orgRef}>
                <div className="relative">
                  <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={orgSearch}
                    onChange={e => { setOrgSearch(e.target.value); setShowOrgDropdown(true) }}
                    onFocus={() => setShowOrgDropdown(true)}
                    placeholder="Начните вводить название..."
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg pl-8 pr-8 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                  />
                  {form.developer_org_id && (
                    <button onClick={clearOrg} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      <Icon name="X" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {showOrgDropdown && filteredOrgs.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-xl max-h-44 overflow-y-auto">
                    {filteredOrgs.map(org => (
                      <button
                        key={org.id}
                        type="button"
                        onMouseDown={() => selectOrg(org)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-[#1f1f1f] flex items-center gap-2"
                      >
                        {org.logo_url
                          ? <img src={org.logo_url} className="w-5 h-5 rounded object-cover shrink-0" alt="" />
                          : <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center shrink-0"><Icon name="Building2" className="h-3 w-3 text-blue-400" /></div>
                        }
                        <span className="truncate">{org.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {showOrgDropdown && orgSearch && filteredOrgs.length === 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-gray-500">
                    Ничего не найдено
                  </div>
                )}
              </div>
              {form.developer_org_id && (
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                  <Icon name="Check" className="h-3 w-3" />
                  {form.developer_org_name}
                </div>
              )}
            </div>

            {/* Добавить проект */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Icon name="FolderKanban" className="h-4 w-4 text-violet-400" />
                </div>
                <span className="text-sm font-medium text-white">Добавить проект</span>
              </div>
              <div className="relative" ref={projectRef}>
                <div className="relative">
                  <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={e => { setProjectSearch(e.target.value); setShowProjectDropdown(true) }}
                    onFocus={() => setShowProjectDropdown(true)}
                    placeholder={projectsLoading ? "Загрузка..." : "Начните вводить название..."}
                    disabled={projectsLoading}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg pl-8 pr-8 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
                  />
                  {form.related_project_id && (
                    <button onClick={clearProject} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      <Icon name="X" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {showProjectDropdown && filteredProjects.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-xl max-h-44 overflow-y-auto">
                    {filteredProjects.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => selectProject(p)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-[#1f1f1f] flex items-center gap-2"
                      >
                        <Icon name="MapPin" className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <span className="truncate">{p.title}</span>
                        {p.city && <span className="text-xs text-gray-500 shrink-0">{p.city}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {showProjectDropdown && projectSearch && filteredProjects.length === 0 && !projectsLoading && (
                  <div className="absolute z-20 mt-1 w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-gray-500">
                    Ничего не найдено
                  </div>
                )}
              </div>
              {form.related_project_id && (
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                  <Icon name="Check" className="h-3 w-3" />
                  {form.related_project_name}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/20 p-4 flex gap-3">
            <Icon name="CheckCircle" className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">
              Объект появится в разделе <span className="text-white font-medium">«{catLabel}»</span> внутренней базы Кабинет-24 сразу после сохранения.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
