"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Wordmark from "@/public/limiance-wordmark.png";
import { useUserStore } from "@/src/stores/user-store";
import { sans } from "./fonts";

const LINKS = [
  ["markets", "Markets"], ["platform", "Platform"], ["why", "Why Limiance"], ["security", "Security"], ["faq", "FAQ"],
] as const;

const goTo = (id: string) => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
};

export function LandingNav() {
  const user = useUserStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);

  // The page scrolls inside AppContainer (not window), so observe instead of listening to scroll.
  useEffect(() => {
    const top = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    if (sentinel.current) top.observe(sentinel.current);
    const sections = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach(([id]) => { const el = document.getElementById(id); if (el) sections.observe(el); });
    return () => { top.disconnect(); sections.disconnect(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      <div ref={sentinel} aria-hidden className="absolute left-0 top-0 h-px w-px" />
      <header className={`${sans.className} sticky top-0 z-50 border-b transition-colors ${scrolled || open ? "border-white/[0.08] bg-[#0B0D12]/90 backdrop-blur-xl" : "border-transparent bg-transparent"}`}>
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-6 px-4">
          <Link href="/" aria-label="Limiance home" className="shrink-0">
            <Image src={Wordmark} alt="Limiance" priority width={168} height={42} className="h-auto w-[140px] sm:w-[168px]" />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {LINKS.map(([id, label]) => (
              <button
                key={id} onClick={() => goTo(id)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${active === id ? "text-white" : "text-[#A7AEBD] hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="rounded-md bg-[#4168DD] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4D77F0]">Dashboard</Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden rounded-md px-3 py-2 text-sm text-[#E6E8EE] transition-colors hover:bg-white/5 sm:block">Log in</Link>
                <Link href="/auth/signup" className="rounded-md bg-[#4168DD] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4D77F0]">Sign up</Link>
              </>
            )}
            <button
              aria-label="Menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}
              className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-white lg:hidden"
            >
              <span className="relative block h-3 w-4">
                <span className={`absolute left-0 h-px w-4 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 top-1.5 h-px w-4 bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
                <span className={`absolute left-0 h-px w-4 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
              </span>
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-menu" aria-label="Mobile" className="border-t border-white/[0.08] px-4 pb-4 lg:hidden">
            {LINKS.map(([id, label]) => (
              <button key={id} onClick={() => { setOpen(false); goTo(id); }} className="block w-full border-b border-white/[0.06] py-3.5 text-left text-[15px] text-[#E6E8EE]">{label}</button>
            ))}
            {!user && <Link href="/auth/login" className="block py-3.5 text-[15px] text-[#E6E8EE]">Log in</Link>}
          </nav>
        )}
      </header>
    </>
  );
}