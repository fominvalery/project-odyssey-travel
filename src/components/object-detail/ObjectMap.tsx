import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const TILE_PROXY = "https://functions.poehali.dev/005b268c-77f7-4955-86e4-a56f799e8699"
const DADATA_PROXY = "https://functions.poehali.dev/aeb77da4-9bdd-4f20-b6b2-093b55af7853"

interface Props {
  city: string
  address: string
  lat?: number | null
  lon?: number | null
}

export default function ObjectMap({ city, address, lat, lon }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let destroyed = false

    const initMap = (clat: number, clon: number) => {
      if (destroyed || !containerRef.current) return
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([clat, clon], 16)

      L.tileLayer(`${TILE_PROXY}?x={x}&y={y}&z={z}`, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      L.marker([clat, clon]).addTo(map)
      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    }

    // Если есть сохранённые координаты — используем их
    if (lat && lon) {
      initMap(lat, lon)
      return
    }

    // Иначе геокодируем через DaData
    const query = [city, address].filter(Boolean).join(", ")
    if (!query) return

    fetch(`${DADATA_PROXY}?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        const first = data?.suggestions?.[0]
        if (!first?.lat || !first?.lon) { setNotFound(true); return }
        initMap(parseFloat(first.lat), parseFloat(first.lon))
      })
      .catch(() => setNotFound(true))

    return () => {
      destroyed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [city, address, lat, lon])

  if (notFound) return null

  return (
    <div className="rounded-2xl overflow-hidden border border-[#1f1f1f] mt-6" style={{ isolation: "isolate", zIndex: 0, position: "relative" }}>
      <div className="px-4 py-3 bg-[#111] border-b border-[#1f1f1f] flex items-center gap-2">
        <span className="text-sm font-medium text-white">Расположение</span>
        {(address || city) && (
          <span className="text-xs text-gray-400 truncate">{[address, city].filter(Boolean).join(", ")}</span>
        )}
      </div>
      <div ref={containerRef} style={{ height: 280, zIndex: 0 }} />
    </div>
  )
}
