import { useState, useEffect, useRef, useCallback } from "react"

const YANDEX_API_KEY = "c82661bb-1958-4042-bd02-e02f758f1cd8"
const YANDEX_GEOCODER_KEY = "8966eab8-9617-4075-845c-184846af3286"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ymaps3: any
  }
}

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

function loadYandexMaps(): Promise<void> {
  if (window.ymaps3) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("ymaps3-script")
    if (existing) {
      existing.addEventListener("load", () => resolve())
      return
    }
    const script = document.createElement("script")
    script.id = "ymaps3-script"
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${YANDEX_API_KEY}&lang=ru_RU`
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function geocodeQuery(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${encodeURIComponent(query)}&format=json&lang=ru_RU&results=1`
    const res = await fetch(url)
    const data = await res.json()
    const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
    if (!pos) return null
    const [lon, lat] = pos.split(" ").map(Number)
    return { lat, lon }
  } catch {
    return null
  }
}

async function reverseGeocodeCoords(lat: number, lon: number): Promise<{ address: string; city: string } | null> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${lon},${lat}&format=json&lang=ru_RU&results=1&kind=house`
    const res = await fetch(url)
    const data = await res.json()
    const obj = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
    if (!obj) return null
    const parts = obj.metaDataProperty?.GeocoderMetaData?.AddressDetails?.Country
    const locality = parts?.AdministrativeArea?.SubAdministrativeArea?.Locality?.LocalityName || ""
    const address = obj.name || ""
    return { address, city: locality }
  } catch {
    return null
  }
}

async function suggestAddresses(query: string): Promise<Suggestion[]> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${encodeURIComponent(query)}&format=json&lang=ru_RU&results=5`
    const res = await fetch(url)
    const data = await res.json()
    const members = data?.response?.GeoObjectCollection?.featureMember || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return members.map((m: any) => {
      const pos = m.GeoObject?.Point?.pos || ""
      const [lon, lat] = pos.split(" ")
      return {
        display_name: [m.GeoObject?.name, m.GeoObject?.description].filter(Boolean).join(", "),
        lat,
        lon,
      }
    })
  } catch {
    return []
  }
}

export default function AddressMapPicker({
  city, address, onCityChange, onAddressChange, onCoordsChange, lat, lon,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let destroyed = false

    loadYandexMaps()
      .then(() => window.ymaps3.ready)
      .then(async () => {
        if (destroyed || !containerRef.current) return

        const { YMap, YMapDefaultScheme, YMapDefaultFeaturesLayer, YMapDefaultMarker, YMapListener } = window.ymaps3

        const center = lat && lon ? [lon, lat] : [DEFAULT_CENTER[1], DEFAULT_CENTER[0]]
        const zoom = lat && lon ? 16 : 11

        const map = new YMap(containerRef.current, {
          location: { center, zoom },
        })

        map.addChild(new YMapDefaultScheme())
        map.addChild(new YMapDefaultFeaturesLayer())

        if (lat && lon) {
          const marker = new YMapDefaultMarker({ coordinates: [lon, lat] })
          map.addChild(marker)
          markerRef.current = marker
        }

        const listener = new YMapListener({
          layer: "any",
          onClick: async (_obj: unknown, event: { coordinates: [number, number] }) => {
            const [clon, clat] = event.coordinates
            onCoordsChange?.(clat, clon)

            if (markerRef.current) map.removeChild(markerRef.current)
            const newMarker = new YMapDefaultMarker({ coordinates: [clon, clat] })
            map.addChild(newMarker)
            markerRef.current = newMarker

            const result = await reverseGeocodeCoords(clat, clon)
            if (result) {
              if (result.address) onAddressChange(result.address)
              if (result.city) onCityChange(result.city)
            }
          },
        })
        map.addChild(listener)
        mapRef.current = map

        if ((!lat || !lon) && (city || address)) {
          const q = [address, city].filter(Boolean).join(", ")
          const result = await geocodeQuery(q)
          if (result && mapRef.current && !destroyed) {
            map.setLocation({ center: [result.lon, result.lat], zoom: 15 })
            if (markerRef.current) map.removeChild(markerRef.current)
            const m = new YMapDefaultMarker({ coordinates: [result.lon, result.lat] })
            map.addChild(m)
            markerRef.current = m
            onCoordsChange?.(result.lat, result.lon)
          }
        }
      })
      .catch(() => {})

    return () => {
      destroyed = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
        markerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || !lat || !lon) return
    const { YMapDefaultMarker } = window.ymaps3
    if (markerRef.current) mapRef.current.removeChild(markerRef.current)
    const m = new YMapDefaultMarker({ coordinates: [lon, lat] })
    mapRef.current.addChild(m)
    markerRef.current = m
    mapRef.current.setLocation({ center: [lon, lat], zoom: 16 })
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

      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-[#1f1f1f]"
        style={{ height: 280 }}
      />
      <p className="text-xs text-gray-500">Нажмите на карту, чтобы уточнить местоположение</p>
    </div>
  )
}