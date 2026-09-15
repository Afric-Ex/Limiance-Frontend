import {
  getBlockedAdvertisers,
  isAdvertiserBlocked,
  blockAdvertiser,
  unblockAdvertiser,
  getReportedAdvertisers,
  reportAdvertiser,
  getStoredP2PReviews,
  getAdvertiserReviews,
  hasReviewForOrder,
  saveP2PReview,
  type StoredP2PReview,
} from "./p2p-user-actions";

describe("p2p-user-actions", () => {
  const makeReview = (overrides: Partial<StoredP2PReview> = {}): StoredP2PReview => ({
    orderMatchId: "order-1",
    advertiserId: "adv-1",
    advertiserName: "Merchant",
    reviewerId: "rev-1",
    reviewerName: "Buyer",
    rating: "POSITIVE",
    numericRating: 5,
    review: "Great trader",
    tags: ["fast"],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
  });

  describe("blocked advertisers", () => {
    it("returns an empty list initially", () => {
      expect(getBlockedAdvertisers()).toEqual([]);
    });

    it("blocks an advertiser with a reason and a createdAt timestamp", () => {
      const before = Date.now();
      blockAdvertiser({ id: "adv-1", name: "Merchant", reason: "scam" });
      const blocked = getBlockedAdvertisers();
      expect(blocked).toHaveLength(1);
      expect(blocked[0].id).toBe("adv-1");
      expect(blocked[0].name).toBe("Merchant");
      expect(blocked[0].reason).toBe("scam");
      expect(new Date(blocked[0].createdAt).getTime()).toBeGreaterThanOrEqual(before);
    });

    it("blocks an advertiser without an optional reason", () => {
      blockAdvertiser({ id: "adv-2", name: "Trader" });
      expect(getBlockedAdvertisers()[0].reason).toBeUndefined();
    });

    it("re-blocking the same advertiser is idempotent and moves it to the front", () => {
      blockAdvertiser({ id: "adv-1", name: "First" });
      blockAdvertiser({ id: "adv-2", name: "Second" });
      blockAdvertiser({ id: "adv-1", name: "First Updated", reason: "again" });

      const blocked = getBlockedAdvertisers();
      expect(blocked).toHaveLength(2);
      expect(blocked[0]).toMatchObject({ id: "adv-1", name: "First Updated", reason: "again" });
      expect(blocked[1].id).toBe("adv-2");
    });

    it("isAdvertiserBlocked returns true only for blocked advertisers", () => {
      blockAdvertiser({ id: "adv-1", name: "Merchant" });
      expect(isAdvertiserBlocked("adv-1")).toBe(true);
      expect(isAdvertiserBlocked("adv-other")).toBe(false);
    });

    it("isAdvertiserBlocked returns false for undefined, null, and empty ids", () => {
      expect(isAdvertiserBlocked(undefined)).toBe(false);
      expect(isAdvertiserBlocked(null)).toBe(false);
      expect(isAdvertiserBlocked("")).toBe(false);
    });

    it("unblockAdvertiser removes the advertiser", () => {
      blockAdvertiser({ id: "adv-1", name: "Merchant" });
      blockAdvertiser({ id: "adv-2", name: "Trader" });
      unblockAdvertiser("adv-1");

      const blocked = getBlockedAdvertisers();
      expect(blocked).toHaveLength(1);
      expect(blocked[0].id).toBe("adv-2");
    });

    it("unblockAdvertiser is a no-op for unknown ids", () => {
      blockAdvertiser({ id: "adv-1", name: "Merchant" });
      unblockAdvertiser("missing");
      expect(getBlockedAdvertisers()).toHaveLength(1);
    });
  });

  describe("reported advertisers", () => {
    it("returns an empty list initially", () => {
      expect(getReportedAdvertisers()).toEqual([]);
    });

    it("reportAdvertiser prepends a report with a createdAt timestamp", () => {
      reportAdvertiser({ id: "adv-9", name: "Bad Actor", reason: "fake listing" });
      reportAdvertiser({ id: "adv-8", name: "Worse Actor", reason: "fraud", details: "took money" });

      const reported = getReportedAdvertisers();
      expect(reported).toHaveLength(2);
      expect(reported[0]).toMatchObject({
        id: "adv-8",
        name: "Worse Actor",
        reason: "fraud",
        details: "took money",
      });
      expect(reported[0].createdAt).toBeTruthy();
      expect(reported[1].id).toBe("adv-9");
    });

    it("reportAdvertiser stores the report without details when omitted", () => {
      reportAdvertiser({ id: "adv-7", name: "Person", reason: "spam" });
      expect(getReportedAdvertisers()[0].details).toBeUndefined();
    });
  });

  describe("advertiser reviews", () => {
    it("returns an empty list initially", () => {
      expect(getStoredP2PReviews()).toEqual([]);
      expect(getAdvertiserReviews("adv-1")).toEqual([]);
    });

    it("saveP2PReview stores the review as-is", () => {
      const review = makeReview();
      saveP2PReview(review);
      expect(getStoredP2PReviews()).toEqual([review]);
    });

    it("saving a review for an already-reviewed order replaces the old one", () => {
      saveP2PReview(makeReview({ orderMatchId: "order-1", rating: "POSITIVE", review: "old" }));
      saveP2PReview(makeReview({ orderMatchId: "order-1", rating: "NEGATIVE", review: "new" }));

      const reviews = getStoredP2PReviews();
      expect(reviews).toHaveLength(1);
      expect(reviews[0]).toMatchObject({ orderMatchId: "order-1", rating: "NEGATIVE", review: "new" });
    });

    it("getAdvertiserReviews filters by advertiserId", () => {
      saveP2PReview(makeReview({ orderMatchId: "o-1", advertiserId: "adv-1", createdAt: "2026-01-01T00:00:00.000Z" }));
      saveP2PReview(makeReview({ orderMatchId: "o-2", advertiserId: "adv-2", createdAt: "2026-01-02T00:00:00.000Z" }));

      const reviews = getAdvertiserReviews("adv-1");
      expect(reviews).toHaveLength(1);
      expect(reviews[0].orderMatchId).toBe("o-1");
    });

    it("getAdvertiserReviews sorts newest first by createdAt", () => {
      saveP2PReview(makeReview({ orderMatchId: "o-1", advertiserId: "adv-1", createdAt: "2026-01-01T00:00:00.000Z" }));
      saveP2PReview(makeReview({ orderMatchId: "o-2", advertiserId: "adv-1", createdAt: "2026-01-03T00:00:00.000Z" }));
      saveP2PReview(makeReview({ orderMatchId: "o-3", advertiserId: "adv-1", createdAt: "2026-01-02T00:00:00.000Z" }));

      expect(getAdvertiserReviews("adv-1").map((r) => r.orderMatchId)).toEqual(["o-2", "o-3", "o-1"]);
    });

    it("getAdvertiserReviews returns an empty array for undefined, null, or unknown ids", () => {
      saveP2PReview(makeReview());
      expect(getAdvertiserReviews(undefined)).toEqual([]);
      expect(getAdvertiserReviews(null)).toEqual([]);
      expect(getAdvertiserReviews("adv-unknown")).toEqual([]);
    });

    it("hasReviewForOrder returns true only when the order has been reviewed", () => {
      saveP2PReview(makeReview({ orderMatchId: "order-1" }));
      expect(hasReviewForOrder("order-1")).toBe(true);
      expect(hasReviewForOrder("order-2")).toBe(false);
    });

    it("hasReviewForOrder returns false for undefined and null order ids", () => {
      saveP2PReview(makeReview());
      expect(hasReviewForOrder(undefined)).toBe(false);
      expect(hasReviewForOrder(null)).toBe(false);
    });
  });

  describe("corrupted storage", () => {
    it("returns an empty list when the stored value is not valid JSON", () => {
      localStorage.setItem("p2p-blocked-advertisers", "{not:json");
      localStorage.setItem("p2p-advertiser-reviews", "oops");
      expect(getBlockedAdvertisers()).toEqual([]);
      expect(getStoredP2PReviews()).toEqual([]);
    });

    it("returns an empty list when the stored value is not an array", () => {
      localStorage.setItem("p2p-blocked-advertisers", JSON.stringify({ id: "adv-1" }));
      localStorage.setItem("p2p-advertiser-reviews", JSON.stringify("nope"));
      expect(getBlockedAdvertisers()).toEqual([]);
      expect(getStoredP2PReviews()).toEqual([]);
    });
  });
});