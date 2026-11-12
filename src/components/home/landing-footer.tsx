import Image from "next/image";
import Link from "next/link";
import Wordmark from "@/public/limiance-wordmark.png";
import { getTranslations } from "next-intl/server";
import { sans } from "./fonts";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "footerPlatform", links: [["footerPlatformMarkets", "#markets"], ["footerPlatformTrade", "#platform"], ["footerWhy", "#why"]] },
  { title: "footerTrust", links: [["footerProtection", "#security"], ["footerQuestions", "#faq"]] },
  { title: "footerAccount", links: [["footerLogIn", "/auth/login"], ["footerCreate", "/auth/signup"]] },
];

export async function LandingFooter() {
  const t = await getTranslations("Landing");
  return (
    <footer className={`${sans.className} border-t border-white/[0.08]`}>
      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)] gap-12 px-4 py-14 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-4">
          <Image src={Wordmark} alt="Limiance Exchange" width={170} height={43} className="h-auto w-[160px]" />
          <p className="max-w-[40ch] text-sm leading-relaxed text-[#8A91A0]">
            {t("footerDescription")}
          </p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={t(c.title as "footerPlatform")}>
            <h3 className="mb-4 text-sm font-medium text-white">{t(c.title as "footerPlatform")}</h3>
            <ul className="flex flex-col gap-3 text-sm text-[#8A91A0]">
              {c.links.map(([label, href]) => (
                <li key={label}>{href.startsWith("#") ? <a href={href} className="transition-colors hover:text-white">{t(label as "footerPlatformMarkets")}</a> : <Link href={href} className="transition-colors hover:text-white">{t(label as "footerPlatformMarkets")}</Link>}</li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-[#8A91A0] md:flex-row md:justify-between">
          <p className="max-w-[78ch]">{t("riskWarning")}</p>
          <p className="shrink-0">{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
