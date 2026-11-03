"use client";

import React from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { useAdvertiserInfo, useAdvertiserReviews } from "@/src/hooks/p2p/use-p2p";
import { useUserStore } from "@/src/stores/user-store";
import {
  MdVerified,
  MdOutlinePersonOutline,
  MdOutlineHistory,
  MdOutlineStarOutline,
  MdOutlineThumbUp,
  MdOutlineThumbDown,
  MdOutlineChatBubbleOutline,
  MdPersonOff,
} from "react-icons/md";
import { Skeleton } from "@/src/components/shared/skeleton";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PProfileSkeleton } from "@/src/components/skeletons/p2p";
import type { P2PAdvertiserReview } from "@/src/types/p2p";

const CARD_CLASS = "rounded-xl border border-white/[0.07] bg-[#181a20]";

function formatJoined(v: string | number | undefined): string {
  if (!v) return "Recently";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatReviewDate(v: string | number | undefined): string {
  if (!v) return "";
  const d = new Date(typeof v === "number" && v > 1e10 ? v : Number(v));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ReviewCard({ review }: { review: P2PAdvertiserReview }) {
  const isPositive = review.rating === "POSITIVE";
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {(review.reviewerName ?? "?").charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-white/80">
            {review.reviewerName ?? "Anonymous"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isPositive
                ? "bg-buy/10 text-buy border border-buy/20"
                : "bg-[#F6465D]/10 text-[#F6465D] border border-[#F6465D]/20"
            }`}
          >
            {isPositive ? (
              <MdOutlineThumbUp size={10} />
            ) : (
              <MdOutlineThumbDown size={10} />
            )}
            {isPositive ? "Positive" : "Negative"}
          </span>
          <span className="text-[10px] text-white/30">
            {formatReviewDate(review.createdAt)}
          </span>
        </div>
      </div>
      {review.review && (
        <p className="text-xs leading-relaxed text-white/55 pl-9">{review.review}</p>
      )}
      {Array.isArray(review.tags) && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-9">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MyAdvertiserProfilePageInner() {
  const { data: advertiserData, isLoading } = useAdvertiserInfo();
  const { user } = useUserStore();

  const advertiser = advertiserData?.data?.data;

  // Fetch reviews using the advertiser's own ID
  const { data: reviewsData, isLoading: reviewsLoading } = useAdvertiserReviews(
    advertiser?.id ?? null,
    1,
    20
  );

  if (isLoading) {
    return (
      <P2PLayout>
        <div className="flex justify-center items-center h-64">
          <Skeleton className="w-40 h-6" />
        </div>
      </P2PLayout>
    );
  }

  if (!advertiser || !advertiser.id) {
    return (
      <P2PLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-white/50 rounded-xl border border-white/[0.07] bg-[#181a20] max-w-7xl mx-auto mt-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 mb-3">
            <MdPersonOff size={22} />
          </div>
          <div className="text-sm font-semibold text-white/70">Not a Registered Advertiser</div>
          <div className="text-xs text-white/40 mt-1 max-w-sm">
            You need to complete advertiser verification to access advertiser metrics and public profile settings.
          </div>
        </div>
      </P2PLayout>
    );
  }

  const name = [advertiser.firstName, advertiser.lastName].filter(Boolean).join(" ") || "Merchant";
  const trades = Math.floor(Number(advertiser.totalOrdersCompleted ?? 0));
  const completionRate = Number(advertiser.completionPercentage ?? 0);
  const revealPhoto = advertiser.photo && advertiser.photo.length > 1;

  // Use live review data from the API
  const reviewsPayload = reviewsData?.data as any;
  const reviews: P2PAdvertiserReview[] = reviewsPayload?.reviews ?? [];
  const positiveCount = reviewsPayload?.positiveCount ?? 0;
  const negativeCount = reviewsPayload?.negativeCount ?? 0;
  const averageRating = reviewsPayload?.averageRating ?? Number(advertiser.rating ?? 0);
  const totalRecords = reviewsPayload?.totalRecords ?? 0;

  const statCards = [
    {
      label: "Completed Trades",
      value: trades.toLocaleString(),
      icon: <MdOutlineHistory size={16} />,
      accent: "text-primary",
    },
    {
      label: "Completion Rate",
      value: `${completionRate.toFixed(1)}%`,
      icon: <MdVerified size={16} />,
      accent: "text-buy",
    },
    {
      label: "Average Rating",
      value: averageRating > 0 ? `${Number(averageRating).toFixed(1)} / 5.0` : "N/A",
      icon: <MdOutlineStarOutline size={16} />,
      accent: "text-[#FBA42A]",
    },
    {
      label: "30d Reviews",
      value: String(totalRecords),
      icon: <MdOutlineThumbUp size={16} />,
      accent: "text-[#4d77f0]",
    },
  ];

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl mx-auto py-6 max-[1150px]:py-4 page-enter">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <MdOutlinePersonOutline size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Advertiser Profile</h1>
            <p className="text-xs text-white/45">View your merchant statistics, completion metrics, and user feedback</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Left Column: Identity & Summary */}
          <div className="flex flex-col gap-5 md:col-span-1">
            <div className={`${CARD_CLASS} p-5`}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white bg-primary/10 border border-primary/20 overflow-hidden">
                  {revealPhoto ? (
                    <img src={advertiser.photo} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-base font-semibold text-white">{name}</span>
                    {advertiser.verified && <MdVerified className="text-buy text-base" />}
                  </div>
                  <div
                    className={`text-xs flex items-center justify-center gap-1.5 bg-white/[0.04] border border-white/[0.07] py-1 px-2.5 rounded-md w-fit mx-auto ${
                      advertiser.verified ? "text-buy" : "text-white/60"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${advertiser.verified ? "bg-buy" : "bg-white/40"}`}
                    />
                    {advertiser.verified ? "Verified Merchant" : "Standard Advertiser"}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-col divide-y divide-white/[0.05] text-xs">
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/40">Member Since</span>
                  <span className="text-white/80 font-medium">
                    {formatJoined(user?.createdAt ?? user?.accountCreatedAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/40">Status</span>
                  <span className="text-buy font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-buy" /> Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Reviews */}
          <div className="flex flex-col gap-5 md:col-span-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {statCards.map((s) => (
                <div key={s.label} className={`${CARD_CLASS} p-4 transition-colors hover:border-white/[0.12]`}>
                  <div className={`flex items-center gap-1 mb-2 ${s.accent}`}>{s.icon}</div>
                  <div className="text-xl font-bold text-white font-mono tabular-nums">{s.value}</div>
                  <div className="text-micro text-white/40 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className={`${CARD_CLASS} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Feedback (30d)</h3>
                {totalRecords > 0 && (
                  <span className="text-xs text-white/35">{totalRecords} total</span>
                )}
              </div>

              <div className="flex gap-3 mb-4 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-buy bg-buy/[0.08] border border-buy/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
                  <MdOutlineThumbUp size={14} />
                  <span>{positiveCount} Positive</span>
                </div>
                <div className="flex items-center gap-2 text-[#F6465D] bg-[#F6465D]/[0.08] border border-[#F6465D]/20 px-3 py-1.5 rounded-lg text-xs font-semibold">
                  <MdOutlineThumbDown size={14} />
                  <span>{negativeCount} Negative</span>
                </div>
              </div>

              {/* Reviews list */}
              {reviewsLoading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-7 h-7 rounded-full" />
                        <Skeleton className="w-28 h-3 rounded" />
                      </div>
                      <Skeleton className="w-full h-3 rounded ml-9" />
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-white/40 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 mb-2.5">
                    <MdOutlineChatBubbleOutline size={18} />
                  </div>
                  <span className="font-medium text-xs text-white/60">No recent feedback</span>
                  <span className="text-micro text-white/35 mt-0.5 max-w-xs">
                    Feedback ratings left by your trading counterparties will appear here.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
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