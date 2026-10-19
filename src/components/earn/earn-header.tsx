"use client";

import { LIM_NAME, LIM_SYMBOL } from "@/src/lib/lim";

export function EarnHeader() {
  return (
    <header className="flex flex-col gap-1.5">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Earn {LIM_SYMBOL}
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Buy, hold, and put {LIM_NAME} ({LIM_SYMBOL}) to work.
      </p>
    </header>
  );
}
