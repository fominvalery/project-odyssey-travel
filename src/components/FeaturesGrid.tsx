import Icon from "@/components/ui/icon"

const features = [
  {
    icon: "Building2",
    title: "Все типы недвижимости",
    description: "Коммерческая, инвестиционная, с торгов и новостройки — в одном каталоге",
    color: "text-violet-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/e6cec24f-7520-4be6-b02a-b4756d54ec30.jpg",
  },
  {
    icon: "Users",
    title: "CRM для агентов",
    description: "Управляйте клиентами, сделками и задачами без сторонних сервисов",
    color: "text-blue-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/aa5ed488-2cdb-4be3-8a18-1cfdd5117a62.jpg",
  },
  {
    icon: "Gavel",
    title: "Недвижимость с торгов",
    description: "Эксклюзивные объекты из банкротств и аукционов по сниженным ценам",
    color: "text-rose-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/cec11c52-110e-448c-af83-5293f36a26e5.jpg",
  },
  {
    icon: "Share2",
    title: "Реферальная программа",
    description: "Приглашайте коллег и зарабатывайте с каждой их сделки",
    color: "text-emerald-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/683e926a-29b9-4a75-984e-fd0422e0a55d.jpg",
  },
  {
    icon: "BarChart3",
    title: "Аналитика",
    description: "Просмотры, заявки и эффективность размещений в реальном времени",
    color: "text-amber-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/bf01a684-3b20-44a1-8a01-b2f1b74caf4f.jpg",
  },
  {
    icon: "Building",
    title: "Агентский кабинет",
    description: "Команда, отделы и объекты — всё в едином интерфейсе",
    color: "text-cyan-400",
    image: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/935b2ef7-7117-4d56-a586-bf75e8054d32.jpg",
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
            className="group rounded-2xl overflow-hidden border border-[#1f1f1f] bg-[#111111] hover:border-[#2a2a2a] transition-colors"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={f.image}
                alt={f.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon name={f.icon} size={15} className={f.color} />
                <h3 className="text-white font-semibold">{f.title}</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}