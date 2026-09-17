"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { earnKeys, earnService } from "@/src/services/earn";
import { MOCK_MODE } from "@/src/mocks";
import { mockEarn } from "@/src/mocks/mock-earn";
import { SubscribeModal } from "@/src/components/earn/subscribe-modal";
import { Skeleton } from "@/src/components/shared/skeleton";
import { successNotification } from "@/src/lib/notification-handler";
import { useState } from "react";
import clsx from "clsx";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AssetsEarnSkeleton } from "@/src/components/skeletons/assets";

const PRODUCT_TABS = [
  "Simple Earn",
  "Staking",
  "Launchpad",
  "Pool Savings",
  "Dual Investment",
  "Auto Invest",
  "Smart Trend",
];

function EarnInner() {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<"products" | "positions">("products");
  const [productTab, setProductTab] = useState(PRODUCT_TABS[0]);

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: earnKeys.products,
    queryFn: () =>
      MOCK_MODE.earnInfo ? mockEarn.fetchProducts() : earnService.fetchProducts(),
    select: (res: any) => res.data,
    throwOnError: false,
    retry: false,
  });

  const { data: positions, isLoading: isLoadingPositions } = useQuery({
    queryKey: earnKeys.myPositions,
    queryFn: () =>
      MOCK_MODE.earnInfo ? mockEarn.myPositions() : earnService.myPositions(),
    select: (res: any) => res.data,
    throwOnError: false,
    retry: false,
  });

  const { mutate: unstake, isPending: unstakePending } = useMutation({
    mutationFn: (id: string) =>
      MOCK_MODE.earnInfo
        ? mockEarn.unstake({ subscriptionId: id })
        : earnService.unstake({ subscriptionId: id }),
    onSuccess: () => {
      successNotification("Position successfully unstaked!");
      queryClient.invalidateQueries({ queryKey: earnKeys.myPositions });
    },
  });

  const openSubscribeModal = (product: any) => {
    modals.open({
      title: `Stake ${product.asset}`,
      children: <SubscribeModal product={product} />,
      centered: true,
      size: "lg",
      classNames: {
        content: "!bg-[#181a20] !border !border-white/[0.06] !rounded-2xl",
        header: "!bg-transparent !p-6 !pb-4",
        title: "!text-lg !font-bold !text-white",
        close: "!text-white/50 hover:!text-white hover:!bg-white/[0.05]",
        body: "!p-6 !pt-0",
      },
    });
  };

  const totalStaked =
    positions?.reduce((a: number, p: any) => a + Number(p.amount || 0), 0) || 0;
  const totalEarned =
    positions?.reduce((a: number, p: any) => a + Number(p.earned || 0), 0) || 0;
  const activePositions = positions?.length || 0;
  const bestApy =
    products?.reduce(
      (best: number, p: any) => Math.max(best, Number(p.apy || 0)),
      0
    ) || 0;

  return (
    <main className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 pb-24 w-full min-h-[80vh] overflow-y-auto">

      {/* ── Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.05] bg-gradient-to-br from-surface via-elevated to-black">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* Left copy */}
            <div className="flex flex-col gap-3 max-w-lg">
              <span className="text-xs font-bold uppercase tracking-widest text-primary/70">
                Limiance Earn
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Make your crypto{" "}
                <span className="text-primary">work for you</span>
              </h1>
              <p className="text-sm text-white/50 leading-relaxed">
                Lock idle assets into flexible or fixed-term staking products
                and earn industry-leading APY rewards — safely and
                transparently.
              </p>
            </div>

            {/* Stats chips */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:shrink-0">
              {[
                {
                  label: "Total Staked",
                  value: `$${totalStaked.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  sub: "USDT",
                  color: "text-white",
                },
                {
                  label: "Total Earned",
                  value: `+$${totalEarned.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  sub: "USDT",
                  color: "text-emerald-400",
                },
                {
                  label: "Active Positions",
                  value: String(activePositions),
                  sub: "positions",
                  color: "text-white",
                },
                {
                  label: "Best APY",
                  value: `${bestApy.toFixed(2)}%`,
                  sub: "annualized",
                  color: "text-primary",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 bg-white/[0.04] border border-white/[0.05] rounded-xl p-4"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    {stat.label}
                  </span>
                  <span
                    className={`text-lg font-mono font-bold leading-none ${stat.color}`}
                  >
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-white/30">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Tab Toggle ── */}
      <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.05] rounded-xl p-1 w-fit">
        {(["products", "positions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={clsx(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
              mainTab === tab
                ? "bg-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                : "text-white/50 hover:text-white/80"
            )}
          >
            {tab === "positions" ? (
              <span className="flex items-center gap-2">
                My Positions
                <span className="bg-white/10 text-white/60 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {activePositions}
                </span>
              </span>
            ) : (
              "All Products"
            )}
          </button>
        ))}
      </div>

      {/* ── Products Tab ── */}
      {mainTab === "products" && (
        <div className="flex flex-col gap-4 animate-fade-up">
          {/* Product type sub-tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {PRODUCT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setProductTab(tab)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border",
                  productTab === tab
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-transparent border-white/[0.06] text-white/40 hover:text-white/70 hover:border-white/15"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-4 pl-6 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Asset
                    </th>
                    <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Est. APY
                    </th>
                    <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Duration
                    </th>
                    <th className="text-right py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Min. Amount
                    </th>
                    <th className="text-right py-4 pr-6 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingProducts ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-white/[0.04]">
                        <td className="py-4 pl-6">
                          <Skeleton variant="text" width="140px" height="32px" />
                        </td>
                        <td className="py-4">
                          <Skeleton
                            variant="text"
                            width="60px"
                            height="24px"
                            className="ml-auto"
                          />
                        </td>
                        <td className="py-4">
                          <Skeleton
                            variant="text"
                            width="80px"
                            height="24px"
                            className="ml-auto"
                          />
                        </td>
                        <td className="py-4">
                          <Skeleton
                            variant="text"
                            width="70px"
                            height="24px"
                            className="ml-auto"
                          />
                        </td>
                        <td className="py-4 pr-6">
                          <Skeleton
                            variant="rect"
                            width="96px"
                            height="36px"
                            className="ml-auto rounded-lg"
                          />
                        </td>
                      </tr>
                    ))
                  ) : !products?.length ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/20">
                          <svg
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.2}
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          <span className="text-sm font-medium">
                            No products available yet
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((prod: any) => (
                      <tr
                        key={prod.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="py-4 pl-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.asset}
                              className="w-9 h-9 rounded-full shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">
                                {prod.asset}
                              </span>
                              <span className="text-[10px] text-white/40">
                                {prod.type === "fixed"
                                  ? `Fixed · ${prod.lockDays} days`
                                  : "Flexible"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-base font-mono font-bold text-emerald-400">
                            {Number(prod.apy).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={clsx(
                              "text-xs font-bold px-3 py-1 rounded-lg",
                              prod.type === "fixed"
                                ? "bg-amber-400/10 text-amber-400"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {prod.type === "fixed"
                              ? `${prod.lockDays}D Lock`
                              : "Flexible"}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-sm font-mono text-white/50">
                            {prod.minAmount} {prod.asset}
                          </span>
                        </td>
                        <td className="py-4 pr-6 text-right">
                          <button
                            onClick={() => openSubscribeModal(prod)}
                            className="text-xs font-bold py-2 px-5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 group-hover:border-primary/50"
                          >
                            Stake Now
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Positions Tab ── */}
      {mainTab === "positions" && (
        <div className="animate-fade-up">
          {isLoadingPositions ? (
            <div className="flex justify-center py-20">
              <Loader color="gray" size="md" />
            </div>
          ) : !positions?.length ? (
            <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.2}
                  className="text-white/30"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold text-white/50">
                  No active positions
                </span>
                <span className="text-xs text-white/30">
                  Start staking to earn rewards
                </span>
              </div>
              <button
                onClick={() => setMainTab("products")}
                className="mt-2 text-sm font-bold px-6 py-2.5 rounded-xl bg-primary text-white hover:brightness-110 transition-all active:scale-95"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {positions.map((pos: any) => (
                <div
                  key={pos.id}
                  className="relative rounded-2xl border border-white/[0.06] bg-[#181a20] p-5 flex flex-col gap-4 hover:border-white/[0.12] transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <img
                        src={pos.image}
                        alt={pos.asset}
                        className="w-10 h-10 rounded-full shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          {pos.asset} Earn
                        </span>
                        <span
                          className={clsx(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit mt-0.5",
                            pos.type === "fixed"
                              ? "bg-amber-400/10 text-amber-400"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {pos.type === "fixed" ? "Locked" : "Flexible"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg">
                      +{Number(pos.apy).toFixed(2)}% APY
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] relative z-10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        Principal
                      </span>
                      <span className="text-sm font-mono font-bold text-white">
                        {pos.amount}{" "}
                        <span className="text-xs text-white/40">{pos.asset}</span>
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        Earned
                      </span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        +{pos.earned}{" "}
                        <span className="text-xs text-emerald-400/50">
                          {pos.asset}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/30 uppercase tracking-wider">
                        {pos.type === "fixed" ? "Unlocks" : "Status"}
                      </span>
                      {pos.type === "fixed" ? (
                        <span className="text-xs font-mono font-medium text-white/60">
                          {new Date(pos.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-primary">
                          Redeemable anytime
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => unstake(pos.id)}
                      disabled={unstakePending}
                      className="text-xs font-bold py-2 px-4 rounded-lg bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 active:scale-95 border border-white/[0.06] flex items-center gap-2"
                    >
                      {unstakePending && <Loader size="xs" color="white" />}
                      Redeem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function Earn() {
  return (
    <PageSuspense fallback={<AssetsEarnSkeleton />}>
      <EarnInner />
    </PageSuspense>
  );
}
