import { useState } from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

const CATEGORIES = ["Все", "Коммерческая", "Инвестиционная", "С торгов", "Новостройки", "Редевелопмент"]

const OBJECTS = [
  {
    id: 1,
    title: "Торговое помещение на первой линии",
    type: "Коммерческая",
    city: "Москва, ЦАО",
    price: "18 500 000 ₽",
    area: "142 м²",
    yield: "9.2%",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    badge: "Горячее",
    badgeColor: "bg-orange-500",
  },
  {
    id: 2,
    title: "Офисный блок в бизнес-центре класса B+",
    type: "Коммерческая",
    city: "Москва, СЗАО",
    price: "42 000 000 ₽",
    area: "310 м²",
    yield: "8.5%",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
    badge: null,
    badgeColor: "",
  },
  {
    id: 3,
    title: "Производственно-складской комплекс",
    type: "Инвестиционная",
    city: "Московская обл., Химки",
    price: "87 000 000 ₽",
    area: "1 200 м²",
    yield: "11.3%",
    img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
    badge: "Инвестиции",
    badgeColor: "bg-violet-600",
  },
  {
    id: 4,
    title: "Помещение под общепит / стрит-ритейл",
    type: "С торгов",
    city: "Санкт-Петербург, Центр",
    price: "6 200 000 ₽",
    area: "78 м²",
    yield: "12.1%",
    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
    badge: "Торги",
    badgeColor: "bg-green-600",
  },
  {
    id: 5,
    title: "Апарт-комплекс на этапе котлована",
    type: "Новостройки",
    city: "Москва, ЮАО",
    price: "от 7 400 000 ₽",
    area: "от 38 м²",
    yield: "15%",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
    badge: "Новостройка",
    badgeColor: "bg-blue-600",
  },
  {
    id: 6,
    title: "Промышленный объект под редевелопмент",
    type: "Редевелопмент",
    city: "Москва, ВАО",
    price: "135 000 000 ₽",
    area: "3 500 м²",
    yield: "—",
    img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    badge: "Редевелопмент",
    badgeColor: "bg-amber-600",
  },
]

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("Все")
  const [search, setSearch] = useState("")

  const filtered = OBJECTS.filter((o) => {
    const matchCat = activeCategory === "Все" || o.type === activeCategory
    const matchSearch = o.title.toLowerCase().includes(search.toLowerCase()) || o.city.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <section className="px-4 md:px-8 pt-8 pb-16 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Маркетплейс объектов</h1>
          <p className="text-gray-400">Коммерческая, инвестиционная недвижимость, торги и новостройки</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Поиск по названию или городу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#141414] border-[#262626] text-white placeholder:text-gray-500 focus-visible:ring-violet-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-violet-600 text-white"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#262626]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Объекты не найдены</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((obj) => (
              <div
                key={obj.id}
                className="rounded-2xl bg-[#111111] border border-[#1f1f1f] overflow-hidden hover:border-violet-500/40 transition-colors group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={obj.img}
                    alt={obj.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {obj.badge && (
                    <span className={`absolute top-3 left-3 ${obj.badgeColor} text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
                      {obj.badge}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-xs text-gray-500 mb-1">{obj.type}</p>
                  <h3 className="text-white font-semibold text-sm mb-2 leading-snug">{obj.title}</h3>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
                    <Icon name="MapPin" className="h-3.5 w-3.5 text-violet-400" />
                    {obj.city}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-white">{obj.price}</p>
                      <p className="text-xs text-gray-500">{obj.area}</p>
                    </div>
                    {obj.yield !== "—" && (
                      <div className="text-right">
                        <p className="text-green-400 font-semibold text-sm">{obj.yield}</p>
                        <p className="text-xs text-gray-500">доходность</p>
                      </div>
                    )}
                  </div>

                  <Button className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm">
                    Подробнее
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
