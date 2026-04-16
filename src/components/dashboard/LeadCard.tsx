import { useState } from "react"
import Icon from "@/components/ui/icon"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { type Lead, type FunnelStage, FUNNEL_STAGES, formatDate } from "./leadCard.types"
import { LeadTasksDialog } from "./LeadTasksDialog"
import { LeadExpandedBody } from "./LeadExpandedBody"

export type { FunnelStage, Lead }
export { FUNNEL_STAGES }

interface LeadCardProps {
  lead: Lead
  ownerId: string
  hasOverdue: boolean
  onStageChange: (id: string, stage: FunnelStage) => void
  onDelete: (id: string) => void
  onOverdueRefresh: () => void
}

export function LeadCard({ lead, ownerId, hasOverdue, onStageChange, onDelete, onOverdueRefresh }: LeadCardProps) {
  const [expanded, setExpanded] = useState(false)
  const stageInfo = FUNNEL_STAGES.find(s => s.stage === lead.stage) ?? FUNNEL_STAGES[0]

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden hover:border-[#2a2a2a] transition-colors">
      <div className="p-5 flex items-center gap-4">
        {/* Кликабельная левая часть — разворачивает карточку */}
        <div
          className="flex-1 flex items-center gap-4 min-w-0 cursor-pointer"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 text-sm font-bold text-gray-400">
            {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{lead.name || "Без имени"}</p>
            <p className="text-xs text-gray-400">{lead.phone}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {lead.object_title && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 truncate max-w-[180px]">
                  {lead.object_title}
                </span>
              )}
              <span className="text-xs text-gray-500">· {lead.source}</span>
            </div>
          </div>
        </div>

        {/* Правая часть: дата, задачи, этап, шеврон */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">{formatDate(lead.created_at)}</span>

          {/* Иконка-планировщик задач */}
          <LeadTasksDialog
            lead={lead}
            ownerId={ownerId}
            hasOverdue={hasOverdue}
            onOverdueRefresh={onOverdueRefresh}
          />

          {/* Этап воронки — выпадающее меню */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`text-xs px-2.5 py-1 rounded-full font-medium border flex items-center gap-1 ${stageInfo.bg} ${stageInfo.color} hover:opacity-80`}
                onClick={e => e.stopPropagation()}
              >
                {lead.stage}
                <Icon name="ChevronDown" className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 p-0 bg-[#0d0d0d] border-[#1f1f1f] text-white"
            >
              {/* Шапка с объектом */}
              {lead.object_title && (
                <div className="px-4 py-3 border-b border-[#1a1a1a] bg-[#111]">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Объект из маркетплейса</p>
                  <p className="text-sm font-semibold text-white truncate mt-0.5">{lead.object_title}</p>
                </div>
              )}
              <div className="p-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 py-1">Переместить в этап</p>
                {FUNNEL_STAGES.map(({ stage, color, bg, icon }) => (
                  <button
                    key={stage}
                    onClick={() => onStageChange(lead.id, stage)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      lead.stage === stage
                        ? `${bg} ${color}`
                        : "text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <Icon name={icon as "Eye"} className="h-4 w-4" />
                    <span>{stage}</span>
                    {lead.stage === stage && (
                      <Icon name="Check" className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <button
            onClick={() => setExpanded(v => !v)}
            className="text-gray-500 hover:text-white"
          >
            <Icon name={expanded ? "ChevronUp" : "ChevronDown"} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Раскрывающееся тело карточки */}
      {expanded && (
        <LeadExpandedBody
          lead={lead}
          ownerId={ownerId}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

export default LeadCard
