import Icon from "@/components/ui/icon"

const tools = [
  {
    icon: "Search",
    iconBg: "bg-blue-900/60",
    iconColor: "text-blue-400",
    title: "AI-поиск",
    desc: "Найдите объект текстовым запросом на естественном языке",
  },
  {
    icon: "PieChart",
    iconBg: "bg-blue-900/60",
    iconColor: "text-blue-400",
    title: "Кабинет инвестора",
    desc: "Портфель, отчёты по доходности и аналитика",
  },
  {
    icon: "Map",
    iconBg: "bg-blue-900/60",
    iconColor: "text-blue-400",
    title: "Карта объектов",
    desc: "Интерактивная карта с фильтрами и кластерами",
  },
]

export function BuyerToolsSection() {
  return (
    <section className="px-4 md:px-8 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-blue-500 text-sm font-semibold uppercase tracking-widest mb-3">Для покупателей и инвесторов</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">Найдите идеальный объект</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.title}
            className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-8 flex flex-col items-center text-center hover:border-[#2a2a2a] transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl ${tool.iconBg} flex items-center justify-center mb-5`}>
              <Icon name={tool.icon as "Search"} className={`h-6 w-6 ${tool.iconColor}`} />
            </div>
            <h3 className="text-white font-semibold text-base mb-2">{tool.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{tool.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
