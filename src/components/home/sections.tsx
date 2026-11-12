"use client";

import Image from "next/image";
import Wordmark from "@/public/limiance-wordmark.png";
import { useTranslations } from "next-intl";
import { HeroSignup } from "./hero-signup";
import { MarketsTable } from "./markets-table";
import { PlatformTabs } from "./platform-tabs";
import { Reveal } from "./reveal";
import { mono, sans } from "./fonts";

const wrap = `${sans.className} mx-auto w-full min-w-0 max-w-[1240px] scroll-mt-20 px-4 py-20 md:py-28`;

function Head({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="max-w-[620px]">
      <h2 className="text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-white md:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-[#A7AEBD]">{intro}</p>}
    </div>
  );
}

export function MarketsSection() {
  const t = useTranslations("Landing");
  return (
    <section id="markets" className={wrap}>
      <Reveal>
        <Head title={t("marketsTitle")} intro={t("marketsIntro")} />
        <div className="mt-10"><MarketsTable /></div>
      </Reveal>
    </section>
  );
}

export function PlatformSection() {
  const t = useTranslations("Landing");
  return (
    <section id="platform" className={wrap}>
      <Reveal>
        <Head title={t("platformHeading")} intro={t("platformIntro")} />
        <div className="mt-10"><PlatformTabs /></div>
      </Reveal>
    </section>
  );
}

const WHY_KEYS = [1, 2, 3, 4, 5, 6];

export function WhySection() {
  const t = useTranslations("Landing");
  return (
    <section id="why" className={`${wrap} grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20`}>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <Head title={t("whyHeading")} intro={t("whyIntro")} />
      </div>
      <ol>
        {WHY_KEYS.map((n, i) => (
          <li key={n}>
            <Reveal className="grid grid-cols-[44px_1fr] gap-4 border-t border-white/[0.08] py-7">
              <span className={`${mono.className} pt-1 text-sm text-[#4D77F0]`}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-xl font-medium text-white">{t(`why${n}Title` as "why1Title")}</h3>
                <p className="mt-2 max-w-[60ch] leading-relaxed text-[#A7AEBD]">{t(`why${n}Desc` as "why1Desc")}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

const SECURITY_KEYS: [string, string][] = [
  ["Identity", "securityIdentity"],
  ["Sign-in", "securitySignin"],
  ["Withdrawals", "securityWithdrawals"],
  ["Sessions", "securitySessions"],
  ["Activity", "securityActivity"],
  ["Integrations", "securityIntegrations"],
];

export function SecuritySection() {
  const t = useTranslations("Landing");
  return (
    <section id="security" className={wrap}>
      <Reveal>
        <Head title={t("securityHeading")} intro={t("securityIntro")} />
        <dl className="mt-10 border-b border-white/[0.08]">
          {SECURITY_KEYS.map(([k, key]) => (
            <div key={k} className="grid gap-1 border-t border-white/[0.08] py-5 md:grid-cols-[180px_240px_1fr] md:gap-6">
              <dt className={`${mono.className} text-caption text-[#8A91A0]`}>{t(key as "securityIdentity")}</dt>
              <dd className="font-medium text-white">{t(`${key}Title` as "securityIdentityTitle")}</dd>
              <dd className="text-[#A7AEBD]">{t(`${key}Desc` as "securityIdentityDesc")}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

const FAQ_KEYS = [1, 2, 3, 4, 5, 6];

export function FaqSection() {
  const t = useTranslations("Landing");
  return (
    <section id="faq" className={`${wrap} max-w-[900px]`}>
      <Head title={t("faqHeading")} />
      <div className="mt-10 border-b border-white/[0.08]">
        {FAQ_KEYS.map((n) => (
          <details key={n} className="group border-t border-white/[0.08]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium text-white [&::-webkit-details-marker]:hidden">
              {t(`faqQ${n}` as "faqQ1")}
              <span aria-hidden className="text-xl text-[#8A91A0] transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="max-w-[64ch] pb-6 leading-relaxed text-[#A7AEBD]">{t(`faqA${n}` as "faqA1")}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ClosingSection() {
  const t = useTranslations("Landing");
  return (
    <section className={`${sans.className} mx-auto w-full min-w-0 max-w-[1240px] px-4 pb-24`}>
      <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#10131A] px-6 py-16 md:px-16">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(77,119,240,0.12),transparent)]" />
        <div className="relative mx-auto flex max-w-[560px] flex-col items-center gap-6 text-center">
          <Image src={Wordmark} alt="Limiance" width={180} height={45} className="h-auto w-[160px]" />
          <h2 className="text-heading font-semibold leading-[1.1] tracking-[-0.025em] text-white md:text-display">{t("closingHeading")}</h2>
          <p className="text-lg text-[#A7AEBD]">{t("closingSubtitle")}</p>
          <div className="w-full"><HeroSignup /></div>
        </div>
      </div>
    </section>
  );
}
