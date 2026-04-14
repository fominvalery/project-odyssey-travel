const tools = [
  {
    title: "Генерация видео с ИИ",
    desc: "Превратите фото объектов в кинематографичные видеотуры одним кликом.",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/aa009eb5-54e2-45f4-84d5-5217493ca447.jpg",
  },
  {
    title: "Комната сделки",
    desc: "Пошаговое ведение сделки от бронирования до закрытия с контролем документов.",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/a8c94cee-c110-4186-b8bb-da1f6a92e543.jpg",
  },
  {
    title: "CRM и аналитика команды",
    desc: "Иерархия сотрудников, воронка лидов и метрики эффективности каждого агента.",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/c1bf69d1-b826-4f96-b482-5c98c39526dd.png",
  },
  {
    title: "Мгновенные лендинги",
    desc: "Каждый объект получает конверсионный лендинг, оптимизированный для мобильных.",
    img: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/bucket/c1bf69d1-b826-4f96-b482-5c98c39526dd.png",
  },
]

export function SellerToolsSection() {
  return (
    <section className="px-4 md:px-8 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-blue-500 text-sm font-semibold uppercase tracking-widest mb-3">Для продавцов и агентств</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Инструменты для роста продаж</h2>
        <p className="text-gray-400">AI-автоматизация, CRM и управление сделками — всё под рукой</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div key={tool.title} className="rounded-2xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
            <div className="h-52 overflow-hidden">
              <img src={tool.img} alt={tool.title} className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-6">
              <h3 className="text-white font-semibold text-lg mb-2">{tool.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{tool.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}