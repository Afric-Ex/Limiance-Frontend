"use client";

import { PageSuspense } from "@/src/components/shared/page-suspense";
import { EarnLimSkeleton } from "@/src/components/skeletons/with-sidebar";
import { EarnHeader } from "@/src/components/earn/earn-header";
import { RewardNotificationBanner } from "@/src/components/earn/reward-notification-banner";
import { LimBalanceCard } from "@/src/components/earn/lim-balance-card";
import { MyRewards } from "@/src/components/earn/my-rewards";
import { EarnTab } from "@/src/components/assets/earn-tab";
import { Launchpad } from "@/src/components/earn/launchpad";
import { ScreenShare } from "@/src/components/snapshot/screen-share";

/**
 * Limiance Earn dashboard.
 *
 * The page now has one clear hierarchy:
 * 1. Earn overview / primary action
 * 2. Live LIM wallet balance
 * 3. Reward totals and recent activity
 * 4. Product catalogue and positions
 * 5. Launchpad (upcoming features)
 *
 * The previous token-utility cards, featured-program cards and static
 * product-preview tabs repeated the same destinations and product names.
 * Those duplicate presentation layers are intentionally removed; the
 * existing live EarnTab remains the single source for product navigation
 * and backend-powered earn actions.
 */
function EarnInner() {
  return (
    <main className="earn-dashboard page-enter mx-auto flex w-full max-w-[1600px] flex-col gap-5 pb-8">
      <ScreenShare titleKey="earn" filenameParts={["earn"]} contentClassName="flex flex-col gap-5">
      <EarnHeader />

      <RewardNotificationBanner />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <LimBalanceCard />
        <div className="earn-overview-note flex min-h-full flex-col justify-between gap-5 rounded-2xl border border-white/[0.07] bg-[#181a20] p-6 max-[1150px]:p-5">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Earn with confidence
            </span>
            <h2 className="max-w-lg text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl">
              Choose a strategy that fits the way you manage your assets.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-white/50">
              Explore flexible products, fixed-term staking and upcoming
              investment programmes from one place.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                Product types
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">07</p>
            </div>
            <div className="min-w-0 border-l border-white/[0.07] pl-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                Flexible
              </p>
              <p className="mt-1 text-lg font-bold text-white">Anytime</p>
            </div>
            <div className="min-w-0 border-l border-white/[0.07] pl-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                Fixed terms
              </p>
              <p className="mt-1 text-lg font-bold text-white">Available</p>
            </div>
          </div>
        </div>
      </section>

      <MyRewards />

      <EarnTab />

      <Launchpad />
      </ScreenShare>
    </main>
  );
}

export default function Earn() {
  return (
    <PageSuspense fallback={<EarnLimSkeleton />}>
      <EarnInner />
    </PageSuspense>
  );
}
