import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { Department } from "@/lib/agencyApi"

interface Props {
  departments: Department[]
  isDirector: boolean
  onCreate: () => void
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
}

export default function AgencyDepartmentsTab({
  departments,
  isDirector,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Card className="bg-white/5 border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold">Отделы агентства</div>
          <div className="text-xs text-slate-400">
            Группируют сотрудников под руководством РОПа
          </div>
        </div>
        {isDirector && (
          <Button
            size="sm"
            onClick={onCreate}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
          >
            <Icon name="Plus" size={14} className="mr-1" />
            Новый отдел
          </Button>
        )}
      </div>

      {departments.length === 0 ? (
        <div className="p-10 text-center text-slate-400">
          <Icon name="Network" size={36} className="mx-auto mb-3 opacity-50" />
          Пока нет отделов
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {departments.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{d.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Сотрудников: {d.members_count}
                  </div>
                </div>
                {isDirector && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-white hover:bg-white/10"
                      onClick={() => onEdit(d)}
                    >
                      <Icon name="Pencil" size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-300 hover:bg-red-500/10"
                      onClick={() => onDelete(d)}
                    >
                      <Icon name="Trash2" size={13} />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                <Icon name="Crown" size={14} className="text-amber-400" />
                <div className="text-xs">
                  <span className="text-slate-400">РОП: </span>
                  <span className="font-medium">
                    {d.head_name || "не назначен"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
