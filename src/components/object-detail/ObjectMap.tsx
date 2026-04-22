import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface Props {
  city: string
  address: string
}

export default function ObjectMap({ city, address }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const query = [address, city].filter(Boolean).join(", ")
    if (!query) return

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { "Accept-Language": "ru" } }
    )
      .then(r => r.json())
      .then((data: { lat: string; lon: string }[]) => {
        if (!data.length) { setNotFound(true); return }
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)

        if (!containerRef.current) return

        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }

        const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false })
          .setView([lat, lon], 16)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        L.marker([lat, lon]).addTo(map)
        mapRef.current = map
      })
      .catch(() => setNotFound(true))

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [city, address])

  if (notFound) return null

  return (
    <div className="rounded-2xl overflow-hidden border border-[#1f1f1f] mt-6">
      <div className="px-4 py-3 bg-[#111] border-b border-[#1f1f1f] flex items-center gap-2">
        <span className="text-sm font-medium text-white">Расположение</span>
        {(address || city) && (
          <span className="text-xs text-gray-400 truncate">{[address, city].filter(Boolean).join(", ")}</span>
        )}
      </div>
      <div ref={containerRef} style={{ height: 280 }} />
    </div>
  )
}
