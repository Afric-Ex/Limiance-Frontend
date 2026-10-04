"use client";

export type StoredP2PReview = {
  orderMatchId: string;
  advertiserId: string;
  advertiserName: string;
  reviewerId: string;
  reviewerName: string;
  rating: "POSITIVE" | "NEGATIVE";
  numericRating: number;
  review: string;
  tags: string[];
  createdAt: string;
};

export type BlockedAdvertiser = {
  id: string;
  name: string;
  reason?: string;
  createdAt: string;
};

export type ReportedAdvertiser = {
  id: string;
  name: string;
  reason: string;
  details?: string;
  createdAt: string;
};

// These are intentionally session-memory only. Advertiser names, reviewer
// identities, order ids, reasons, and free-text reviews are PII-bearing data.
let blockedAdvertisers: BlockedAdvertiser[] = [];
let reportedAdvertisers: ReportedAdvertiser[] = [];
let reviews: StoredP2PReview[] = [];

export const clearP2PUserActions = () => {
  blockedAdvertisers = [];
  reportedAdvertisers = [];
  reviews = [];
};

export const getBlockedAdvertisers = () =>
  blockedAdvertisers;

export const isAdvertiserBlocked = (advertiserId?: string | null) =>
  !!advertiserId &&
  getBlockedAdvertisers().some((advertiser) => advertiser.id === advertiserId);

export const blockAdvertiser = (advertiser: {
  id: string;
  name: string;
  reason?: string;
}) => {
  const current = getBlockedAdvertisers().filter(
    (entry) => entry.id !== advertiser.id
  );

  current.unshift({
    id: advertiser.id,
    name: advertiser.name,
    reason: advertiser.reason,
    createdAt: new Date().toISOString(),
  });

  blockedAdvertisers = current;
};

export const unblockAdvertiser = (advertiserId: string) => {
  blockedAdvertisers = getBlockedAdvertisers().filter((entry) => entry.id !== advertiserId);
};

export const getReportedAdvertisers = () =>
  reportedAdvertisers;

export const reportAdvertiser = (report: {
  id: string;
  name: string;
  reason: string;
  details?: string;
}) => {
  const current = getReportedAdvertisers();
  current.unshift({
    ...report,
    createdAt: new Date().toISOString(),
  });
  reportedAdvertisers = current;
};

export const getStoredP2PReviews = () =>
  reviews;

export const getAdvertiserReviews = (advertiserId?: string | null) => {
  if (!advertiserId) {
    return [];
  }

  return getStoredP2PReviews()
    .filter((review) => review.advertiserId === advertiserId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const hasReviewForOrder = (orderMatchId?: string | null) =>
  !!orderMatchId &&
  getStoredP2PReviews().some((review) => review.orderMatchId === orderMatchId);

export const saveP2PReview = (review: StoredP2PReview) => {
  const current = getStoredP2PReviews().filter(
    (entry) => entry.orderMatchId !== review.orderMatchId
  );
  current.unshift(review);
  reviews = current;
};
