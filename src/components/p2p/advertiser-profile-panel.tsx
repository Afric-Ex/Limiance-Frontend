"use client";

import React, { useState } from "react";
import { Button, Drawer } from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import { MdVerified } from "react-icons/md";
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import toast from "react-hot-toast";
import { P2POrderListings } from "@/src/types/p2p";
import {
  blockAdvertiser,
  getAdvertiserReviews,
  isAdvertiserBlocked,
  reportAdvertiser,
  unblockAdvertiser,
} from "@/src/lib/p2p-user-actions";
import { BlockUserModal } from "./block-user-modal";
import { ReportUserModal } from "./report-user-modal";

type Advertiser = P2POrderListings["data"][number]["advertiser"];

interface AdvertiserProfilePanelProps {
  advertiser: Advertiser | null;
  onClose: () => void;
  onRelationshipChange?: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const AdvertiserProfilePanel = ({
  advertiser,
  onClose,
  onRelationshipChange,
}: AdvertiserProfilePanelProps) => {
  const isOpen = !!advertiser;
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!isOpen || !advertiser) {
    return null;
  }

  const name =
    [advertiser.firstName, advertiser.lastName].filter(Boolean).join(" ") || "Merchant";
  const trades = Math.floor(Number(advertiser.totalOrdersCompleted ?? 0));
  const completionRate = Number(advertiser.completionPercentage ?? 0);
  const rating = Number(advertiser.rating ?? 0);
  const blocked = isAdvertiserBlocked(advertiser.id);

  const allReviews = getAdvertiserReviews(advertiser.id);
  const threshold = Date.now() - THIRTY_DAYS_MS;
  const recentReviews = allReviews.filter(
    (review) => new Date(review.createdAt).getTime() >= threshold
  );
  const feedback = {
    all: allReviews,
    recent: recentReviews,
    positive: recentReviews.filter((review) => review.rating === "POSITIVE").length,
    negative: recentReviews.filter((review) => review.rating === "NEGATIVE").length,
  };

  const handleBlockToggle = (reason: string) => {
    if (blocked) {
      unblockAdvertiser(advertiser.id);
      toast.success(`${name} has been unblocked`);
    } else {
      blockAdvertiser({
        id: advertiser.id,
        name,
        reason,
      });
      toast.success(`${name} has been blocked`);
    }

    setIsBlockModalOpen(false);
    onRelationshipChange?.();
    onClose();
  };

  const handleReportSubmit = (payload: { reason: string; details: string }) => {
    reportAdvertiser({
      id: advertiser.id,
      name,
      reason: payload.reason,
      details: payload.details,
    });
    toast.success("Report submitted");
    onRelationshipChange?.();
  };

  return (
    <>
      <Drawer
        opened={isOpen}
        onClose={onClose}
        position="right"
        title="Advertiser Profile"
        size="md"
        classNames={{
          content: "!bg-[#181a20] !text-white",
          header: "!bg-[#181a20] !text-white !border-b !border-white/[0.06]",
          title: "!text-white !font-semibold !text-base",
          close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
        }}
      >
        <div className="flex flex-col gap-5 pt-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center text-base font-bold bg-primary/10 border border-primary/20 text-primary">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-semibold text-white">{name}</span>
                {advertiser.verified && <MdVerified className="text-buy text-sm" />}
              </div>
              <div className="text-xs text-white/45 flex items-center gap-2 mt-0.5">
                <span>{advertiser.verified ? "Verified Merchant" : "Standard Advertiser"}</span>
                <span>·</span>
                <span>{trades} Completed Orders</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Button
              variant="subtle"
              className={`flex-1 !h-9 !rounded-lg !text-xs !font-semibold border ${
                blocked
                  ? "!bg-buy/10 !border-buy/30 !text-buy hover:!bg-buy/20"
                  : "!bg-white/[0.05] !border-white/[0.08] !text-white/70 hover:!text-[#F6465D] hover:!bg-[#F6465D]/10"
              }`}
              onClick={() => (blocked ? handleBlockToggle("") : setIsBlockModalOpen(true))}
            >
              {blocked ? "Unblock User" : "Block User"}
            </Button>
            <Button
              variant="subtle"
              className="flex-1 !h-9 !rounded-lg !text-xs !font-semibold !bg-white/[0.05] !border !border-white/[0.08] !text-white/70 hover:!text-white hover:!bg-white/[0.08]"
              onClick={() => setIsReportModalOpen(true)}
            >
              Report User
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Completed Trades</div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">{trades}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Completion Rate</div>
              <div className="text-lg font-bold text-buy font-mono tabular-nums">{completionRate.toFixed(1)}%</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Average Rating</div>
              <div className="text-sm font-semibold text-white mt-1">
                {rating > 0 ? `${rating.toFixed(1)} / 5.0` : "No rating"}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">30d Reviews</div>
              <div className="text-sm font-semibold text-white mt-1">{feedback.recent.length}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">Feedback (30d)</h3>
            <div className="flex gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-buy text-xs font-semibold bg-buy/10 border border-buy/20 px-2.5 py-1 rounded-md">
                <FaThumbsUp size={12} />
                <span>{feedback.positive} Positive</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#F6465D] text-xs font-semibold bg-[#F6465D]/10 border border-[#F6465D]/20 px-2.5 py-1 rounded-md">
                <FaThumbsDown size={12} />
                <span>{feedback.negative} Negative</span>
              </div>
            </div>

            {feedback.recent.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-lg text-xs text-white/40 text-center">
                No recent feedback has been submitted for this advertiser.
              </div>
            ) : (
              <div className="space-y-2">
                {feedback.recent.map((item) => (
                  <div key={item.orderMatchId} className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg text-xs">
                    <div className="flex items-center gap-2 mb-1.5 text-white/40">
                      <span className={item.rating === "POSITIVE" ? "text-buy" : "text-[#F6465D]"}>
                        {item.rating === "POSITIVE" ? <FaThumbsUp size={11} /> : <FaThumbsDown size={11} />}
                      </span>
                      <span className="font-medium text-white/70">{item.reviewerName}</span>
                      <span>·</span>
                      <span>{dayjs(item.createdAt).fromNow()}</span>
                    </div>
                    <div className="text-white/80">{item.review || "No comment left."}</div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] text-white/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <BlockUserModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onConfirm={handleBlockToggle}
        username={name}
      />

      <ReportUserModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        username={name}
      />
    </>
  );
};
