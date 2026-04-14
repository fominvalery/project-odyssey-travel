import Icon from "@/components/ui/icon"

const categories = [
  {
    icon: "TrendingUp",
    iconBg: "bg-emerald-900/60",
    iconColor: "text-emerald-400",
    title: "Инвестиции",
    desc: "ROI-аналитика, стратегии, доходность",
  },
  {
    icon: "Building2",
    iconBg: "bg-blue-900/60",
    iconColor: "text-blue-400",
    title: "Коммерция",
    desc: "Офисы, склады, торговые площади",
  },
  {
    icon: "LayoutGrid",
    iconBg: "bg-violet-900/60",
    iconColor: "text-violet-400",
    title: "Новостройки",
    desc: "Шахматка, ход строительства",
  },
  {
    icon: "Gavel",
    iconBg: "bg-amber-900/60",
    iconColor: "text-amber-400",
    title: "Торги",
    desc: "Лоты ЭТП, банкротные аукционы",
  },
]

export function CategoriesSection() {
  return (
    <section className="px-4 md:px-8 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-blue-500 text-sm font-semibold uppercase tracking-widest mb-3">Категории</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">Все виды коммерческой недвижимости</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.title}
            className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 hover:border-[#2a2a2a] transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl ${cat.iconBg} flex items-center justify-center mb-5`}>
              <Icon name={cat.icon as "TrendingUp"} className={`h-6 w-6 ${cat.iconColor}`} />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">{cat.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{cat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
