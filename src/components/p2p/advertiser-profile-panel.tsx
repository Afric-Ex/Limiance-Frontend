"use client";

import React, { useMemo, useState } from "react";
import { Button, Drawer } from "@mantine/core";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import { MdVerified } from "react-icons/md";
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import toast from "react-hot-toast";
import { P2POrderListings, P2PAdvertiserReviewsResponse } from "@/src/types/p2p";
import { useAdvertiserReviews } from "@/src/hooks/p2p/use-p2p";
import {
  blockAdvertiser,
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

const REVIEWS_PER_PAGE = 10;

const unwrapReviewsResponse = (response: any): P2PAdvertiserReviewsResponse | null => {
  const candidates = [
    response?.data?.data,
    response?.data,
    response?.data?.data?.data,
    response,
  ];
  return (
    candidates.find(
      (candidate) => candidate && Array.isArray(candidate.reviews)
    ) ?? null
  );
};

export const AdvertiserProfilePanel = ({
  advertiser,
  onClose,
  onRelationshipChange,
}: AdvertiserProfilePanelProps) => {
  const isOpen = !!advertiser;
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const advertiserId = advertiser?.id ?? "";
  const reviewsQuery = useAdvertiserReviews(
    advertiserId,
    reviewPage,
    REVIEWS_PER_PAGE
  );

  const name = advertiser
    ? [advertiser.firstName, advertiser.lastName].filter(Boolean).join(" ") || "Merchant"
    : "Merchant";
  const trades = Math.floor(Number(advertiser?.totalOrdersCompleted ?? 0));
  const completionRate = Number(advertiser?.completionPercentage ?? 0);
  const blocked = isAdvertiserBlocked(advertiserId);
  const reviewData = useMemo(
    () => unwrapReviewsResponse(reviewsQuery.data),
    [reviewsQuery.data]
  );
  const reviews = reviewData?.reviews ?? [];
  const averageRating = Number(reviewData?.averageRating ?? advertiser?.rating ?? 0);
  const totalReviews = Number(reviewData?.totalRecords ?? 0);
  const totalPages = Math.max(1, Number(reviewData?.totalPages ?? 1));

  const handleBlockToggle = (reason: string) => {
    if (!advertiser) return;
    if (blocked) {
      unblockAdvertiser(advertiser.id);
      toast.success(`${name} has been unblocked`);
    } else {
      blockAdvertiser({ id: advertiser.id, name, reason });
      toast.success(`${name} has been blocked`);
    }

    setIsBlockModalOpen(false);
    onRelationshipChange?.();
    onClose();
  };

  const handleReportSubmit = (payload: { reason: string; details: string }) => {
    if (!advertiser) return;
    reportAdvertiser({
      id: advertiser.id,
      name,
      reason: payload.reason,
      details: payload.details,
    });
    toast.success("Report submitted");
    onRelationshipChange?.();
  };

  if (!isOpen || !advertiser) return null;

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
              <div className="text-white/40 text-2xs uppercase tracking-wider mb-0.5">Completed Trades</div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">{trades}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg">
              <div className="text-white/40 text-2xs uppercase tracking-wider mb-0.5">Completion Rate</div>
              <div className="text-lg font-bold text-buy font-mono tabular-nums">{completionRate.toFixed(1)}%</div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg">
              <div className="text-white/40 text-2xs uppercase tracking-wider mb-0.5">Average Rating</div>
              <div className="text-sm font-semibold text-white mt-1">
                {averageRating > 0 ? `${averageRating.toFixed(1)} / 5.0` : "No rating"}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg">
              <div className="text-white/40 text-2xs uppercase tracking-wider mb-0.5">Total Reviews</div>
              <div className="text-sm font-semibold text-white mt-1">
                {reviewsQuery.isLoading ? "—" : totalReviews}
              </div>
            </div>
          </div>

          <section aria-label="Advertiser reviews">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">Advertiser Reviews</h3>
              {reviewsQuery.isFetching && !reviewsQuery.isLoading && (
                <span className="text-2xs text-white/40">Updating…</span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-buy text-xs font-semibold bg-buy/10 border border-buy/20 px-2.5 py-1 rounded-md">
                <FaThumbsUp size={12} />
                <span>{reviewData?.positiveCount ?? 0} Positive</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#F6465D] text-xs font-semibold bg-[#F6465D]/10 border border-[#F6465D]/20 px-2.5 py-1 rounded-md">
                <FaThumbsDown size={12} />
                <span>{reviewData?.negativeCount ?? 0} Negative</span>
              </div>
            </div>

            {reviewsQuery.isLoading ? (
              <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-lg text-xs text-white/45 text-center">
                Loading advertiser reviews…
              </div>
            ) : reviewsQuery.isError ? (
              <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-lg text-xs text-white/55 text-center">
                <p>Unable to load reviews right now.</p>
                <button
                  type="button"
                  onClick={() => reviewsQuery.refetch()}
                  className="mt-2 text-primary hover:underline font-semibold"
                >
                  Try again
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-lg text-xs text-white/40 text-center">
                No reviews have been submitted for this advertiser yet.
              </div>
            ) : (
              <div className="space-y-2">
                {reviews.map((item) => (
                  <article
                    key={item.id || item.orderMatchId}
                    className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5 text-white/40">
                      <span className={item.rating === "POSITIVE" ? "text-buy" : "text-[#F6465D]"}>
                        {item.rating === "POSITIVE" ? <FaThumbsUp size={11} /> : <FaThumbsDown size={11} />}
                      </span>
                      <span className="font-medium text-white/70">{item.reviewerName || "Anonymous"}</span>
                      <span>·</span>
                      <span>{dayjs(item.createdAt).fromNow()}</span>
                    </div>
                    <div className="text-white/80 break-words">{item.review || "No comment left."}</div>
                    {!!item.tags?.length && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-white/[0.05] text-2xs text-white/50">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-2xs text-white/40">Page {reviewPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="subtle"
                    disabled={reviewPage <= 1 || reviewsQuery.isFetching}
                    onClick={() => setReviewPage((page) => Math.max(1, page - 1))}
                    className="!text-white/70 disabled:!opacity-40"
                  >
                    Previous
                  </Button>
                  <Button
                    size="xs"
                    variant="subtle"
                    disabled={reviewPage >= totalPages || reviewsQuery.isFetching}
                    onClick={() => setReviewPage((page) => Math.min(totalPages, page + 1))}
                    className="!text-white/70 disabled:!opacity-40"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </section>
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
