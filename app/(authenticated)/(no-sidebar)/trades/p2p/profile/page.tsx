"use client";

import React from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { useAdvertiserInfo } from "@/src/hooks/p2p/use-p2p";
import { useUserStore } from "@/src/stores/user-store";
import { MdVerified, MdOutlinePersonOutline, MdOutlineHistory, MdOutlineStarOutline, MdOutlineThumbUp, MdOutlineThumbDown } from "react-icons/md";
import { Skeleton } from "@/src/components/shared/skeleton";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PProfileSkeleton } from "@/src/components/skeletons/p2p";

const CARD_CLASS = "rounded-2xl border border-white/[0.06] bg-[#181a20]";

function formatJoined(v: string | number | undefined): string {
  if (!v) return "Recently";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function MyAdvertiserProfilePageInner() {
  const { data: advertiserData, isLoading } = useAdvertiserInfo();
  const { user } = useUserStore();

  if (isLoading) {
    return (
      <P2PLayout>
        <div className="flex justify-center items-center h-64">
          <Skeleton className="w-40 h-6" />
        </div>
      </P2PLayout>
    );
  }

  const advertiser = advertiserData?.data?.data;

  if (!advertiser || !advertiser.id) {
    return (
      <P2PLayout>
        <div className="flex flex-col items-center justify-center py-20 text-white/50 rounded-2xl border border-white/[0.06] bg-[#181a20] max-w-7xl mx-auto mt-2">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl mb-4">
            🚫
          </div>
          <div className="text-lg font-semibold text-white/70">Not an Advertiser</div>
          <div className="text-sm mt-1">You need to become an advertiser to view your profile.</div>
        </div>
      </P2PLayout>
    );
  }

  const name =
    [advertiser.firstName, advertiser.lastName].filter(Boolean).join(" ") ||
    "Merchant";
  const trades = Math.floor(Number(advertiser.totalOrdersCompleted ?? 0));
  const completionRate = Number(advertiser.completionPercentage ?? 0);
  const rating = Number(advertiser.rating ?? 0);
  const revealPhoto = advertiser.photo && advertiser.photo.length > 1;

  // We don't have an endpoint for current user's reviews yet, so we show an empty state
  const feedback = {
    recent: [] as any[],
    positive: 0,
    negative: 0,
  };

  const statCards = [
    {
      label: "Completed Trades",
      value: trades.toLocaleString(),
      icon: <MdOutlineHistory size={18} />,
      accent: "text-primary",
    },
    {
      label: "Completion Rate",
      value: `${completionRate.toFixed(1)}%`,
      icon: <MdVerified size={18} />,
      accent: "text-[#25AB42]",
    },
    {
      label: "Average Rating",
      value: rating > 0 ? `${rating.toFixed(1)}/5` : "N/A",
      icon: <MdOutlineStarOutline size={18} />,
      accent: "text-[#FBA42A]",
    },
    {
      label: "30d Reviews",
      value: String(feedback.recent.length),
      icon: <MdOutlineThumbUp size={18} />,
      accent: "text-[#4d77f0]",
    },
  ];

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl mx-auto py-6 page-enter">
        {/* Page header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <MdOutlinePersonOutline size={22} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
              My Profile
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              View your advertiser stats and feedback
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Identity & Summary */}
          <div className="flex flex-col gap-6 md:col-span-1">
            <div className={`${CARD_CLASS} p-6`}>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white bg-gradient-to-br from-primary to-blue-600 shadow-[0_0_20px_rgba(77,119,240,0.3)] border-2 border-primary/20 overflow-hidden">
                  {revealPhoto ? (
                    <img src={advertiser.photo} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-[var(--color-text-primary)]">{name}</span>
                    {advertiser.verified && (
                      <MdVerified className="text-[#25AB42] text-xl" />
                    )}
                  </div>
                  <div className={`text-sm flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.06] py-1.5 px-3 rounded-full w-fit mx-auto ${
                    advertiser.verified ? "text-[#25AB42]" : "text-white/60"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${advertiser.verified ? "bg-[#25AB42]" : "bg-white/40"}`} />
                    {advertiser.verified ? "Verified Merchant" : "Standard Advertiser"}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Joined</span>
                  <span className="text-white/80 font-medium text-sm">
                    {formatJoined(user?.createdAt ?? user?.accountCreatedAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Status</span>
                  <span className="text-[#25AB42] font-medium text-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25AB42]" /> Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Reviews */}
          <div className="flex flex-col gap-6 md:col-span-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s) => (
                <div
                  key={s.label}
                  className={`${CARD_CLASS} p-5 relative overflow-hidden group hover:border-white/[0.12] transition-colors`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.03] rounded-full blur-2xl group-hover:bg-white/[0.06] transition-colors" />
                  <div className={`flex items-center gap-1.5 mb-3 ${s.accent}`}>
                    {s.icon}
                  </div>
                  <div className="text-3xl font-bold text-[var(--color-text-primary)]">{s.value}</div>
                  <div className="text-xs text-white/40 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className={`${CARD_CLASS} p-6`}>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                Feedback (30d)
              </h3>

              <div className="flex gap-4 mb-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-[#25AB42] bg-[#25AB42]/10 px-4 py-2 rounded-xl">
                  <MdOutlineThumbUp />
                  <span className="font-bold text-lg">{feedback.positive}</span>
                  <span className="text-xs text-[#25AB42]/70 ml-1">Positive</span>
                </div>
                <div className="flex items-center gap-2 text-[#F6465D] bg-[#F6465D]/10 px-4 py-2 rounded-xl">
                  <MdOutlineThumbDown />
                  <span className="font-bold text-lg">{feedback.negative}</span>
                  <span className="text-xs text-[#F6465D]/70 ml-1">Negative</span>
                </div>
              </div>

              {feedback.recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-white/40">
                  <span className="text-3xl mb-3">💬</span>
                  <span className="font-medium">No recent feedback</span>
                  <span className="text-sm mt-1 text-center max-w-xs">
                    When users leave feedback on your trades, it will appear here.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedback.recent.map((_, i) => (
                    <div key={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </P2PLayout>
  );
}

export default function MyAdvertiserProfilePage() {
  return (
    <PageSuspense fallback={<P2PProfileSkeleton />}>
      <MyAdvertiserProfilePageInner />
    </PageSuspense>
  );
}