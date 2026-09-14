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

const STORAGE_KEYS = {
  blockedAdvertisers: "p2p-blocked-advertisers",
  reportedAdvertisers: "p2p-reported-advertisers",
  reviews: "p2p-advertiser-reviews",
} as const;

const isBrowser = () => typeof window !== "undefined";

const readStorage = <T,>(key: string): T[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorage = <T,>(key: string, value: T[]) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const getBlockedAdvertisers = () =>
  readStorage<BlockedAdvertiser>(STORAGE_KEYS.blockedAdvertisers);

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

  writeStorage(STORAGE_KEYS.blockedAdvertisers, current);
};

export const unblockAdvertiser = (advertiserId: string) => {
  writeStorage(
    STORAGE_KEYS.blockedAdvertisers,
    getBlockedAdvertisers().filter((entry) => entry.id !== advertiserId)
  );
};

export const getReportedAdvertisers = () =>
  readStorage<ReportedAdvertiser>(STORAGE_KEYS.reportedAdvertisers);

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
  writeStorage(STORAGE_KEYS.reportedAdvertisers, current);
};

export const getStoredP2PReviews = () =>
  readStorage<StoredP2PReview>(STORAGE_KEYS.reviews);

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
  writeStorage(STORAGE_KEYS.reviews, current);
};
