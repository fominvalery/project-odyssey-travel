import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { Offer, CAT_LABEL, STATUS_OPTS, STATUS_COLOR, formatPrice } from "./AggOffersTypes"

interface Props {
  offers: Offer[]
  loading: boolean
  onEdit: (o: Offer) => void
  onAdd: () => void
  onDelete: (o: Offer) => void
}

export default function AggOffersTable({ offers, loading, onEdit, onAdd, onDelete }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-600">Загрузка...</div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon name="FolderOpen" className="h-10 w-10 text-gray-700 mb-3" />
        <p className="text-gray-500">Предложений нет</p>
        <Button onClick={onAdd} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm">
          Добавить первое
        </Button>
      </div>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[#1f1f1f] text-xs text-gray-500">
          <th className="text-left px-5 py-3 font-medium">Название</th>
          <th className="text-left px-3 py-3 font-medium">Категория</th>
          <th className="text-left px-3 py-3 font-medium">Город</th>
          <th className="text-left px-3 py-3 font-medium">Цена</th>
          <th className="text-left px-3 py-3 font-medium">Статус</th>
          <th className="text-left px-3 py-3 font-medium">Фото</th>
          <th className="text-right px-5 py-3 font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {offers.map(o => (
          <tr
            key={o.id}
            className="border-b border-[#141414] hover:bg-[#111] transition-colors cursor-pointer"
            onClick={() => onEdit(o)}
          >
            <td className="px-5 py-3.5">
              <div className="font-medium text-white line-clamp-1">{o.title}</div>
              {o.subtype && <div className="text-xs text-gray-600">{o.subtype}</div>}
            </td>
            <td className="px-3 py-3.5 text-gray-400">{CAT_LABEL[o.category] || o.category}</td>
            <td className="px-3 py-3.5 text-gray-400">{o.city || "—"}</td>
            <td className="px-3 py-3.5 text-white font-medium">
              {o.price_label || formatPrice(o.price ?? null)}
            </td>
            <td className="px-3 py-3.5">
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] || "text-gray-400 bg-gray-500/10"}`}>
                {STATUS_OPTS.find(s => s.id === o.status)?.label || o.status}
              </span>
            </td>
            <td className="px-3 py-3.5 text-gray-500 text-xs">
              {o.photos?.length ? `${o.photos.length} фото` : "—"}
            </td>
            <td className="px-5 py-3.5 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  className="text-gray-600 hover:text-white transition-colors"
                  onClick={e => { e.stopPropagation(); onEdit(o) }}
                >
                  <Icon name="Pencil" className="h-4 w-4" />
                </button>
                <button
                  className="text-gray-700 hover:text-red-500 transition-colors"
                  onClick={e => { e.stopPropagation(); onDelete(o) }}
                >
                  <Icon name="Trash2" className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}