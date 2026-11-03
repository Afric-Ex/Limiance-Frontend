"use client";

import Link from "next/link";
import { LIM_NAME, LIM_SYMBOL } from "@/src/lib/lim";
import { MdArrowOutward } from "react-icons/md";

export function EarnHeader() {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#181a20] px-6 py-8 max-[1150px]:px-5 max-[1150px]:py-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-8 right-24 h-48 w-48 rounded-full bg-blue-500/8 blur-2xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 items-center rounded-full bg-primary/15 px-2.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              Limiance Earn
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white max-[1150px]:text-2xl">
            Put your{" "}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
              {LIM_SYMBOL}
            </span>{" "}
            to work
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-white/55">
            Hold, stake, and earn with {LIM_NAME}. Your gateway to passive
            income on the Limiance Exchange.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-0.5 sm:items-end">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Earn programs
              </span>
              <span className="text-lg font-bold tabular-nums text-white">7</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col gap-0.5 sm:items-end">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Supported assets
              </span>
              <span className="text-lg font-bold tabular-nums text-white">12+</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col gap-0.5 sm:items-end">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Token
              </span>
              <span className="text-lg font-bold text-white">{LIM_SYMBOL}</span>
            </div>
          </div>
          <Link
            href="/assets/earn/buy"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(77,119,240,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_32px_rgba(77,119,240,0.4)] active:scale-95"
          >
            Buy {LIM_SYMBOL}
            <MdArrowOutward size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}