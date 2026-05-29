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

    L.tileLayer("https://functions.poehali.dev/005b268c-77f7-4955-86e4-a56f799e8699?x={x}&y={y}&z={z}", {
      attribution: '&copy; Яндекс.Карты',
      maxZoom: 19,
    }).addTo(map)

    setTimeout(() => map.invalidateSize(), 100)

    if (lat && lon) {
      markerRef.current = L.marker([lat, lon]).addTo(map)
    }

    // Клик на карту — только ставим маркер, поля не меняем
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clat, lng: clon } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([clat, clon])
      } else {
        markerRef.current = L.marker([clat, clon]).addTo(map)
      }
      onCoordsChange?.(clat, clon)
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
    if (query.length < 3) { setSuggestions([]); return }
    try {
      const res = await fetch(
        `https://functions.poehali.dev/aeb77da4-9bdd-4f20-b6b2-093b55af7853?q=${encodeURIComponent(query)}`
      )
      const data = await res.json()
      const suggestions: Suggestion[] = (data.suggestions || []).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => s.lat && s.lon
      )
      setSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
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
    onAddressChange(parts[0]?.trim() || s.display_name)
    const newLat = parseFloat(s.lat)
    const newLon = parseFloat(s.lon)
    console.log("[SELECT]", s.display_name, "lat=", newLat, "lon=", newLon)
    onCoordsChange?.(newLat, newLon)
    // Двигаем карту сразу при выборе
    if (mapRef.current && !isNaN(newLat) && !isNaN(newLon)) {
      const pos: [number, number] = [newLat, newLon]
      mapRef.current.setView(pos, 16)
      if (markerRef.current) {
        markerRef.current.setLatLng(pos)
      } else {
        markerRef.current = L.marker(pos).addTo(mapRef.current)
      }
    }
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
      <p className="text-xs text-gray-500">Начните вводить адрес и выберите из подсказок — карта переместится автоматически. Или кликните на карту чтобы поставить метку вручную.</p>
    </div>
  )
}