import { AiBot } from "@/src/components/home/ai-bot";
import { Hero } from "@/src/components/home/hero";
import { Modes, Naira, Trust, Faq, Cta } from "@/src/components/home/sections";

export default function Home() {
  return (
    <main className="flex flex-col overflow-x-hidden bg-[#05060b] text-white">
      <AiBot />
      <Hero />
      <Modes />
      <Naira />
      <Trust />
      <Faq />
      <Cta />
    </main>
  );
}