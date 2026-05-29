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

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clat, lng: clon } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([clat, clon])
      } else {
        markerRef.current = L.marker([clat, clon]).addTo(map)
      }
      onCoordsChange?.(clat, clon)
      fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=8966eab8-9617-4075-845c-184846af3286&geocode=${clon},${clat}&format=json&lang=ru_RU&results=1&kind=house`
      )
        .then(r => r.json())
        .then(d => {
          const obj = d?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
          if (!obj) return
          const parts = obj.metaDataProperty?.GeocoderMetaData?.AddressDetails?.Country
          const locality = parts?.AdministrativeArea?.SubAdministrativeArea?.Locality?.LocalityName || ""
          if (obj.name) onAddressChange(obj.name)
          if (locality) onCityChange(locality)
        })
        .catch(() => {})
    })

    mapRef.current = map

    // Автогеокодинг при редактировании: нет координат, но есть адрес
    if ((!lat || !lon) && (city || address)) {
      const q = [city, address].filter(Boolean).join(", ")
      fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=8966eab8-9617-4075-845c-184846af3286&geocode=${encodeURIComponent(q)}&format=json&lang=ru_RU&results=1`
      )
        .then(r => r.json())
        .then(data => {
          const pos_str = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
          if (pos_str && mapRef.current) {
            const [autoLon, autoLat] = pos_str.split(" ").map(Number)
            const pos: [number, number] = [autoLat, autoLon]
            mapRef.current.setView(pos, 15)
            if (markerRef.current) {
              markerRef.current.setLatLng(pos)
            } else {
              markerRef.current = L.marker(pos).addTo(mapRef.current!)
            }
            onCoordsChange?.(autoLat, autoLon)
          }
        })
        .catch(() => {})
    }

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
        `https://geocode-maps.yandex.ru/1.x/?apikey=8966eab8-9617-4075-845c-184846af3286&geocode=${encodeURIComponent(query)}&format=json&lang=ru_RU&results=5`
      )
      const data = await res.json()
      const members = data?.response?.GeoObjectCollection?.featureMember || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const suggestions: Suggestion[] = members.map((m: any) => {
        const pos = m.GeoObject?.Point?.pos || ""
        const [lon, lat] = pos.split(" ")
        return {
          display_name: [m.GeoObject?.name, m.GeoObject?.description].filter(Boolean).join(", "),
          lat, lon,
        }
      })
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