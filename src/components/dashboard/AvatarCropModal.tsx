import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import Icon from "@/components/ui/icon"

interface AvatarCropModalProps {
  imageSrc: string
  onClose: () => void
  onSave: (croppedBlob: string) => void
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement("canvas")
  const size = Math.min(pixelCrop.width, pixelCrop.height)
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  )

  return canvas.toDataURL("image/jpeg", 0.92)
}

export default function AvatarCropModal({ imageSrc, onClose, onSave }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleSave() {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels)
      onSave(result)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
          <p className="font-semibold text-white text-sm">Выберите область фото</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <Icon name="X" className="h-4 w-4" />
          </button>
        </div>

        {/* Поле кропа */}
        <div className="relative bg-[#0a0a0a]" style={{ height: 300 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: "#0a0a0a" },
              cropAreaStyle: { border: "2px solid #3b82f6" },
            }}
          />
        </div>

        {/* Зум */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Icon name="ZoomOut" className="h-4 w-4 text-gray-500 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-blue-500 h-1 cursor-pointer"
            />
            <Icon name="ZoomIn" className="h-4 w-4 text-gray-500 shrink-0" />
          </div>
          <p className="text-[11px] text-gray-600 text-center mt-2">Перетащи и масштабируй фото</p>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-gray-400 text-sm hover:text-white hover:border-[#3a3a3a] transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? "Сохраняю..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  )
}
