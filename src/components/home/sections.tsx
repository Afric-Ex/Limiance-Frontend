import type { ReactNode } from "react";
import { glass } from "@/src/components/home/glass";
import { display } from "@/src/components/home/fonts";
import { HeroSignup } from "@/src/components/home/hero-signup";

const wrap = "relative mx-auto max-w-[1137px] px-4 py-24 md:py-32";

function H2({ children }: { children: ReactNode }) {
  return (
    <h2
      className={`${display.className} bg-gradient-to-b from-white to-white/55 bg-clip-text text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-transparent md:text-5xl`}
    >
      {children}
    </h2>
  );
}

function Glow({ className }: { className: string }) {
  return <div aria-hidden className={`pointer-events-none absolute -z-10 rounded-full blur-[130px] ${className}`} />;
}

/* ---------- 1. Every way to trade ---------- */

function Card({ span, title, text, children }: { span: string; title: string; text: string; children: ReactNode }) {
  return (
    <div className={`${glass} ${span} group flex min-h-[270px] flex-col justify-between gap-8 overflow-hidden rounded-3xl p-7 transition-colors hover:bg-white/[0.08]`}>
      <div aria-hidden className="flex h-24 items-center">{children}</div>
      <div className="flex flex-col gap-2">
        <h3 className={`${display.className} text-2xl font-semibold text-white`}>{title}</h3>
        <p className="max-w-[46ch] leading-relaxed text-white/65">{text}</p>
      </div>
    </div>
  );
}

// Decorative shapes only. No numbers, so nothing here can be "fake data".
const bars = [72, 55, 86, 40, 64, 30];

export function Modes() {
  return (
    <section className={wrap}>
      <Glow className="-left-40 top-10 h-96 w-96 bg-[#4D77F0]/25" />
      <div className="max-w-2xl">
        <H2>Every way to trade, in one account</H2>
        <p className="mt-5 text-lg text-white/65">
          Start simple. Move into futures and margin when you are ready.
        </p>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-6">
        <Card span="md:col-span-3" title="Spot" text="Buy and sell at the market price, or set your own price with limit and stop orders.">
          <div className="grid w-full grid-cols-2 gap-6">
            {[0, 1].map((side) => (
              <div key={side} className="flex flex-col gap-2">
                {bars.map((w, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full ${side ? "ml-auto bg-[#FF5D73]/55" : "bg-[#3DDC68]/55"}`}
                    style={{ width: `${side ? 100 - w + 20 : w}%` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>
        <Card span="md:col-span-3" title="Futures" text="Pick your leverage per position, set take profit and stop loss, and close all or part of a position.">
          <div className="relative h-2 w-full rounded-full bg-white/10">
            <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-[#4D77F0] to-[#8B5CF6]" />
            <div className="absolute left-2/3 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/20 shadow-[0_0_30px_#4D77F0] backdrop-blur" />
          </div>
        </Card>
        <Card span="md:col-span-2" title="Margin" text="Borrow to trade bigger, repay when you want, and protect positions with stop loss, take profit and OCO orders.">
          <div className="flex flex-wrap gap-2">
            {["Stop loss", "Take profit", "OCO"].map((t) => (
              <span key={t} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">{t}</span>
            ))}
          </div>
        </Card>
        <Card span="md:col-span-2" title="P2P" text="Trade directly with other people. Chat inside the order, release with a one-time code, dispute if something goes wrong.">
          <div className="flex items-center">
            <span className="h-12 w-12 rounded-full bg-gradient-to-br from-[#4D77F0] to-[#06B6D4]" />
            <span className="-ml-3 h-12 w-12 rounded-full border border-white/20 bg-gradient-to-br from-[#8B5CF6] to-[#4D77F0] opacity-90" />
            <span className="ml-4 flex flex-col gap-1.5">
              <span className="h-2 w-24 rounded-full bg-white/25" />
              <span className="h-2 w-16 rounded-full bg-white/15" />
            </span>
          </div>
        </Card>
        <Card span="md:col-span-2" title="Convert" text="Swap one asset for another straight from your wallet.">
          <div className="flex w-full items-center justify-between gap-3">
            <span className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white">BTC</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#4D77F0] text-white shadow-[0_0_24px_#4D77F0]">⇄</span>
            <span className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-semibold text-white">ETH</span>
          </div>
        </Card>
      </div>
    </section>
  );
}

/* ---------- 2. Naira rails ---------- */

const nairaSteps = [
  ["Ask for a deposit account", "We create a one-time account number for your transfer."],
  ["Transfer from your bank app", "Send the amount like any other bank transfer."],
  ["Your balance updates", "Once the transfer settles, it is credited to your wallet."],
];

export function Naira() {
  return (
    <section className={`${wrap} grid items-center gap-14 md:grid-cols-2`}>
      <Glow className="-right-32 top-20 h-96 w-96 bg-[#7C3AED]/25" />
      <div className="flex flex-col gap-5">
        <H2>Fund in naira. Cash out the same way.</H2>
        <p className="max-w-[46ch] text-lg leading-relaxed text-white/65">
          Add money by bank transfer or card, and withdraw to your bank account when you are done. Bank withdrawals need Tier 1 verification.
        </p>
      </div>
      <ol className={`${glass} relative flex flex-col gap-8 rounded-3xl p-8`}>
        <div aria-hidden className="absolute bottom-14 left-[39px] top-14 w-px bg-gradient-to-b from-[#4D77F0] to-transparent" />
        {nairaSteps.map(([t, d], i) => (
          <li key={t} className="relative flex gap-5">
            <span className="z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 bg-[#4D77F0]/80 text-sm font-semibold text-white shadow-[0_0_24px_#4D77F055]">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-white">{t}</p>
              <p className="mt-1 text-white/65">{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- 3. P2P path + security ---------- */

const p2p = ["Match an order", "Chat with the other trader", "Release with a one-time code", "Open a dispute if something is wrong", "Leave a review"];

const security = [
  ["Verification in tiers", "Tier 1 checks your face against a government ID. Tier 2 adds proof of address."],
  ["Two-factor login", "Add a second step to sign in and to authorize withdrawals."],
  ["Withdrawal whitelist", "Save the addresses you trust and send only to those."],
  ["Session control", "See where you are signed in and revoke any session."],
  ["Login history", "Review every sign-in to your account."],
  ["API keys", "Create and delete keys for your own tools."],
];

export function Trust() {
  return (
    <section className={wrap}>
      <Glow className="left-1/3 top-0 h-80 w-[520px] bg-[#06B6D4]/20" />
      <H2>P2P with a clear path from match to release</H2>
      <div className="mt-12 grid gap-3 md:grid-cols-5">
        {p2p.map((s, i) => (
          <div key={s} className={`${glass} relative rounded-2xl p-5`}>
            <span className="text-sm text-[#8FAAFF]">Step {i + 1}</span>
            <p className="mt-2 font-semibold leading-snug text-white">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-28 max-w-2xl">
        <H2>Security settings you control</H2>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {security.map(([t, d]) => (
          <div key={t} className={`${glass} rounded-3xl p-7 transition-colors hover:bg-white/[0.08]`}>
            <h3 className={`${display.className} text-xl font-semibold text-white`}>{t}</h3>
            <p className="mt-3 leading-relaxed text-white/65">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4. FAQ ---------- */

const faq = [
  ["How do I add money?", "Pay by bank transfer to a one-time naira account number, or by card. You can also deposit crypto to your wallet address."],
  ["Do I need to verify my identity?", "Verification comes in tiers. Tier 1 checks your face against a government ID, and bank withdrawals need it. Tier 2 adds proof of address."],
  ["What can I trade?", "Spot, futures and margin, plus P2P and conversions between assets. The live pairs are listed in the app."],
  ["How does P2P work?", "You match an order, chat with the other trader, and release the funds with a one-time code. If something goes wrong, either side can open a dispute."],
  ["How do I keep my account safe?", "Turn on two-factor login, whitelist your withdrawal addresses, and review your active sessions and login history."],
  ["Where do I get help?", "Open a support ticket from your account and follow the reply thread there."],
];

export function Faq() {
  return (
    <section className={`${wrap} max-w-[860px]`}>
      <H2>Questions, answered</H2>
      <div className="mt-12 flex flex-col gap-3">
        {faq.map(([q, a]) => (
          <details key={q} className={`${glass} group rounded-2xl px-6 py-5`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold text-white [&::-webkit-details-marker]:hidden">
              {q}
              <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-white/70 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-4 max-w-[62ch] leading-relaxed text-white/65">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---------- 5. Closing call to action ---------- */

export function Cta() {
  return (
    <section className="relative mx-auto max-w-[1137px] px-4 pb-32">
      <div className={`${glass} relative overflow-hidden rounded-[32px] px-6 py-16 text-center md:px-16`}>
        <div aria-hidden className="absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#4D77F0]/40 blur-[100px]" />
        <div className="relative flex flex-col items-center gap-8">
          <h2 className={`${display.className} max-w-[16ch] bg-gradient-to-b from-white to-white/55 bg-clip-text text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-transparent md:text-6xl`}>
            Start trading on Limiance
          </h2>
          <div className="w-full max-w-[520px] rounded-2xl border border-white/10 bg-black/30 p-2">
            <HeroSignup />
          </div>
        </div>
      </div>
    </section>
  );
}