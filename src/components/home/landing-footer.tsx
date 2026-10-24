import Image from "next/image";
import Link from "next/link";
import Wordmark from "@/public/limiance-wordmark.png";
import { sans } from "./fonts";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Platform", links: [["Markets", "#markets"], ["Spot, futures, margin, P2P", "#platform"], ["Why Limiance", "#why"]] },
  { title: "Trust", links: [["Account protection", "#security"], ["Questions", "#faq"]] },
  { title: "Account", links: [["Log in", "/auth/login"], ["Create account", "/auth/signup"]] },
];

export function LandingFooter() {
  return (
    <footer className={`${sans.className} border-t border-white/[0.08]`}>
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 py-14 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-4">
          <Image src={Wordmark} alt="Limiance Exchange" width={170} height={43} className="h-auto w-[160px]" />
          <p className="max-w-[40ch] text-sm leading-relaxed text-[#8A91A0]">
            Limiance Exchange is a cryptocurrency exchange offering spot, futures, margin and P2P markets, with naira deposits and withdrawals.
          </p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h3 className="mb-4 text-sm font-medium text-white">{c.title}</h3>
            <ul className="flex flex-col gap-3 text-sm text-[#8A91A0]">
              {c.links.map(([label, href]) => (
                <li key={label}>{href.startsWith("#") ? <a href={href} className="transition-colors hover:text-white">{label}</a> : <Link href={href} className="transition-colors hover:text-white">{label}</Link>}</li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-[#8A91A0] md:flex-row md:justify-between">
          <p className="max-w-[78ch]">Risk warning: digital assets are volatile and trading them involves risk, including the loss of your capital. Only trade with funds you can afford to lose.</p>
          <p className="shrink-0">&copy; {new Date().getFullYear()} Limiance Exchange</p>
        </div>
      </div>
    </footer>
  );
}