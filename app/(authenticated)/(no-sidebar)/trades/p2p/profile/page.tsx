"use client";

import React from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { useAdvertiserInfo } from "@/src/hooks/p2p/use-p2p";
import { MdVerified } from "react-icons/md";
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { Loader } from "@mantine/core";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PProfileSkeleton } from "@/src/components/skeletons/p2p";

function MyAdvertiserProfilePageInner() {
  const { data: advertiserData, isLoading } = useAdvertiserInfo();

  if (isLoading) {
    return (
      <P2PLayout>
        <div className="flex justify-center items-center h-64">
          <Loader color="blue" />
        </div>
      </P2PLayout>
    );
  }

  const advertiser = advertiserData?.data?.data;

  if (!advertiser || !advertiser.id) {
    return (
      <P2PLayout>
        <div className="flex flex-col items-center justify-center py-20 text-white/50 bg-white/[0.02] border border-white/5 rounded-xl max-w-5xl mx-auto mt-6">
          <div className="text-5xl mb-4">🚫</div>
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

  // We don't have an endpoint for current user's reviews yet, so we show an empty state or coming soon
  const feedback = {
    recent: [],
    positive: 0,
    negative: 0,
  };

  return (
    <P2PLayout>
      <div className="w-full max-w-5xl mx-auto py-6 px-4 md:px-0">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-white/40 text-sm mt-1">View your advertiser stats and feedback</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Identity & Summary */}
          <div className="flex flex-col gap-6 md:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white bg-gradient-to-br from-primary to-blue-600 shadow-[0_0_20px_rgba(77,119,240,0.3)] border-2 border-primary/20">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl font-bold">{name}</span>
                    {advertiser.verified && (
                      <MdVerified className="text-buy text-xl" />
                    )}
                  </div>
                  <div className="text-sm text-white/50 flex items-center justify-center gap-2 bg-black/20 py-1.5 px-3 rounded-full w-fit mx-auto">
                    {advertiser.verified ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-buy shadow-[0_0_8px_#0ECB81]" />
                        <span className="text-buy font-medium">Verified Merchant</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white/40" />
                        <span className="text-white/60">Standard Advertiser</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Joined</span>
                  <span className="text-white font-medium text-sm">
                    {/* Fallback if joined date isn't available */}
                    Recently
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">Status</span>
                  <span className="text-buy font-medium text-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-buy" /> Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Reviews */}
          <div className="flex flex-col gap-6 md:col-span-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:bg-white/[0.07] transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                <div className="text-white/50 text-sm mb-2 font-medium">Completed Trades</div>
                <div className="text-3xl font-bold text-white">{trades}</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:bg-white/[0.07] transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-buy/10 rounded-full blur-2xl group-hover:bg-buy/20 transition-colors" />
                <div className="text-white/50 text-sm mb-2 font-medium">Completion Rate</div>
                <div className="text-3xl font-bold text-buy">
                  {completionRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:bg-white/[0.07] transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-colors" />
                <div className="text-white/50 text-sm mb-2 font-medium">Average Rating</div>
                <div className="text-3xl font-bold text-white">
                  {rating > 0 ? `${rating.toFixed(1)}/5` : "N/A"}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:bg-white/[0.07] transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
                <div className="text-white/50 text-sm mb-2 font-medium">30d Reviews</div>
                <div className="text-3xl font-bold text-white">
                  {feedback.recent.length}
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                Feedback (30d)
              </h3>
              
              <div className="flex gap-6 mb-6 pb-6 border-b border-white/5">
                <div className="flex items-center gap-2 text-buy bg-buy/10 px-4 py-2 rounded-xl">
                  <FaThumbsUp />
                  <span className="font-bold text-lg">{feedback.positive}</span>
                  <span className="text-xs text-buy/70 ml-1">Positive</span>
                </div>
                <div className="flex items-center gap-2 text-[#F6465D] bg-[#F6465D]/10 px-4 py-2 rounded-xl">
                  <FaThumbsDown />
                  <span className="font-bold text-lg">{feedback.negative}</span>
                  <span className="text-xs text-[#F6465D]/70 ml-1">Negative</span>
                </div>
              </div>

              {feedback.recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-white/40">
                  <span className="text-3xl mb-3">💬</span>
                  <span className="font-medium">No recent feedback</span>
                  <span className="text-sm mt-1 text-center max-w-xs">When users leave feedback on your trades, it will appear here.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Map through feedback.recent when available */}
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
