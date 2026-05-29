import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const GEOCODER_KEY = "8966eab8-9617-4075-845c-184846af3286"

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

    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODER_KEY}&geocode=${encodeURIComponent(query)}&format=json&lang=ru_RU&results=1`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
        if (!pos) { setNotFound(true); return }
        const [lon, lat] = pos.split(" ").map(Number)

        if (!containerRef.current) return

        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }

        const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false })
          .setView([lat, lon], 16)

        L.tileLayer("https://functions.poehali.dev/005b268c-77f7-4955-86e4-a56f799e8699?x={x}&y={y}&z={z}", {
          attribution: '&copy; <a href="https://yandex.ru/maps">Яндекс.Карты</a>',
          maxZoom: 19,
        }).addTo(map)

        L.marker([lat, lon]).addTo(map)
        mapRef.current = map
        setTimeout(() => map.invalidateSize(), 100)
      })
      .catch(() => setNotFound(true))

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [city, address])

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