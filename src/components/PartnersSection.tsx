import Icon from "@/components/ui/icon"

const partners = [
  { name: "Грин", icon: "Leaf" },
  { name: "Про", icon: "Briefcase" },
  { name: "Про+", icon: "Star" },
  { name: "Конструктор", icon: "Settings2" },
  { name: "CRM", icon: "LayoutDashboard" },
  { name: "Маркетплейс", icon: "Store" },
  { name: "Рефералы", icon: "Users" },
] as const

export function PartnersSection() {
  return (
    <section className="flex flex-wrap items-center justify-center gap-6 md:gap-10 px-4 py-8">
      {partners.map((partner) => (
        <div key={partner.name} className="flex items-center gap-2 text-gray-500">
          <Icon name={partner.icon} className="h-4 w-4" />
          <span className="text-sm font-medium">{partner.name}</span>
        </div>
      ))}
    </section>
  )
}
