"use client";

import Link from "next/link";
import { LIM_NAME, LIM_SYMBOL } from "@/src/lib/lim";
import { MdArrowOutward, MdShowChart } from "react-icons/md";
import { FaArrowRight } from "react-icons/fa6";

export function EarnHeader() {
  return (
    <header className="earn-hero relative isolate overflow-hidden rounded-2xl border border-white/[0.08] bg-surface px-6 py-7 sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] border-l border-white/[0.035] lg:block" />
      <div className="relative z-10 flex flex-col gap-8 lg:min-h-[218px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-2xl flex-col items-start gap-4">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Limiance Earn
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-4xl xl:text-[42px]">
              Grow your <span className="text-primary">{LIM_SYMBOL}</span>
            </h1>
            <p className="max-w-xl text-sm leading-6 text-white/55 sm:text-base">
              Put your digital assets to work with {LIM_NAME}. Explore earning
              products with clear terms, transparent rates and control over
              your holdings.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 pt-1">
            <a
              href="#earn-products"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Explore products <FaArrowRight size={12} />
            </a>
            <Link
              href="/assets"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.025] px-5 text-sm font-semibold text-white/75 transition-colors hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
            >
              View wallet <MdArrowOutward size={15} />
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[130px] min-w-0 items-center justify-between gap-5 overflow-hidden rounded-xl border border-white/[0.08] bg-surface p-5 sm:p-6 lg:min-w-[330px] lg:max-w-[390px]">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/[0.045]" />
          <div className="pointer-events-none absolute -right-5 -top-8 h-32 w-32 rounded-full border border-white/[0.045]" />
          <div className="relative flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Asset management
            </span>
            <span className="text-lg font-semibold text-white">Your assets. Your strategy.</span>
            <span className="text-xs text-white/45">Flexible and fixed-term options</span>
          </div>
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary sm:h-16 sm:w-16">
            <MdShowChart size={30} />
          </div>
        </div>
      </div>
    </header>
  );
}
