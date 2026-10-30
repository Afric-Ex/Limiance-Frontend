import Image from "next/image";
import Wordmark from "@/public/limiance-wordmark.png";
import { HeroSignup } from "./hero-signup";
import { MarketsTable } from "./markets-table";
import { PlatformTabs } from "./platform-tabs";
import { Reveal } from "./reveal";
import { mono, sans } from "./fonts";

const wrap = `${sans.className} mx-auto w-full min-w-0 max-w-[1240px] scroll-mt-20 px-4 py-20 md:py-28`;

function Head({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="max-w-[620px]">
      <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-white md:text-[40px]">{title}</h2>
      {intro && <p className="mt-4 text-[17px] leading-relaxed text-[#A7AEBD]">{intro}</p>}
    </div>
  );
}

export function MarketsSection() {
  return (
    <section id="markets" className={wrap}>
      <Reveal>
        <Head title="Live markets" intro="Prices from the Limiance exchange, refreshed while you watch. Open any pair to start trading." />
        <div className="mt-10"><MarketsTable /></div>
      </Reveal>
    </section>
  );
}

export function PlatformSection() {
  return (
    <section id="platform" className={wrap}>
      <Reveal>
        <Head title="One account, every market" intro="Move from spot to derivatives to peer-to-peer without leaving your account." />
        <div className="mt-10"><PlatformTabs /></div>
      </Reveal>
    </section>
  );
}

const WHY = [
  ["Four markets in one account", "Spot, futures, margin and P2P are available from the same account, so you can change approach without changing platform."],
  ["Naira in, naira out", "Fund by bank transfer or card and withdraw to your bank account. Bank withdrawals require Tier 1 verification."],
  ["Charts you can work on", "Candlestick charts with drawing tools and indicators, next to a live order book and recent trades."],
  ["Order types for control", "Market, limit and stop orders on spot, take profit and stop loss on futures and margin, plus OCO orders on margin."],
  ["Protection you configure", "Two-factor login, a withdrawal address whitelist, session management, login history and API keys are all in your account settings."],
  ["Support inside the account", "Open a support ticket from your account and follow the conversation in one place."],
];

export function WhySection() {
  return (
    <section id="why" className={`${wrap} grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-20`}>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <Head title="Why traders choose Limiance" intro="Specific tools and workflows you can use today, not general promises." />
      </div>
      <ol>
        {WHY.map(([t, d], i) => (
          <li key={t}>
            <Reveal className="grid grid-cols-[44px_1fr] gap-4 border-t border-white/[0.08] py-7">
              <span className={`${mono.className} pt-1 text-sm text-[#4D77F0]`}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-xl font-medium text-white">{t}</h3>
                <p className="mt-2 max-w-[60ch] leading-relaxed text-[#A7AEBD]">{d}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

const SECURITY = [
  ["Identity", "Verification in tiers", "Tier 1 checks your face against a government ID. Tier 2 adds proof of address."],
  ["Sign-in", "Two-factor authentication", "Add a second step when you log in."],
  ["Withdrawals", "Address whitelist", "Save the wallet addresses you trust and manage them from your account."],
  ["Sessions", "Session control", "See where you are signed in and revoke access."],
  ["Activity", "Login history", "Review sign-ins to your account."],
  ["Integrations", "API keys", "Create and delete keys for your own tools."],
];

export function SecuritySection() {
  return (
    <section id="security" className={wrap}>
      <Reveal>
        <Head title="Account protection" intro="The controls that exist in the product today, listed plainly." />
        <dl className="mt-10 border-b border-white/[0.08]">
          {SECURITY.map(([k, t, d]) => (
            <div key={k} className="grid gap-1 border-t border-white/[0.08] py-5 md:grid-cols-[180px_240px_1fr] md:gap-6">
              <dt className={`${mono.className} text-[13px] text-[#8A91A0]`}>{k}</dt>
              <dd className="font-medium text-white">{t}</dd>
              <dd className="text-[#A7AEBD]">{d}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

const FAQ = [
  ["How do I add money?", "Pay by bank transfer to a one-time naira account number, or by card. You can also deposit crypto to your wallet address."],
  ["Do I need to verify my identity?", "Verification comes in tiers. Tier 1 checks your face against a government ID, and bank withdrawals need it. Tier 2 adds proof of address."],
  ["What can I trade?", "Spot, futures and margin, plus P2P and conversions between assets. The live pairs are listed in the app."],
  ["How does P2P work?", "You match an order, chat with the other trader, and release funds with a one-time code. Either side can open a dispute if something goes wrong."],
  ["How do I keep my account safe?", "Turn on two-factor login, whitelist your withdrawal addresses, and review your active sessions and login history."],
  ["Where do I get help?", "Open a support ticket from your account and follow the reply thread there."],
];

export function FaqSection() {
  return (
    <section id="faq" className={`${wrap} max-w-[900px]`}>
      <Head title="Frequently asked questions" />
      <div className="mt-10 border-b border-white/[0.08]">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group border-t border-white/[0.08]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-medium text-white [&::-webkit-details-marker]:hidden">
              {q}
              <span aria-hidden className="text-xl text-[#8A91A0] transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="max-w-[64ch] pb-6 leading-relaxed text-[#A7AEBD]">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ClosingSection() {
  return (
    <section className={`${sans.className} mx-auto w-full min-w-0 max-w-[1240px] px-4 pb-24`}>
      <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#10131A] px-6 py-16 md:px-16">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(77,119,240,0.12),transparent)]" />
        <div className="relative mx-auto flex max-w-[560px] flex-col items-center gap-6 text-center">
          <Image src={Wordmark} alt="Limiance" width={180} height={45} className="h-auto w-[160px]" />
          <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-white md:text-[44px]">Open your Limiance account</h2>
          <p className="text-[17px] text-[#A7AEBD]">Create an account, verify your identity and fund it in naira to start trading.</p>
          <div className="w-full"><HeroSignup /></div>
        </div>
      </div>
    </section>
  );
}