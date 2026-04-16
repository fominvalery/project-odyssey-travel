import { useState } from "react"
import { type Lead, type FunnelStage, formatDate, FUNNEL_STAGES } from "./leadCard.types"
import { LeadTasksDialog } from "./LeadTasksDialog"
import { LeadExpandedBody } from "./LeadExpandedBody"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Icon from "@/components/ui/icon"

interface KanbanCardProps {
  lead: Lead
  ownerId: string
  hasOverdue: boolean
  onStageChange: (id: string, stage: FunnelStage) => void
  onDelete: (id: string) => void
  onOverdueRefresh: () => void
}

export function KanbanCard({ lead, ownerId, hasOverdue, onStageChange, onDelete, onOverdueRefresh }: KanbanCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl bg-[#111] border border-[#1f1f1f] hover:border-[#2a2a2a] transition-colors overflow-hidden">
      <div className="p-3">
        {/* Источник */}
        <p className="text-[10px] text-gray-500 mb-1">{lead.source || "Маркетплейс"}</p>

        {/* Имя */}
        <p className="font-semibold text-sm text-white truncate">{lead.name || "Без имени"}</p>

        {/* Телефон */}
        <a href={`tel:${lead.phone}`} className="text-xs text-gray-400 hover:text-blue-400 mt-0.5 block truncate">
          {lead.phone}
        </a>

        {/* Объект */}
        {lead.object_title && (
          <p className="text-xs text-blue-400 truncate mt-1.5 bg-blue-500/10 rounded-full px-2 py-0.5">
            {lead.object_title}
          </p>
        )}

        {/* Дата + действия */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1a1a1a]">
          <span className="text-[10px] text-gray-600">{formatDate(lead.created_at)}</span>

          <div className="flex items-center gap-1.5">
            {/* Задачи */}
            <LeadTasksDialog
              lead={lead}
              ownerId={ownerId}
              hasOverdue={hasOverdue}
              onOverdueRefresh={onOverdueRefresh}
            />

            {/* Смена этапа */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-[11px] px-2 py-1 rounded-full font-medium border bg-[#1a1a1a] border-[#2a2a2a] text-gray-300 hover:text-white flex items-center gap-1 transition-colors">
                  {lead.stage}
                  <Icon name="ChevronDown" className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1 bg-[#0d0d0d] border-[#1f1f1f] text-white">
                {FUNNEL_STAGES.map(({ stage, color, bg, icon }) => (
                  <button
                    key={stage}
                    onClick={() => onStageChange(lead.id, stage)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                      lead.stage === stage ? `${bg} ${color}` : "text-gray-300 hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <Icon name={icon as "Eye"} className="h-3.5 w-3.5" />
                    {stage}
                    {lead.stage === stage && <Icon name="Check" className="h-3.5 w-3.5 ml-auto" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Раскрыть карточку */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="h-6 w-6 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
              title={expanded ? "Свернуть" : "Открыть карточку"}
            >
              <Icon name={expanded ? "ChevronUp" : "ChevronDown"} className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Раскрытое тело — контакты, файлы, комментарии */}
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
