"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { OrderCompletedOverlay } from "@/src/components/p2p/order-completed-overlay";
import { OrderCancelledOverlay } from "@/src/components/p2p/order-cancelled-overlay";
import { ChatWindow } from "@/src/components/p2p/chat-window";
import { Loader, Button, Modal } from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  useGetMatchedOrder,
  useUpdateMatchedOrder,
  useRequestReleaseCode,
  useReleaseOrder,
  useAddReview,
} from "@/src/hooks/p2p/use-p2p";
import { useP2PMatchRoom } from "@/src/hooks/p2p/use-p2p-realtime";
import { useQuery } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import toast from "react-hot-toast";
import { useUserStore } from "@/src/stores/user-store";
import { hasReviewForOrder, saveP2PReview } from "@/src/lib/p2p-user-actions";
import { TotpGateModal } from "@/src/components/transactions/totp-gate-modal";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { P2PMatchStatus } from "@/src/lib/status-constants";
import { parseDate } from "@/src/lib/parse-date";
import { MdArrowBack, MdCheck, MdWarning, MdInfoOutline } from "react-icons/md";

import { BuyerPendingPanel } from "@/src/components/p2p/buyer-pending-panel";
import { BuyerPaidPanel } from "@/src/components/p2p/buyer-paid-panel";
import { SellerPendingPanel } from "@/src/components/p2p/seller-pending-panel";
import { SellerPaidPanel } from "@/src/components/p2p/seller-paid-panel";
import { CancelOrderModal } from "@/src/components/p2p/cancel-order-modal";
import { ReleaseCryptoModal } from "@/src/components/p2p/release-crypto-modal";
import { DisputePanel } from "@/src/components/p2p/dispute-panel";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2POrderDetailSkeleton } from "@/src/components/skeletons/p2p";

function OrderRoomPageInner() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  const [otpValue, setOtpValue] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const totpCodeRef = useRef<string | undefined>(undefined);

  const [feedbackSkipped, setFeedbackSkipped] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [cancelledNoticeDismissed, setCancelledNoticeDismissed] = useState(false);

  const user = useUserStore((state) => state.user);
  const userLoading = useUserStore((state) => state.loading);
  const userHydrated = useUserStore((state) => state.hydrated);
  const fetchUser = useUserStore((state) => state.fetchUser);

  useP2PMatchRoom(orderId);
  const { data: orderData, isLoading, refetch } = useGetMatchedOrder(orderId);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateMatchedOrder();
  const { mutate: releaseOrder, isPending: isReleasing } = useReleaseOrder();
  const { mutate: addReview, isPending: isSubmittingFeedback } = useAddReview();
  const { mutate: requestReleaseCode, isPending: isRequestingCode } = useRequestReleaseCode();

  const order: any = (orderData as any)?.data?.data;

  const originalOrderId = order?.orderId;
  const { data: originalOrderData } = useQuery({
    queryKey: p2pKey.orderById(originalOrderId ?? ""),
    queryFn: () => p2p.getOrderById(originalOrderId!),
    enabled: !!originalOrderId,
  });
  const originalOrder: any = (originalOrderData as any)?.data?.data;

  // Derive useful values. Endpoints return ids and names either flat or nested
  // (`advertiser`, `buyer`, `seller`, `matcher`), so normalise both shapes.
  const status: string = String(order?.status ?? "");
  const nestedId = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return String(value.id ?? value.userId ?? value.user_id ?? value._id ?? "");
  };
  const nestedName = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    const full = [value.firstName, value.lastName].filter(Boolean).join(" ").trim();
    return (
      full ||
      value.fullName ||
      value.name ||
      value.username ||
      value.email ||
      ""
    );
  };
  const currentUserId = user?.id != null ? String(user.id) : "";
  const sameId = (value: unknown, id: string) => {
    const resolved = nestedId(value);
    return Boolean(resolved && id && resolved === id);
  };
  const adType = String(
    order?.type ?? order?.orderType ?? order?.order_type ?? originalOrder?.type ?? ""
  ).toUpperCase();
  const matchedAs = String(
    order?.matchedAs ?? order?.matched_as ?? originalOrder?.matchedAs ?? originalOrder?.matched_as ?? ""
  ).toUpperCase();

  // The API returns `matcherId` but sometimes no flat buyer/seller/advertiser
  // id — fall back to the nested user objects.
  const buyerId = nestedId(order?.buyerId ?? order?.buyer_id ?? order?.buyer);
  const sellerId = nestedId(order?.sellerId ?? order?.seller_id ?? order?.seller);
  const advertiserId = nestedId(
    order?.advertiserId ??
      order?.advertiser_id ??
      order?.advertiser ??
      originalOrder?.advertiserId ??
      originalOrder?.advertiser
  );
  const matcherId = nestedId(
    order?.matcherId ?? order?.matcher_id ?? order?.matcher
  );

  const isMatcher = sameId(matcherId, currentUserId);
  const isAdvertiser =
    !isMatcher &&
    Boolean(
      sameId(advertiserId, currentUserId) ||
        (!advertiserId &&
          ((adType === "SELL" && sameId(sellerId, currentUserId)) ||
            (adType === "BUY" && sameId(buyerId, currentUserId))))
    );

  const isBuyer = matchedAs === "BUY"
    ? true
    : matchedAs === "SELL"
    ? false
    : Boolean(
        currentUserId &&
          (sameId(buyerId, currentUserId) ||
            (!buyerId && sameId(matcherId, currentUserId) && adType === "SELL") ||
            (!buyerId && sameId(advertiserId, currentUserId) && adType === "BUY") ||
            (!buyerId && !matcherId && !advertiserId && adType === "SELL"))
      );
  const isSeller = !isBuyer;
  // Side is always shown from the signed-in user's perspective: the buyer sees
  // BUY and the seller sees SELL, regardless of the ad's own side.
  const userSide: "BUY" | "SELL" = isBuyer ? "BUY" : "SELL";

  const normalizedStatus =
    status.toUpperCase() === "PARTIALLY_COMPLETED" || status.toUpperCase() === "FULFILLED"
      ? "PAID"
      : status.toUpperCase();

  const asset = order?.asset ?? originalOrder?.asset ?? "";
  const fiat = String(order?.fiatCurrency ?? originalOrder?.currency ?? originalOrder?.fiat ?? "USD").toUpperCase();
  const quantity = parseFloat(String(order?.quantity ?? 0));
  const rawFiatAmount = parseFloat(String(order?.fiatAmount ?? 0));
  const effectiveMatchedUnitPrice =
    quantity > 0 && rawFiatAmount > 0 ? rawFiatAmount / quantity : 0;

  // Unit price comes from the agreed match calculation (fiatAmount / quantity),
  // falling back through both the match and the original ad.
  const firstPositivePrice = (...values: unknown[]): number => {
    for (const value of values) {
      const parsed = parseFloat(String(value ?? ""));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  };
  const price =
    effectiveMatchedUnitPrice > 0
      ? effectiveMatchedUnitPrice
      : firstPositivePrice(
          originalOrder?.fixedPrice,
          originalOrder?.price,
          order?.fixedPrice,
          order?.price,
          order?.adPrice,
          order?.unitPrice,
          order?.rate
        );
  const fiatAmount = rawFiatAmount > 0 ? rawFiatAmount : quantity * price;
  const paymentMethod = order?.paymentMethod;
  // Resolve the counterparty purely from roles. The advertiser and matcher are
  // the two people on a match, but prefer buyer/seller ids when present because
  // they describe this specific order rather than the underlying ad.
  const adOwnerNested =
    nestedName(originalOrder?.advertiser) ||
    nestedName(originalOrder?.creator) ||
    nestedName(originalOrder?.user) ||
    nestedName(order?.advertiser);
  const orderBuyerName =
    order?.buyerName || nestedName(order?.buyer) || nestedName(order?.buyerUser);
  const orderSellerName =
    order?.sellerName || nestedName(order?.seller) || nestedName(order?.sellerUser);
  const orderAdvertiserName =
    order?.advertiserName || nestedName(order?.advertiser) || adOwnerNested;
  const orderMatcherName =
    order?.matcherName || nestedName(order?.matcher) || nestedName(order?.matcherUser);

  const nameById = new Map<string, string>();
  const registerName = (id: unknown, name: string) => {
    const key = nestedId(id);
    if (key && name && !nameById.has(key)) nameById.set(key, name);
  };
  registerName(buyerId, orderBuyerName);
  registerName(sellerId, orderSellerName);
  registerName(advertiserId, orderAdvertiserName);
  registerName(matcherId, orderMatcherName);

  const counterpartyId = (() => {
    if (sameId(buyerId, currentUserId)) {
      return sellerId || (sameId(advertiserId, currentUserId) ? matcherId : advertiserId) || "";
    }
    if (sameId(sellerId, currentUserId)) {
      return buyerId || (sameId(advertiserId, currentUserId) ? matcherId : advertiserId) || "";
    }
    if (sameId(advertiserId, currentUserId)) {
      return matcherId || (isBuyer ? sellerId : buyerId) || "";
    }
    if (sameId(matcherId, currentUserId)) {
      return advertiserId || (isBuyer ? sellerId : buyerId) || "";
    }
    return [buyerId, sellerId, advertiserId, matcherId].find(
      (id) => id && !sameId(id, currentUserId)
    ) || "";
  })();

  const currentUserName = nestedName(user);
  const isCurrentUserName = (name: string) =>
    Boolean(
      name &&
        currentUserName &&
        name.trim().toLowerCase() === currentUserName.trim().toLowerCase()
    );
  const counterpartyName = (() => {
    // When the current user is selling ("matchedAs": "SELL"), the counterparty is the BUYER.
    // When the current user is buying ("matchedAs": "BUY"), the counterparty is the SELLER.
    const counterpartySideName =
      matchedAs === "SELL"
        ? orderBuyerName
        : matchedAs === "BUY"
          ? orderSellerName
          : isBuyer
            ? orderSellerName
            : orderBuyerName;

    if (counterpartySideName && !isCurrentUserName(counterpartySideName)) {
      return counterpartySideName;
    }

    const direct = counterpartyId ? nameById.get(counterpartyId) : "";
    if (direct && !isCurrentUserName(direct)) return direct;
    const resolved = [
      isBuyer ? orderSellerName : orderBuyerName,
      isBuyer ? orderBuyerName : orderSellerName,
      orderMatcherName,
      orderAdvertiserName,
    ].find((name) => name && !isCurrentUserName(name));
    return resolved || (isBuyer ? "Seller" : "Buyer");
  })();

  const existingFeedbackSubmitted = !!order?.review || hasReviewForOrder(orderId) || feedbackSubmitted;

  // Parses the Go backend's non-standard UTC format as well as ISO strings and
  // unix timestamps, regardless of whether the value came from REST or WS.
  const parseBackendDate = (value: unknown): Date | null =>
    parseDate(value instanceof Date ? value.toISOString() : value);

  const parseFirstDate = (...values: unknown[]): Date | null => {
    for (const value of values) {
      const parsed = parseBackendDate(value);
      if (parsed) return parsed;
    }
    return null;
  };

  const deadlineDate = parseFirstDate(
    order?.expiryTime,
    order?.expiry_time,
    order?.expiresAt,
    order?.expires_at,
    order?.deadline,
    order?.order?.expiryTime,
    order?.order?.expiry_time
  );
  const deadlineStr = deadlineDate
    ? deadlineDate.toISOString()
    : new Date(Date.now() + 900000).toISOString();

  const orderCreatedDate = parseFirstDate(
    order?.createdAt,
    order?.created_at,
    order?.matchedAt,
    order?.matched_at,
    order?.matchCreatedAt,
    order?.match_created_at,
    order?.orderCreatedAt,
    order?.order_created_at,
    order?.created,
    order?.timestamp,
    order?.time,
    order?.order?.createdAt,
    order?.order?.created_at,
    order?.match?.createdAt,
    order?.match?.created_at,
    (orderData as any)?.data?.createdAt,
    (orderData as any)?.data?.created_at,
    originalOrder?.createdAt,
    originalOrder?.created_at
  );

  // Cached timestamp prevents real-time WebSocket state flashes from erasing the created timestamp.
  const cachedTimestampRef = useRef<string>("");
  if (orderCreatedDate) cachedTimestampRef.current = orderCreatedDate.toISOString();
  const effectiveCreatedAt =
    orderCreatedDate ?? parseBackendDate(cachedTimestampRef.current);

  const updatedAtDate = parseFirstDate(order?.updatedAt, order?.updated_at, orderCreatedDate);
  const updatedAtStr = (updatedAtDate ?? new Date()).toISOString();

  const handleConfirmPayment = () => {
    updateStatus(
      { orderMatchId: orderId, status: P2PMatchStatus.FULFILLED },
      {
        onSuccess: () => {
          setPaymentModalOpen(false);
          refetch();
        },
      }
    );
  };

  const handleCancel = (reason: string) => {
    void reason;
    updateStatus(
      { orderMatchId: orderId, status: P2PMatchStatus.CANCELLED },
      {
        onSuccess: () => {
          setCancelModalOpen(false);
          refetch();
        },
      }
    );
  };

  const handleRequestOtp = () => {
    const request = () => {
      requestReleaseCode(orderId, {
        onSuccess: () => {
          setOtpRequested(true);
          toast.success("Verification code sent to your email/phone");
        },
      });
    };

    if (user?.twoFaEnabled) {
      modals.open({
        children: (
          <TotpGateModal
            onComplete={(code) => {
              totpCodeRef.current = code;
              modals.closeAll();
              request();
            }}
          />
        ),
        ...DEFAULT_MODAL_SETTINGS,
      });
    } else {
      totpCodeRef.current = undefined;
      request();
    }
  };

  const handleRelease = () => {
    if (!otpValue || otpValue.length < 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    releaseOrder(
      { id: orderId, releaseCode: otpValue, totpCode: totpCodeRef.current },
      {
        onSuccess: () => {
          setReleaseModalOpen(false);
          totpCodeRef.current = undefined;
          refetch();
        },
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSubmitFeedback = (rating: "POSITIVE" | "NEGATIVE", tags: string[], comment: string) => {
    if (!counterpartyId) {
      toast.error("Unable to determine counterparty for this trade");
      return;
    }
    if (currentUserId && String(counterpartyId) === currentUserId) {
      toast.error("You can't review your own trade");
      return;
    }

    addReview(
      {
        orderMatchId: orderId,
        rating: rating === "POSITIVE" ? 5 : 1,
        review: comment.trim() || tags.join(", "),
      },
      {
        onSuccess: () => {
          saveP2PReview({
            orderMatchId: orderId,
            advertiserId: counterpartyId,
            advertiserName: counterpartyName,
            reviewerId: user?.id || "current-user",
            reviewerName:
              user?.username ||
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              user?.email ||
              "Anonymous user",
            rating,
            numericRating: rating === "POSITIVE" ? 5 : 1,
            review: comment.trim(),
            tags,
            createdAt: new Date().toISOString(),
          });
          setFeedbackSubmitted(true);
          refetch();
        },
      }
    );
  };

  if (isLoading || !userHydrated) {
    return (
      <P2PLayout>
        <div className="flex flex-col justify-center items-center h-full min-h-[500px] gap-3">
          <Loader color="blue" size="md" />
          <p className="text-white/40 text-xs">Loading trade details...</p>
        </div>
      </P2PLayout>
    );
  }

  if (!user?.id) {
    return (
      <P2PLayout>
        <div className="flex flex-col justify-center items-center h-full min-h-[400px] gap-3 text-center bg-[#181a20] border border-white/[0.07] rounded-xl p-8 max-w-md mx-auto my-6">
          <p className="text-white/60 text-xs leading-relaxed">
            We couldn&apos;t load your session details. Your trade actions and chat require an authenticated account.
          </p>
          <Button
            className="mt-2 !bg-primary hover:!bg-primary/90 !text-white !h-8 !text-xs !font-semibold !rounded-lg"
            loading={userLoading}
            onClick={() => void fetchUser()}
          >
            Retry
          </Button>
        </div>
      </P2PLayout>
    );
  }

  if (!order) {
    return (
      <P2PLayout>
        <div className="flex flex-col items-center justify-center py-16 text-white/50 bg-[#181a20] border border-white/[0.07] rounded-xl max-w-md mx-auto my-6 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 mb-3">
            <MdInfoOutline size={22} />
          </div>
          <div className="text-white/80 font-medium text-sm mb-1">Order Not Found</div>
          <p className="text-white/40 text-xs mb-4">This trade does not exist or you do not have permission to access it.</p>
          <Button
            className="!bg-primary hover:!bg-primary/90 !text-white !h-8 !text-xs !font-semibold !rounded-lg"
            onClick={() => router.push("/trades/p2p/orders")}
          >
            View All Orders
          </Button>
        </div>
      </P2PLayout>
    );
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pending Payment", color: "text-[#FBA42A] bg-[#FBA42A]/10 border-[#FBA42A]/20" },
    PAID: { label: "Payment Confirmed", color: "text-[#4d77f0] bg-[#4d77f0]/10 border-[#4d77f0]/20" },
    PARTIALLY_COMPLETED: { label: "Payment Confirmed", color: "text-[#4d77f0] bg-[#4d77f0]/10 border-[#4d77f0]/20" },
    RELEASED: { label: "Released", color: "text-buy bg-buy/10 border-buy/20" },
    COMPLETED: { label: "Completed", color: "text-buy bg-buy/10 border-buy/20" },
    CANCELLED: { label: "Cancelled", color: "text-white/40 bg-white/[0.05] border-white/[0.07]" },
    DISPUTED: { label: "Disputed", color: "text-[#F6465D] bg-[#F6465D]/10 border-[#F6465D]/20" },
  };

  const statusInfo = statusConfig[status.toUpperCase()] ?? {
    label: status,
    color: "text-white/40 bg-white/[0.05] border-white/[0.07]",
  };

  const isSelfReview = Boolean(
    currentUserId && counterpartyId && String(counterpartyId) === currentUserId
  );
  const canReview = Boolean(counterpartyId) && !isSelfReview;

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-5 max-[1150px]:pb-[90px] page-enter">
        {/* Completed/Cancelled overlays */}
        {(normalizedStatus === "COMPLETED" || normalizedStatus === "RELEASED") && !feedbackSkipped && (
          <OrderCompletedOverlay
            isBuyer={isBuyer}
            cryptoAmount={quantity}
            asset={asset}
            fiatAmount={fiatAmount}
            fiat={fiat}
            counterparty={counterpartyName}
            fee={0}
            onGoToWallet={() => router.push("/assets/funding")}
            onSkipFeedback={() => setFeedbackSkipped(true)}
            onSubmitFeedback={handleSubmitFeedback}
            isSubmittingFeedback={isSubmittingFeedback}
            initialSubmitted={existingFeedbackSubmitted}
            canReview={canReview}
            isSelfReview={isSelfReview}
          />
        )}

        {normalizedStatus === "CANCELLED" && !cancelledNoticeDismissed && (
          <OrderCancelledOverlay
            orderId={orderId}
            cryptoAmount={quantity}
            asset={asset}
            isBuyer={isBuyer}
            onClose={() => setCancelledNoticeDismissed(true)}
          />
        )}

        {/* Header */}
                {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
            <button
              onClick={() => router.push("/trades/p2p/orders")}
              className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 text-caption font-medium text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <MdArrowBack size={16} />
              <span>Orders</span>
            </button>
            <div className="flex min-w-0 flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-xl font-semibold leading-tight text-white">
                Order <span className="font-mono text-white/50">#{orderId.slice(-8).toUpperCase()}</span>
              </h1>
              <span
                className={`inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-micro font-semibold uppercase leading-none tracking-wider ${
                  userSide === "BUY"
                    ? "text-buy bg-buy/10 border-buy/20"
                    : "text-[#F6465D] bg-[#F6465D]/10 border-[#F6465D]/20"
                }`}
              >
                {userSide}
              </span>
              <span
                className={`inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-micro font-semibold uppercase leading-none tracking-wider ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Main split layout */}
        <div className="flex flex-col min-[1150px]:flex-row gap-6 min-[1150px]:h-[calc(100vh-210px)] min-h-[600px] max-[1150px]:min-h-0">
          {/* LEFT: Order Details Panel */}
          <div className="min-[1150px]:w-[50%] xl:w-[45%] overflow-y-auto custom-scrollbar pr-0 min-[1150px]:pr-1 pb-10 max-[1150px]:pb-0">
            <div className="flex flex-col rounded-xl border border-white/[0.07] bg-[#181a20] p-5 sm:p-6">
              {/* Step indicator */}
              <div className="relative mb-8">
                <div className="relative z-10 flex items-start justify-between">
                  {["Order Placed", "Fiat Payment", "Crypto Released"].map((step, i) => {
                    const stepNum = i + 1;
                    const currentStep =
                      normalizedStatus === "PENDING"
                        ? 2
                        : normalizedStatus === "PAID"
                        ? 2
                        : normalizedStatus === "RELEASED" || normalizedStatus === "COMPLETED"
                        ? 3
                        : 1;
                    const done = stepNum < currentStep;
                    const active = stepNum === currentStep;
                    return (
                      <div key={step} className="flex max-w-[92px] flex-col items-center gap-2.5 bg-[#181a20] px-1.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            active
                              ? "border border-primary bg-primary/10 text-primary"
                              : done
                              ? "border border-buy bg-buy/10 text-buy"
                              : "border border-white/10 bg-white/[0.02] text-white/30"
                          }`}
                        >
                          {done ? <MdCheck size={15} /> : stepNum}
                        </div>
                        <span
                          className={`text-center text-xs font-medium leading-tight ${
                            active ? "text-white" : done ? "text-buy" : "text-white/35"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="absolute left-10 right-10 top-4 -z-0 h-[1px] bg-white/[0.08]">
                  <div
                    className="h-full bg-buy transition-all duration-500"
                    style={{
                      width:
                        normalizedStatus === "PENDING"
                          ? "50%"
                          : normalizedStatus === "PAID"
                          ? "50%"
                          : normalizedStatus === "RELEASED" || normalizedStatus === "COMPLETED"
                          ? "100%"
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="mb-6 rounded-lg border border-white/[0.05] bg-white/[0.02] p-5">
                <div className="mb-4 text-micro font-semibold uppercase tracking-wider text-white/40">
                  Transaction Summary
                </div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-5 text-caption">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="text-white/45">{isBuyer ? "You Receive" : "Locked in Escrow"}</div>
                    <div className="font-mono text-body font-semibold text-white">
                      {quantity.toLocaleString()} <span className="font-sans text-xs text-white/50">{asset}</span>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="text-white/45">{isBuyer ? "You Pay" : "You Receive"}</div>
                    <div className="font-mono text-body font-semibold text-buy">
                      {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                      <span className="font-sans text-xs text-buy/60">{fiat}</span>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="text-white/45">Unit Price</div>
                    <div className="font-mono text-white">
                      {price > 0
                        ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                        : "—"}{" "}
                      {fiat}/{asset}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="text-white/45">Counterparty</div>
                    <div className="truncate font-medium text-white/90">{counterpartyName || "—"}</div>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <div className="text-white/45">Order Timestamp</div>
                    <div className="text-white/70">
                      {effectiveCreatedAt ? effectiveCreatedAt.toLocaleString() : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Conditional Panels based on Role and Status */}
              {normalizedStatus === "PENDING" && isBuyer && (
                <BuyerPendingPanel
                  orderId={orderId}
                  fiatAmount={fiatAmount}
                  fiat={fiat}
                  paymentMethod={paymentMethod}
                  deadlineStr={deadlineStr}
                  setCancelModalOpen={setCancelModalOpen}
                  setPaymentModalOpen={setPaymentModalOpen}
                  copyToClipboard={copyToClipboard}
                />
              )}

              {normalizedStatus === "PAID" && isBuyer && (
                <BuyerPaidPanel
                  counterpartyName={counterpartyName}
                  quantity={quantity}
                  asset={asset}
                  updatedAt={updatedAtStr}
                  deadlineStr={deadlineStr}
                  onDisputeOpen={() => setDisputeOpen(true)}
                />
              )}

              {normalizedStatus === "PENDING" && isSeller && (
                <SellerPendingPanel
                  fiatAmount={fiatAmount}
                  fiat={fiat}
                  paymentMethod={paymentMethod}
                  setCancelModalOpen={setCancelModalOpen}
                />
              )}

              {normalizedStatus === "PAID" && isSeller && (
                <SellerPaidPanel
                  counterpartyName={counterpartyName}
                  fiatAmount={fiatAmount}
                  fiat={fiat}
                  paymentMethod={paymentMethod}
                  updatedAt={updatedAtStr}
                  setReleaseModalOpen={setReleaseModalOpen}
                  onDisputeOpen={() => setDisputeOpen(true)}
                />
              )}

              {/* Read Only views for terminal states */}
              {(normalizedStatus === "COMPLETED" || normalizedStatus === "RELEASED") && (
                <div className="bg-buy/[0.08] border border-buy/20 rounded-lg p-4 text-center mt-4">
                  <div className="text-buy font-semibold text-sm mb-1">Order Completed</div>
                  <p className="text-white/55 text-xs">Cryptocurrency was released from platform escrow successfully.</p>
                </div>
              )}

              {normalizedStatus === "CANCELLED" && (
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-4 text-center mt-4">
                  <div className="text-white/70 font-semibold text-sm mb-1">Order Cancelled</div>
                  <p className="text-white/40 text-xs">This trade has been cancelled. No assets were exchanged.</p>
                </div>
              )}

              {normalizedStatus === "DISPUTED" && (
                <div className="bg-[#F6465D]/10 border border-[#F6465D]/20 rounded-lg p-4 text-center mt-4">
                  <div className="text-[#F6465D] font-semibold text-sm mb-1">Under Mediation / Dispute</div>
                  <p className="text-white/60 text-xs">Our dispute team is reviewing this case. Check chat and email for updates.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Chat */}
          <div className="flex-1 min-w-0 max-[1150px]:min-h-[500px]">
            {order?.chatId ? (
              <ChatWindow chatId={order.chatId} currentUserId={currentUserId} />
            ) : (
              <div className="flex justify-center items-center h-full bg-[#181a20] rounded-xl border border-white/[0.07]">
                <span className="text-white/40 text-xs">Chat is not available for this trade</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <CancelOrderModal
        opened={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        isBuyer={isBuyer}
        orderId={orderId}
        cryptoAmount={quantity}
        asset={asset}
        isUpdating={isUpdating}
        handleCancel={handleCancel}
      />

      <ReleaseCryptoModal
        opened={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
        quantity={quantity}
        asset={asset}
        counterpartyName={counterpartyName}
        fiatAmount={fiatAmount}
        fiat={fiat}
        otpRequested={otpRequested}
        otpValue={otpValue}
        setOtpValue={setOtpValue}
        isRequestingCode={isRequestingCode}
        isReleasing={isReleasing}
        handleRequestOtp={handleRequestOtp}
        handleRelease={handleRelease}
        showFinalConfirm={showFinalConfirm}
        setShowFinalConfirm={setShowFinalConfirm}
      />

      <DisputePanel
        isOpen={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        orderMatchId={orderId}
        onSuccess={() => refetch()}
      />

      {/* In-page Payment Confirmation Modal */}
      <Modal
        opened={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Confirm Payment Sent"
        centered
        classNames={{
          content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
          header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
          title: "!text-white !font-semibold !text-base",
          close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
        }}
      >
        <div className="flex flex-col gap-4 pt-2">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 text-xs">
            <div className="text-white/40 uppercase tracking-wider text-2xs mb-1.5">You are confirming payment of:</div>
            <div className="text-white font-bold text-xl font-mono">
              {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
              <span className="text-white/60 text-sm font-sans">{fiat}</span>
            </div>
            <div className="text-white/50 mt-1">
              via {paymentMethod?.data?.bankName ?? paymentMethod?.method ?? "bank transfer"}
            </div>
          </div>
          <div className="bg-[#FBA42A]/10 border border-[#FBA42A]/20 rounded-lg p-3 text-[#FBA42A] text-xs flex items-start gap-2 leading-relaxed">
            <MdWarning size={15} className="shrink-0 mt-0.5" />
            <span>
              Only confirm if you have <strong>actually</strong> completed the transfer in your bank app. False
              confirmations will restrict your trading privileges.
            </span>
          </div>
          <div className="flex gap-2.5 mt-1">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="flex-1 h-10 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.07] transition-colors text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPayment}
              disabled={isUpdating}
              className="flex-1 h-10 rounded-lg bg-buy hover:bg-buy/90 text-white font-semibold transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Confirming..." : "Yes, I've Paid"}
            </button>
          </div>
        </div>
      </Modal>
    </P2PLayout>
  );
}

export default function OrderRoomPage() {
  return (
    <PageSuspense fallback={<P2POrderDetailSkeleton />}>
      <OrderRoomPageInner />
    </PageSuspense>
  );
}
