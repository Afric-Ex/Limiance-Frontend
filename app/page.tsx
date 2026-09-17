import { Dot } from "@/src/components/icons/dot";
import { PlayStore } from "@/src/components/icons/play-store";
import { HeroIconContainer } from "@/src/components/shared/hero-icon-container";
import { QrCode } from "@/src/components/shared/qr-code";
import Image from "next/image";
import HeroImage from "@/public/hero-image.png";
import MarketDisplay from "@/public/market-display.png";
import Bitcoin from "@/public/bitcoin-white.png";
import Convert from "@/public/convert.png";
import { IoIosArrowDown } from "react-icons/io";
import { FAQ } from "@/src/components/home/faq";
import { Star } from "@/src/components/icons/star";
import { Circle } from "@/src/components/icons/circle";
import { DoubleCircle } from "@/src/components/icons/double-circle";
import { GoogleSign } from "@/src/components/home/google-sign";
import { AiBot } from "@/src/components/home/ai-bot";
import { HeroSignup } from "@/src/components/home/hero-signup";

export default function Home() {
  return (
    <main className="flex flex-col">
      <AiBot />
      <div className="flex flex-col bg-landing bg-cover bg-no-repeat">
        <div className="min-h-hero relative pt-94px flex flex-col">
          <Star className="absolute left-[10%] top-[10%] animate-spin" />
          <DoubleCircle className="absolute animate-spin right-[10%] top-[7%]" />
          <Circle
            color="var(--primary)"
            className="absolute animate-bounce left-[15%] top-[30%]"
          />
          <Circle className="absolute right-[8%] bottom-[50%] animate-bounce" />
          <Circle className="absolute w-6 h-6 left-[15%] bottom-[30%] animate-bounce" />
          <Star className="absolute w-10 right-[10%] animate-spin bottom-[10%]" />
          <div className="flex flex-1 flex-col gap-10 items-center">
            <div className="flex flex-col gap-5 items-center">
              <h1 className="md:text-38px text-2xl text-center font-bold">
                The Most <span className="text-primary">Trusted _</span>{" "}
                Exchange Platform
              </h1>
              <div className="flex md:text-sm px-2 text-xs flex-wrap justify-center items-center gap-2">
                <span className="font-medium">
                  Experience Instant Transactions
                </span>
                <Dot />
                <span className="font-medium">
                  Advance Tools at your fingertips
                </span>
                <Dot />
                <span className="font-medium">Security You Can Trust</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between items-center gap-8">
              <div className="flex flex-col items-center gap-8">
                <div className="flex items-center gap-3">
                  <HeroSignup />
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex items-center justify-between h-full flex-col gap-2">
                    <span className="text-xs">Other Options</span>
                    <div className="flex gap-3">
                      <GoogleSign />
                      {/* <HeroIconContainer>
                        <Apple />
                      </HeroIconContainer> */}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs">Download our App</span>
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
              <Image
                src={HeroImage}
                alt="hero image"
                className="w-full max-w-902px object-cover"
              />
            </div>
          </div>
        </div>
        <div className="mt-20 flex flex-col gap-20">
          <h2 className="self-center text-xl md:text-32px font-semibold text-center">
            Why choose <span className="text-primary">Us</span>?
          </h2>
          <div className="app-container items-center gap-4 grid grid-cols-1 sm:grid-cols-2">
            <Image
              src={MarketDisplay}
              alt="Market Display"
              width={580}
              height={509}
              className="max-w-580px max-sm:mx-auto max-sm:max-w-[380px] w-full"
            />
            <div className="flex flex-col max-sm:text-center sm:max-w-409px ml-auto gap-4">
              <h3 className="md:text-32px text-xl font-bold text-white">
                Stay Ahead of the Market{" "}
              </h3>
              <div className="flex flex-col gap-1">
                <h4 className="md:text-2xl text-base font-semibold text-primary">
                  Real-Time Market Insights
                </h4>
                <p className="md:text-18px text-sm">
                  Get the latest news, price alerts, and analysis to keep you
                  informed and ready to trade
                </p>
              </div>
            </div>
          </div>
          <div className="app-container w-full items-center gap-4 grid grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col max-sm:text-center smmax-w-409px gap-4">
              <h3 className="md:text-32px text-xl font-bold text-white">
                Rewards Await!
              </h3>
              <div className="flex flex-col gap-1">
                <h4 className="md:text-2xl text-base font-semibold text-primary">
                  Earn More with Every Trade
                </h4>
                <p className="md:text-18px text-sm">
                  Join our loyalty program and enjoy exclusive benefits,
                  discounts, and rewards for trading with us.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-15px max-sm:mx-auto max-w-422px md:ml-auto">
              <Image
                src={Bitcoin}
                alt="Bitcoin"
                width={422}
                height={422}
                className="max-w-422px max-sm:mx-auto max-sm:max-w-[380px] w-full"
              />
              <div className="flex self-center items-center gap-6px">
                <span className="md:text-32px text-xl">BTC/USDT</span>
                <IoIosArrowDown size={20} />
              </div>
              <div className="w-full px-10px py-11px flex items-center gap-10px bg-white/[18%] rounded-lg">
                <span className="md:w-35px md:h-35px w-6 h-6 rounded-lg bg-primary" />
                <span className="md:text-base text-sm">One-Click Reward</span>
              </div>
            </div>
          </div>
          <div className="app-container w-full items-center gap-4 grid grid-cols-1 sm:grid-cols-2">
            <Image
              src={Convert}
              alt="Market Display"
              width={376}
              height={531}
              className="max-w-376px  max-sm:mx-auto max-sm:max-w-[300px] w-full"
            />
            <div className="flex flex-col max-sm:text-center sm:max-w-409px sm:ml-auto gap-4">
              <h3 className="md:text-32px text-xl font-bold text-white">
                Fast, Reliable, and User-Friendly
              </h3>
              <div className="flex flex-col gap-1">
                <h4 className="md:text-2xl text-base font-semibold text-primary">
                  Limiance Trading Hub Awaits
                </h4>
                <p className="md:text-18px text-sm">
                  Whether you&apos;re a novice or a seasoned pro, our platform
                  is designed for everyone
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-86px mb-200px w-full max-w-1116px mx-auto flex flex-col gap-38px">
        <h2 className="self-center text-center text-xl md:text-32px font-bold">
          Frequently Asked <span className="text-primary">Questions</span>
        </h2>
        <FAQ />
      </div>
    </main>
  );
}
