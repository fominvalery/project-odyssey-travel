import { useEffect, useRef, useState } from "react"

const YANDEX_API_KEY = "c82661bb-1958-4042-bd02-e02f758f1cd8"
const YANDEX_GEOCODER_KEY = "8966eab8-9617-4075-845c-184846af3286"

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
      if (window.ymaps3) { resolve(); return }
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", reject)
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

    const init = async () => {
      await new Promise(r => setTimeout(r, 100))
      if (destroyed || !containerRef.current) return

      await loadYandexMaps()
      await window.ymaps3.ready
      if (destroyed || !containerRef.current) return

      const coords = await geocode(query)
      if (!coords) { setNotFound(true); return }

      const { YMap, YMapDefaultScheme, YMapDefaultFeaturesLayer, YMapMarker } = window.ymaps3

      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }

      const map = new YMap(containerRef.current, {
        location: { center: [coords[1], coords[0]], zoom: 16 },
      })

      map.addChild(new YMapDefaultScheme())
      map.addChild(new YMapDefaultFeaturesLayer())

      // Простой маркер без внешних пакетов
      const markerEl = document.createElement("div")
      markerEl.style.cssText = "width:20px;height:20px;background:#e64646;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"
      map.addChild(new YMapMarker({ coordinates: [coords[1], coords[0]] }, markerEl))

      mapRef.current = map
    }

    init().catch(() => setNotFound(true))

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
