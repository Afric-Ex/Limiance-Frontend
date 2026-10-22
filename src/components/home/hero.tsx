import Image from "next/image";
import Backdrop from "@/public/limiance-landing.png";
import { HeroSignup } from "@/src/components/home/hero-signup";
import { GoogleSign } from "@/src/components/home/google-sign";
import { HeroIconContainer } from "@/src/components/shared/hero-icon-container";
import { QrCode } from "@/src/components/shared/qr-code";
import { PlayStore } from "@/src/components/icons/play-store";
import { MarketProvider } from "@/src/components/home/market-context";
import { LiveChart } from "@/src/components/home/live-chart";
import { MarketStrip } from "@/src/components/home/market-strip";
import { FloatingMovers } from "@/src/components/home/floating-movers";
import { glass } from "@/src/components/home/glass";
import { display } from "@/src/components/home/fonts";

export function Hero() {
  return (
    <MarketProvider>
      <section className="relative isolate shrink-0 overflow-hidden bg-[#05060b]">
        {/* Atmosphere: colored light for the glass to refract */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src={Backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-30 [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
          />
          <div className="absolute -left-40 top-24 h-[520px] w-[520px] rounded-full bg-[#4D77F0]/35 blur-[140px]" />
          <div className="absolute -right-32 -top-20 h-[560px] w-[560px] rounded-full bg-[#7C3AED]/30 blur-[150px]" />
          <div className="absolute -bottom-40 left-1/3 h-[420px] w-[620px] rounded-full bg-[#06B6D4]/20 blur-[140px]" />
        </div>

        <div className="mx-auto grid max-w-[1240px] items-center gap-16 px-4 pb-20 pt-[150px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
          <div className="flex flex-col gap-9">
            <div className="flex flex-col gap-6">
              <h1
                className={`${display.className} bg-gradient-to-b from-white to-white/50 bg-clip-text text-[44px] font-semibold leading-[0.98] tracking-[-0.04em] text-transparent sm:text-6xl lg:text-[76px]`}
              >
                Trade crypto with confidence
              </h1>
              <p className="max-w-[44ch] text-lg leading-relaxed text-white/70">
                Spot, futures, margin and P2P in one account. Deposit and
                withdraw naira by bank transfer.
              </p>
            </div>

            <div className={`${glass} max-w-[520px] rounded-2xl p-2`}>
              <HeroSignup />
            </div>

            <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-white/60">Or continue with</span>
                <GoogleSign />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-white/60">Get the app</span>
                <div className="flex gap-3">
                  <HeroIconContainer>
                    <QrCode />
                  </HeroIconContainer>
                  <HeroIconContainer>
                    <PlayStore />
                  </HeroIconContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Glass orb + live chart + floating live movers */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -right-8 -top-14 h-56 w-56 animate-float rounded-full motion-reduce:animate-none"
              style={{
                background:
                  "radial-gradient(circle at 30% 28%, rgba(255,255,255,.9), rgba(140,170,255,.7) 18%, rgba(77,119,240,.5) 46%, rgba(30,27,120,.3) 70%, transparent 72%)",
              }}
            />
            <div
              aria-hidden
              className="absolute -left-10 bottom-10 h-40 w-40 rounded-full bg-[#06B6D4]/40 blur-2xl"
            />
            <div className={`${glass} relative z-10 rounded-3xl p-5 sm:p-6`}>
              <LiveChart />
            </div>
            <FloatingMovers />
          </div>
        </div>

        <MarketStrip />
      </section>
    </MarketProvider>
  );
}