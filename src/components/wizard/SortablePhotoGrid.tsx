import { useRef } from "react"
import Icon from "@/components/ui/icon"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import func2url from "../../../backend/func2url.json"

interface SortablePhotoProps {
  id: string
  url: string
  index: number
  onRemove: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
  isFirst: boolean
  isLast: boolean
}

function SortablePhoto({ id, url, index, onRemove, onMoveLeft, onMoveRight, isFirst, isLast }: SortablePhotoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square rounded-xl overflow-hidden border border-[#1f1f1f] touch-none"
    >
      <img src={url} alt="" className="w-full h-full object-cover" />

      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <Icon name="X" className="h-3 w-3 text-white" />
      </button>

      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {!isFirst && (
          <button
            type="button"
            onClick={onMoveLeft}
            className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <Icon name="ChevronLeft" className="h-3 w-3 text-white" />
          </button>
        )}
        {!isLast && (
          <button
            type="button"
            onClick={onMoveRight}
            className="w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <Icon name="ChevronRight" className="h-3 w-3 text-white" />
          </button>
        )}
      </div>

      {index === 0 && (
        <span className="absolute top-1 left-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md z-10">Главное</span>
      )}
    </div>
  )
}

interface SortablePhotoGridProps {
  photos: string[]
  uploadingPhoto: boolean
  onPhotosChange: (photos: string[]) => void
  onUploadingChange: (v: boolean) => void
}

export default function SortablePhotoGrid({ photos, uploadingPhoto, onPhotosChange, onUploadingChange }: SortablePhotoGridProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = photos.indexOf(active.id as string)
      const newIndex = photos.indexOf(over.id as string)
      onPhotosChange(arrayMove(photos, oldIndex, newIndex))
    }
  }

  function movePhoto(from: number, to: number) {
    onPhotosChange(arrayMove(photos, from, to))
  }

  function removePhoto(index: number) {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    onUploadingChange(true)
    const uploadUrl = (func2url as Record<string, string>)["upload-photo"]
    const uploaded: string[] = []
    for (const file of files) {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string)
        reader.readAsDataURL(file)
      })
      try {
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, content_type: file.type }),
        })
        const data = await res.json()
        if (data.url) uploaded.push(data.url)
      } catch {
        // пропускаем файл при ошибке
      }
    }
    onPhotosChange([...photos, ...uploaded])
    onUploadingChange(false)
    if (photoInputRef.current) photoInputRef.current.value = ""
  }

  return (
    <div>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePhotoSelect}
      />
      {photos.length > 0 && (
        <div className="mb-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={photos} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((url, i) => (
                  <SortablePhoto
                    key={url}
                    id={url}
                    url={url}
                    index={i}
                    onRemove={() => removePhoto(i)}
                    onMoveLeft={() => movePhoto(i, i - 1)}
                    onMoveRight={() => movePhoto(i, i + 1)}
                    isFirst={i === 0}
                    isLast={i === photos.length - 1}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="aspect-square rounded-xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a] flex flex-col items-center justify-center gap-1 hover:border-blue-500/50 transition-colors disabled:opacity-50"
                >
                  <Icon name="Plus" className="h-5 w-5 text-gray-500" />
                  <span className="text-xs text-gray-600">Ещё</span>
                </button>
              </div>
            </SortableContext>
          </DndContext>
          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1.5">
            <Icon name="GripHorizontal" className="h-3 w-3" /> Перетащите фото для изменения порядка. Первое — главное.
          </p>
        </div>
      )}
      {photos.length === 0 && (
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={uploadingPhoto}
          className="w-full rounded-xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a] p-6 flex flex-col items-center gap-2 hover:border-blue-500/50 transition-colors disabled:opacity-50"
        >
          {uploadingPhoto ? (
            <Icon name="Loader2" className="h-6 w-6 text-gray-500 animate-spin" />
          ) : (
            <Icon name="ImagePlus" className="h-6 w-6 text-gray-500" />
          )}
          <span className="text-sm text-gray-500">
            {uploadingPhoto ? "Загрузка..." : "Нажмите, чтобы добавить фото"}
          </span>
          <span className="text-xs text-gray-600">JPG, PNG, WEBP до 10 МБ</span>
        </button>
      )}
      {uploadingPhoto && photos.length > 0 && (
        <p className="text-xs text-blue-400 flex items-center gap-1.5 mt-2">
          <Icon name="Loader2" className="h-3 w-3 animate-spin" /> Загрузка фото...
        </p>
      )}
    </div>
  )
}
