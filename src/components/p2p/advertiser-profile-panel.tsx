"use client";

import React, { useState } from "react";
import { Button, Drawer } from "@mantine/core";
import { formatDistanceToNow } from "date-fns";
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
    [advertiser.firstName, advertiser.lastName].filter(Boolean).join(" ") ||
    "Merchant";
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
    positive: recentReviews.filter((review) => review.rating === "POSITIVE")
      .length,
    negative: recentReviews.filter((review) => review.rating === "NEGATIVE")
      .length,
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
          content: "bg-gray-900 text-white",
          header: "bg-gray-900 text-white border-b border-white/10",
          title: "text-lg font-bold",
          close: "text-white hover:bg-white/10",
        }}
      >
        <div className="flex flex-col gap-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white bg-blue-500/20 text-blue-400">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{name}</span>
                {advertiser.verified && (
                  <MdVerified className="text-[#0ECB81] text-lg" />
                )}
              </div>
              <div className="text-sm text-white/50 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#0ECB81]" />
                  Verified advertiser
                </span>
                <span>•</span>
                <span>{trades} completed trades</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="light"
              color={blocked ? "green" : "red"}
              className={`flex-1 border-white/10 ${
                blocked
                  ? "bg-[#0ECB81]/10 hover:bg-[#0ECB81]/20 text-[#0ECB81]"
                  : "bg-white/5 hover:bg-[#F6465D]/20 hover:text-[#F6465D] text-white/80"
              }`}
              onClick={() =>
                blocked ? handleBlockToggle("") : setIsBlockModalOpen(true)
              }
            >
              {blocked ? "Unblock User" : "Block User"}
            </Button>
            <Button
              variant="light"
              color="gray"
              className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
              onClick={() => setIsReportModalOpen(true)}
            >
              Report
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="text-white/50 text-sm mb-1">Completed Trades</div>
              <div className="text-2xl font-bold text-white">{trades}</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="text-white/50 text-sm mb-1">Completion Rate</div>
              <div className="text-2xl font-bold text-[#0ECB81]">
                {completionRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="text-white/50 text-sm mb-1">Average Rating</div>
              <div className="text-xl font-bold text-white">
                {rating > 0 ? `${rating.toFixed(1)}/5` : "No rating yet"}
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="text-white/50 text-sm mb-1">30d Reviews</div>
              <div className="text-xl font-bold text-white">
                {feedback.recent.length}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Feedback (30d)</h3>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2 text-[#0ECB81]">
                <FaThumbsUp />
                <span className="font-bold">{feedback.positive}</span>
              </div>
              <div className="flex items-center gap-2 text-[#F6465D]">
                <FaThumbsDown />
                <span className="font-bold">{feedback.negative}</span>
              </div>
            </div>

            {feedback.recent.length === 0 ? (
              <div className="bg-white/5 p-4 rounded-lg text-sm text-white/50">
                No recent feedback has been submitted for this advertiser yet.
              </div>
            ) : (
              <div className="space-y-3">
                {feedback.recent.map((item) => (
                  <div
                    key={item.orderMatchId}
                    className="bg-white/5 p-3 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2 mb-2 text-white/50">
                      <span
                        className={
                          item.rating === "POSITIVE"
                            ? "text-[#0ECB81]"
                            : "text-[#F6465D]"
                        }
                      >
                        {item.rating === "POSITIVE" ? (
                          <FaThumbsUp size={12} />
                        ) : (
                          <FaThumbsDown size={12} />
                        )}
                      </span>
                      <span>{item.reviewerName}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="text-white/90">
                      {item.review || "No comment left."}
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full bg-black/20 text-xs text-white/60"
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
