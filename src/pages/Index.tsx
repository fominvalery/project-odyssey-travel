import { Header } from "@/components/Header"
import { HeroSection } from "@/components/HeroSection"
import { FeaturesGrid } from "@/components/FeaturesGrid"
import { PricingPlansSection } from "@/components/PricingPlansSection"
import { ReferralBannerSection } from "@/components/ReferralBannerSection"
import { ClubBannerSection } from "@/components/ClubBannerSection"
import { CtaSection } from "@/components/CtaSection"
import { Footer } from "@/components/Footer"

export default function Index() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-0 mt-0">
      <Header />
      <HeroSection />
      <FeaturesGrid />
      <PricingPlansSection />
      <ReferralBannerSection />
      <ClubBannerSection />
      <CtaSection />
      <Footer />
    </main>
  )
}