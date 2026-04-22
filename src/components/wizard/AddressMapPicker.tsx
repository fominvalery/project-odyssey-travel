import { useState, useEffect, useRef, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Фикс иконок leaflet при сборке через vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

interface Props {
  city: string
  address: string
  onCityChange: (v: string) => void
  onAddressChange: (v: string) => void
  onCoordsChange?: (lat: number, lon: number) => void
  lat?: number
  lon?: number
}

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423]

export default function AddressMapPicker({
  city, address, onCityChange, onAddressChange, onCoordsChange, lat, lon,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Инициализация карты
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center: [number, number] = lat && lon ? [lat, lon] : DEFAULT_CENTER
    const map = L.map(containerRef.current, { zoomControl: true }).setView(center, lat && lon ? 16 : 11)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    if (lat && lon) {
      markerRef.current = L.marker([lat, lon]).addTo(map)
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clat, lng: clon } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([clat, clon])
      } else {
        markerRef.current = L.marker([clat, clon]).addTo(map)
      }
      onCoordsChange?.(clat, clon)
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clat}&lon=${clon}`,
        { headers: { "Accept-Language": "ru" } }
      )
        .then(r => r.json())
        .then(d => {
          const a = d.address
          const street = [a.road, a.house_number].filter(Boolean).join(", ")
          if (street) onAddressChange(street)
          if (a.city || a.town || a.village) onCityChange(a.city || a.town || a.village)
        })
        .catch(() => {})
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Перемещение маркера при изменении координат снаружи
  useEffect(() => {
    if (!mapRef.current || !lat || !lon) return
    const pos: [number, number] = [lat, lon]
    if (markerRef.current) {
      markerRef.current.setLatLng(pos)
    } else {
      markerRef.current = L.marker(pos).addTo(mapRef.current)
    }
    mapRef.current.setView(pos, 16)
  }, [lat, lon])

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 4) { setSuggestions([]); return }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { "Accept-Language": "ru" } }
      )
      const data: Suggestion[] = await res.json()
      setSuggestions(data)
      setShowSuggestions(true)
    } catch {
      setSuggestions([])
    }
  }, [])

  function handleAddressInput(val: string) {
    onAddressChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchAddress(city ? `${city}, ${val}` : val)
    }, 400)
  }

  function handleSelect(s: Suggestion) {
    const parts = s.display_name.split(",")
    onAddressChange(parts.slice(0, 3).join(",").trim())
    const newLat = parseFloat(s.lat)
    const newLon = parseFloat(s.lon)
    onCoordsChange?.(newLat, newLon)
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-4">
      {/* Город */}
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Город</label>
        <input
          value={city}
          onChange={e => onCityChange(e.target.value)}
          placeholder="Москва"
          className="w-full bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>

      {/* Адрес с автодополнением */}
      <div className="relative">
        <label className="text-xs text-gray-400 mb-1.5 block">Адрес</label>
        <input
          value={address}
          onChange={e => handleAddressInput(e.target.value)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="ул. Тверская, 1"
          className="w-full bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 transition-colors"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-[9999] left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
            {suggestions.map((s, i) => (
              <li
                key={i}
                onMouseDown={() => handleSelect(s)}
                className="px-4 py-2.5 text-sm text-gray-200 hover:bg-[#252525] cursor-pointer border-b border-[#222] last:border-0 truncate"
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Карта */}
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-[#1f1f1f]"
        style={{ height: 280 }}
      />
      <p className="text-xs text-gray-500">Нажмите на карту, чтобы уточнить местоположение</p>
    </div>
  )
}
