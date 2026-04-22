import { useState, useEffect, useRef, useCallback } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import { Icon as LeafletIcon } from "leaflet"
import "leaflet/dist/leaflet.css"

const markerIcon = new LeafletIcon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
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

function MapCenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], 16)
  }, [lat, lon, map])
  return null
}

function ClickMarker({ onMove }: { onMove: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function AddressMapPicker({
  city, address, onCityChange, onAddressChange, onCoordsChange, lat, lon,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    lat && lon ? [lat, lon] : null
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    const newPos: [number, number] = [parseFloat(s.lat), parseFloat(s.lon)]
    setMarkerPos(newPos)
    onCoordsChange?.(newPos[0], newPos[1])
    setSuggestions([])
    setShowSuggestions(false)
  }

  function handleMapClick(lat: number, lon: number) {
    setMarkerPos([lat, lon])
    onCoordsChange?.(lat, lon)
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
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
  }

  const defaultCenter: [number, number] = markerPos ?? [55.751244, 37.618423]

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
      <div className="rounded-xl overflow-hidden border border-[#1f1f1f]" style={{ height: 280 }}>
        <MapContainer
          center={defaultCenter}
          zoom={markerPos ? 16 : 11}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {markerPos && <MapCenter lat={markerPos[0]} lon={markerPos[1]} />}
          <ClickMarker onMove={handleMapClick} />
          {markerPos && <Marker position={markerPos} icon={markerIcon} />}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500">Нажмите на карту, чтобы уточнить местоположение</p>
    </div>
  )
}
