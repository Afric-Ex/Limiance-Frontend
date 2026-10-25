import Image from "next/image";
import Wordmark from "@/public/limiance-wordmark.png";
import Backdrop from "@/public/limiance-landing.png";
import { HeroSignup } from "./hero-signup";
import { GoogleSign } from "./google-sign";
import { HeroIconContainer } from "@/src/components/shared/hero-icon-container";
import { QrCode } from "@/src/components/shared/qr-code";
import { PlayStore } from "@/src/components/icons/play-store";
import { TerminalPreview } from "./terminal-preview";
import { mono, sans } from "./fonts";

const MARKETS = ["Spot", "Futures", "Margin", "P2P"];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-0 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(77,119,240,0.10),transparent)]" />
      {/* Brand texture, kept faint and faded toward the bottom. To go back to a plain grid, swap this for the previous grid div. */}
      <Image src={Backdrop} alt="" aria-hidden fill priority sizes="100vw" className="object-cover object-top opacity-60 [mask-image:linear-gradient(to_bottom,black_35%,transparent_95%)]" />

      <div className="relative mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)] items-center gap-14 px-4 pb-24 pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:pt-16">
        <div className="flex min-w-0 flex-col gap-8">
          <Image src={Wordmark} alt="Limiance Exchange" priority width={240} height={60} className="h-auto w-[200px] sm:w-[240px]" />
          <div className="flex flex-col gap-5">
            <h1 className={`${sans.className} text-[40px] font-semibold leading-[1.04] tracking-[-0.03em] text-white sm:text-[56px]`}>
              Trade crypto with precision.
            </h1>
            <p className="max-w-[46ch] text-[17px] leading-relaxed text-[#A7AEBD]">
              Spot, futures, margin and P2P markets with live charts and order books. Deposit and withdraw naira by bank transfer.
            </p>
          </div>

          <div className="flex max-w-[500px] flex-col gap-4">
            <HeroSignup />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <GoogleSign />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8A91A0]">Get the app</span>
                <HeroIconContainer><QrCode /></HeroIconContainer>
                <HeroIconContainer><PlayStore /></HeroIconContainer>
              </div>
            </div>
          </div>

          <ul className={`${mono.className} flex flex-wrap gap-x-5 gap-y-1 border-t border-white/[0.08] pt-5 text-[13px] text-[#8A91A0]`}>
            {MARKETS.map((m) => <li key={m} className="flex items-center gap-2"><span className="h-1 w-1 bg-[#4D77F0]" aria-hidden />{m}</li>)}
          </ul>
        </div>

        <TerminalPreview />
      </div>
    </section>
  );
}