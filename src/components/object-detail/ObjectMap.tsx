import { useEffect, useRef, useState } from "react"

const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || ""
const YANDEX_GEOCODER_KEY = import.meta.env.VITE_YANDEX_GEOCODER_KEY || ""

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ymaps3: any
  }
}

interface Props {
  city: string
  address: string
}

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

async function geocode(query: string): Promise<[number, number] | null> {
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${encodeURIComponent(query)}&format=json&lang=ru_RU&results=1`
  const res = await fetch(url)
  const data = await res.json()
  const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
  if (!pos) return null
  const [lon, lat] = pos.split(" ").map(Number)
  return [lat, lon]
}

export default function ObjectMap({ city, address }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const query = [address, city].filter(Boolean).join(", ")
    if (!query) return

    let destroyed = false

    loadYandexMaps()
      .then(() => window.ymaps3.ready)
      .then(async () => {
        if (destroyed || !containerRef.current) return
        const coords = await geocode(query)
        if (!coords) { setNotFound(true); return }

        const { YMap, YMapDefaultScheme, YMapDefaultMarker, YMapDefaultFeaturesLayer } = window.ymaps3

        if (mapRef.current) {
          mapRef.current.destroy()
          mapRef.current = null
        }

        const map = new YMap(containerRef.current, {
          location: { center: [coords[1], coords[0]], zoom: 16 },
        })

        map.addChild(new YMapDefaultScheme())
        map.addChild(new YMapDefaultFeaturesLayer())
        map.addChild(new YMapDefaultMarker({ coordinates: [coords[1], coords[0]] }))

        mapRef.current = map
      })
      .catch(() => setNotFound(true))

    return () => {
      destroyed = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
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