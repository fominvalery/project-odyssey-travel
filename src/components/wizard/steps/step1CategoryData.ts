export const DEAL_TYPE_CATEGORIES = ["commercial", "residential"]

export const RESIDENTIAL_GROUPS = [
  {
    id: "urban",
    label: "Городская",
    desc: "Квартира, студия, апартаменты, комната",
    icon: "Building",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d5483eb7-291b-489e-a47f-d29a366ea71d.jpg",
  },
  {
    id: "suburban",
    label: "Загородная",
    desc: "Дом, коттедж, дача, таунхаус",
    icon: "TreePine",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
  {
    id: "premium",
    label: "Премиум",
    desc: "Вилла, пентхаус, особняк, элитная",
    icon: "Crown",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
]

export const RESORT_GROUPS = [
  {
    id: "accommodation",
    label: "Размещение",
    desc: "Отель, апарт-отель, гостиница, глэмпинг",
    icon: "Hotel",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
  {
    id: "wellness",
    label: "SPA и оздоровление",
    desc: "Санаторий, SPA, Wellness, медкурорт",
    icon: "Sparkles",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d5483eb7-291b-489e-a47f-d29a366ea71d.jpg",
  },
  {
    id: "nature",
    label: "Загородный отдых",
    desc: "База отдыха, эко-отель, кемпинг",
    icon: "Trees",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/8ac47afb-ca65-4fef-aadc-27cb63761b56.jpg",
  },
  {
    id: "invest",
    label: "Инвестиции",
    desc: "ГАБ, земля, проект под строительство",
    icon: "TrendingUp",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
]

export const AUCTION_GROUPS = [
  {
    id: "bankruptcy",
    label: "Банкротство",
    desc: "Физлица, юрлица, конкурсная масса",
    icon: "Scale",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/17b020ab-c66f-445a-8a81-9f2954d40507.jpg",
  },
  {
    id: "state",
    label: "Гос. и муниц.",
    desc: "РФФИ, Росимущество, муниципальные",
    icon: "Landmark",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  },
  {
    id: "pledge",
    label: "Залоговое",
    desc: "Залоги банков, арест, обременения",
    icon: "ShieldAlert",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
  {
    id: "special",
    label: "Спец. форматы",
    desc: "44-ФЗ, приватизация, исп. производство",
    icon: "FileText",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
]

export const INVESTMENT_GROUPS = [
  {
    id: "gab",
    label: "ГАБ",
    desc: "Готовый, создание, субаренда",
    icon: "Banknote",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
  {
    id: "redevelopment",
    label: "Редевелопмент",
    desc: "Проект, реконструкция, девелопмент",
    icon: "HardHat",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  },
  {
    id: "land",
    label: "Земельные участки",
    desc: "Под застройку, коммерцию, ИЖС",
    icon: "Map",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
  {
    id: "special",
    label: "Спец. форматы",
    desc: "Портфель, доля, Sale & Leaseback",
    icon: "Layers",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/17b020ab-c66f-445a-8a81-9f2954d40507.jpg",
  },
]

export const COMMERCIAL_GROUPS = [
  {
    id: "office",
    label: "Офисная",
    desc: "Офис, БЦ, коворкинг",
    icon: "BriefcaseBusiness",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  },
  {
    id: "retail",
    label: "Торговая",
    desc: "Ритейл, магазин, ТЦ, шоурум",
    icon: "ShoppingBag",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  },
  {
    id: "warehouse",
    label: "Склад / Произв.",
    desc: "Склад, логистика, промзона",
    icon: "Warehouse",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/17b020ab-c66f-445a-8a81-9f2954d40507.jpg",
  },
  {
    id: "service",
    label: "Сервис",
    desc: "Ресторан, салон, медцентр",
    icon: "UtensilsCrossed",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  },
  {
    id: "mixed",
    label: "Смешанные",
    desc: "ПСН, ОЗС, свободное назначение",
    icon: "LayoutGrid",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2e040e9f-00a8-40b1-801c-bd3442c7aafa.jpg",
  },
]

export const NEWBUILD_GROUPS = [
  {
    id: "commercial",
    label: "Коммерческая",
    desc: "Офис, ритейл в БЦ, стрит-ритейл в ЖК",
    icon: "Building2",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  },
  {
    id: "residential",
    label: "Жилая",
    desc: "Квартира, апартаменты, таунхаус",
    icon: "Home",
    bg: "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d5483eb7-291b-489e-a47f-d29a366ea71d.jpg",
  },
]

export const CAT_BG: Record<string, string> = {
  "commercial":  "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2b50fb88-f4e7-44ec-8719-e0fd7f90acf6.jpg",
  "investment":  "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/45105d0e-283b-4c24-96d6-9e70466ec426.jpg",
  "resort":      "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/af1636ce-1678-40e8-bfaf-e34e3c3e0013.jpg",
  "auction":     "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/17b020ab-c66f-445a-8a81-9f2954d40507.jpg",
  "residential": "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/d5483eb7-291b-489e-a47f-d29a366ea71d.jpg",
  "newbuild":    "https://cdn.poehali.dev/projects/850a4eaf-2855-417f-a5ae-4b60e5b39b32/files/2e040e9f-00a8-40b1-801c-bd3442c7aafa.jpg",
}

export const RESORT_SUBTYPE_ICONS: Record<string, string> = {
  "Апарт-отель": "Hotel",
  "Апарт-комплекс": "Building2",
  "Гостиница": "Hotel",
  "Отель": "Hotel",
  "Мини-отель": "Home",
  "Хостел": "Users",
  "Гостевой дом": "House",
  "Санаторий": "HeartPulse",
  "Пансионат": "Waves",
  "SPA-отель": "Sparkles",
  "Wellness-отель": "Leaf",
  "База отдыха": "Trees",
  "Турбаза": "Tent",
  "Эко-отель": "Leaf",
  "Курортный комплекс": "Sun",
  "Виллы и коттеджи под аренду": "Home",
  "Объект под управление": "BriefcaseBusiness",
  "Земельный участок под курортный проект": "Map",
  "Инвестиционный проект под строительство": "Construction",
  "Готовый арендный бизнес в курортной локации": "TrendingUp",
}