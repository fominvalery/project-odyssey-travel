import Icon from "@/components/ui/icon"

const features = [
  {
    icon: "Building2",
    title: "Все типы недвижимости",
    description: "Коммерческая, инвестиционная, с торгов и новостройки — в одном каталоге",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: "Users",
    title: "CRM для агентов",
    description: "Управляйте клиентами, сделками и задачами без сторонних сервисов",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: "Share2",
    title: "Реферальная программа",
    description: "Приглашайте коллег и зарабатывайте с каждой их сделки на платформе",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: "BarChart3",
    title: "Аналитика и статистика",
    description: "Отслеживайте просмотры объектов, заявки и эффективность размещений",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: "Gavel",
    title: "Недвижимость с торгов",
    description: "Эксклюзивные объекты из банкротств и аукционов по сниженным ценам",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: "Building",
    title: "Агентский кабинет",
    description: "Управляйте командой, отделами и объектами через единый интерфейс",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
]

export function FeaturesGrid() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">Возможности</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Всё что нужно — уже внутри
        </h2>
        <p className="mt-3 text-gray-400 max-w-xl mx-auto">
          Кабинет-24 объединяет инструменты для поиска, продажи и управления коммерческой недвижимостью в одной платформе
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 hover:border-[#2a2a2a] transition-colors"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${f.bg} mb-4`}>
              <Icon name={f.icon} size={20} className={f.color} />
            </div>
            <h3 className="text-white font-semibold mb-1.5">{f.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
