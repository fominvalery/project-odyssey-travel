export const STEPS = ["Тип проекта", "Локация", "Характеристики", "Описание и фото", "Публикация"]

export const PROJECT_TYPES = [
  {
    id: "bc", label: "Бизнес-центр", desc: "Офисная недвижимость, БЦ класса A/B/C",
    icon: "Building2", bg: "from-blue-900/60 to-blue-800/40", border: "border-blue-500/50", accent: "bg-blue-900/40",
  },
  {
    id: "mfk", label: "МФК", desc: "Многофункциональный комплекс",
    icon: "Layers", bg: "from-violet-900/60 to-violet-800/40", border: "border-violet-500/50", accent: "bg-violet-900/40",
  },
  {
    id: "zhk", label: "Жилой комплекс", desc: "ЖК, апартаменты, жильё",
    icon: "Home", bg: "from-emerald-900/60 to-emerald-800/40", border: "border-emerald-500/50", accent: "bg-emerald-900/40",
  },
  {
    id: "kp", label: "Коттеджный посёлок", desc: "КП, таунхаусы, загородная застройка",
    icon: "TreePine", bg: "from-green-900/60 to-green-800/40", border: "border-green-500/50", accent: "bg-green-900/40",
  },
  {
    id: "tc", label: "Торговый центр", desc: "ТЦ, ТРЦ, стрит-ритейл",
    icon: "ShoppingBag", bg: "from-orange-900/60 to-orange-800/40", border: "border-orange-500/50", accent: "bg-orange-900/40",
  },
  {
    id: "sk", label: "Складской комплекс", desc: "Логистика, склады, производство",
    icon: "Warehouse", bg: "from-slate-800/80 to-slate-700/40", border: "border-slate-500/50", accent: "bg-slate-800/40",
  },
  {
    id: "gk", label: "Гостиница / Отель", desc: "Апарт-отель, курортная недвижимость",
    icon: "Hotel", bg: "from-amber-900/60 to-amber-800/40", border: "border-amber-500/50", accent: "bg-amber-900/40",
  },
  {
    id: "other", label: "Другой проект", desc: "Производство, инфраструктура, прочее",
    icon: "LayoutGrid", bg: "from-gray-800/80 to-gray-700/40", border: "border-gray-500/50", accent: "bg-gray-800/40",
  },
]

export const PROJECT_CLASSES = [
  { id: "A+", label: "A+" }, { id: "A", label: "A" },
  { id: "B+", label: "B+" }, { id: "B", label: "B" },
  { id: "C", label: "C" }, { id: "eco", label: "Эконом" },
  { id: "biz", label: "Бизнес" }, { id: "pre", label: "Премиум" },
]

export const PROJECT_STATUSES = [
  { id: "planned", label: "Планируется" },
  { id: "construction", label: "Строится" },
  { id: "completed", label: "Сдан" },
  { id: "active", label: "Активно продаётся" },
]

export const TYPE_LABELS: Record<string, string> = {
  bc: "Бизнес-центр", mfk: "МФК", zhk: "ЖК", kp: "Коттеджный посёлок",
  tc: "Торговый центр", sk: "Складской комплекс", gk: "Гостиница", other: "Проект",
}
