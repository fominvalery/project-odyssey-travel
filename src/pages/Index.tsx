import { Header } from "@/components/Header"
import { HeroSection } from "@/components/HeroSection"
import { FeaturesGrid } from "@/components/FeaturesGrid"
import { PricingPlansSection } from "@/components/PricingPlansSection"
import { CtaSection } from "@/components/CtaSection"
import { Footer } from "@/components/Footer"

export default function Index() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-0 mt-0">
      <Header />
      <HeroSection />
      <FeaturesGrid />
      <PricingPlansSection />
      <CtaSection />
      <Footer />
    </main>
  )
}