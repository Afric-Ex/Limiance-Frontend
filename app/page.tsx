import { AiBot } from "@/src/components/home/ai-bot";
import { LandingNav } from "@/src/components/home/landing-nav";
import { Hero } from "@/src/components/home/hero";
import { MarketsSection, PlatformSection, WhySection, SecuritySection, FaqSection, ClosingSection } from "@/src/components/home/sections";
import { LandingFooter } from "@/src/components/home/landing-footer";

export default function Home() {
  return (
    <main className="relative flex flex-col bg-[#0B0D12] text-[#E6E8EE]">
      <AiBot />
      <LandingNav />
      <Hero />
      <MarketsSection />
      <PlatformSection />
      <WhySection />
      <SecuritySection />
      <FaqSection />
      <ClosingSection />
      <LandingFooter />
    </main>
  );
}