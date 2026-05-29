import { useState, useEffect, useRef, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const GEOCODER_KEY = "8966eab8-9617-4075-845c-184846af3286"

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

async function geocodeQuery(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODER_KEY}&geocode=${encodeURIComponent(query)}&format=json&lang=ru_RU&results=1`
    const res = await fetch(url)
    const data = await res.json()
    const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
    if (!pos) return null
    const [lon, lat] = pos.split(" ").map(Number)
    return { lat, lon }
  } catch { return null }
}

async function reverseGeocode(lat: number, lon: number): Promise<{ address: string; city: string } | null> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODER_KEY}&geocode=${lon},${lat}&format=json&lang=ru_RU&results=1&kind=house`
    const res = await fetch(url)
    const data = await res.json()
    const obj = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
    if (!obj) return null
    const parts = obj.metaDataProperty?.GeocoderMetaData?.AddressDetails?.Country
    const locality = parts?.AdministrativeArea?.SubAdministrativeArea?.Locality?.LocalityName || ""
    return { address: obj.name || "", city: locality }
  } catch { return null }
}

async function suggestAddresses(query: string): Promise<Suggestion[]> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${GEOCODER_KEY}&geocode=${encodeURIComponent(query)}&format=json&lang=ru_RU&results=5`
    const res = await fetch(url)
    const data = await res.json()
    const members = data?.response?.GeoObjectCollection?.featureMember || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return members.map((m: any) => {
      const pos = m.GeoObject?.Point?.pos || ""
      const [lon, lat] = pos.split(" ")
      return {
        display_name: [m.GeoObject?.name, m.GeoObject?.description].filter(Boolean).join(", "),
        lat, lon,
      }
    })
  } catch { return [] }
}

export default function AddressMapPicker({
  city, address, onCityChange, onAddressChange, onCoordsChange, lat, lon,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center: [number, number] = lat && lon ? [lat, lon] : DEFAULT_CENTER
    const map = L.map(containerRef.current, { zoomControl: true }).setView(center, lat && lon ? 16 : 11)

    L.tileLayer("https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=ru_RU", {
      attribution: '&copy; <a href="https://yandex.ru/maps">Яндекс.Карты</a>',
      maxZoom: 19,
    }).addTo(map)

    setTimeout(() => map.invalidateSize(), 100)

    if (lat && lon) {
      markerRef.current = L.marker([lat, lon]).addTo(map)
    }

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat: clat, lng: clon } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([clat, clon])
      } else {
        markerRef.current = L.marker([clat, clon]).addTo(map)
      }
      onCoordsChange?.(clat, clon)
      const result = await reverseGeocode(clat, clon)
      if (result) {
        if (result.address) onAddressChange(result.address)
        if (result.city) onCityChange(result.city)
      }
    })

    mapRef.current = map

    if ((!lat || !lon) && (city || address)) {
      const q = [address, city].filter(Boolean).join(", ")
      geocodeQuery(q).then(result => {
        if (result && mapRef.current) {
          const pos: [number, number] = [result.lat, result.lon]
          mapRef.current.setView(pos, 15)
          if (markerRef.current) {
            markerRef.current.setLatLng(pos)
          } else {
            markerRef.current = L.marker(pos).addTo(mapRef.current!)
          }
          onCoordsChange?.(result.lat, result.lon)
        }
      })
    }

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    const results = await suggestAddresses(query)
    setSuggestions(results)
    setShowSuggestions(results.length > 0)
  }, [])

  function handleAddressInput(val: string) {
    onAddressChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchAddress(city ? `${city}, ${val}` : val)
    }, 400)
  }

  function handleSelect(s: Suggestion) {
    onAddressChange(s.display_name.split(",").slice(0, 2).join(",").trim())
    const newLat = parseFloat(s.lat)
    const newLon = parseFloat(s.lon)
    onCoordsChange?.(newLat, newLon)
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Город</label>
        <input
          value={city}
          onChange={e => onCityChange(e.target.value)}
          placeholder="Москва"
          className="w-full bg-[#111] border border-[#1f1f1f] text-white placeholder:text-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>

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

      <div ref={containerRef} className="rounded-xl overflow-hidden border border-[#1f1f1f]" style={{ height: 280 }} />
      <p className="text-xs text-gray-500">Нажмите на карту, чтобы уточнить местоположение</p>
    </div>
  )
}