import { Header } from "@/components/Header"
import { HeroSection } from "@/components/HeroSection"
import { PricingPlansSection } from "@/components/PricingPlansSection"
import { CtaSection } from "@/components/CtaSection"

export default function Index() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-0 mt-0">
      <Header />
      <HeroSection />
      <PricingPlansSection />
      <CtaSection />
      <footer className="py-8 text-center text-sm text-gray-400">
        От поиска объекта до закрытия сделки —{" "}
        <span className="font-medium text-white">всё работает в одном месте.</span>
      </footer>
    </main>
  )
}