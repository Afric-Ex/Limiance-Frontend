"use client";

import { EARN_PRODUCTS, type EarnProduct } from "./earn-products";

const FEATURED_PRODUCTS = ["Simple Earn", "Staking", "Launchpad"] as const;

/**
 * Featured earn programs as active teaser cards. Each "Learn more" jumps to
 * the matching tab in the Earn products section below — no fabricated rates,
 * just the honest upcoming state with a subtle coming-soon badge.
 */
export function WaysToEarn({
  onLearnMore,
}: {
  onLearnMore?: (name: string) => void;
}) {
  const featured = FEATURED_PRODUCTS.map((name) =>
    EARN_PRODUCTS.find((product) => product.name === name)
  ).filter((product): product is EarnProduct => !!product);

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-primary)]">
          Ways to earn
        </h2>
        <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          Featured programs launching on Limiance Earn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {featured.map((product) => {
          const Icon = product.icon;

          return (
            <article
              key={product.name}
              className="group flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>
                <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Coming soon
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {product.name}
                </h3>
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {product.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onLearnMore?.(product.name)}
                className="mt-auto inline-flex w-fit items-center gap-1 rounded-sm text-xs font-semibold text-primary transition-colors hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                Learn more <span aria-hidden="true">→</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
