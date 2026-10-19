"use client";

import type { IconType } from "react-icons";

export interface EarnProductOffering {
  name: string;
  description: string;
  features: readonly string[];
  icon: IconType;
}

/**
 * Placeholder panel for Earn products that are not live yet. Every product tab
 * renders one of these so the page stays honest (no fabricated rates or fake
 * "Stake" flows) while still looking finished and intentional.
 */
export const ComingSoonPanel = ({
  product,
}: {
  product: EarnProductOffering;
}) => {
  const Icon = product.icon;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02] min-h-[280px] flex items-center justify-center p-6 animate-fade-up">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />

      <div className="relative z-10 flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_30px_rgba(77,119,240,0.15)]">
          <Icon size={28} />
        </div>

        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">
          Coming Soon
        </span>

        <h3 className="text-xl font-bold text-white">{product.name}</h3>

        <p className="text-sm leading-relaxed text-white/50">
          {product.description}
        </p>

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {product.features.map((feature) => (
            <span
              key={feature}
              className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/60"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
