"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { OrderCompletedOverlay } from "@/src/components/p2p/order-completed-overlay";
import { OrderCancelledOverlay } from "@/src/components/p2p/order-cancelled-overlay";
import { ChatWindow } from "@/src/components/p2p/chat-window";
import { Loader, Button, Modal } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useGetMatchedOrder, useUpdateMatchedOrder, useRequestReleaseCode, useReleaseOrder, useAddReview } from "@/src/hooks/p2p/use-p2p";
import { useP2PMatchRoom } from "@/src/hooks/p2p/use-p2p-realtime";
import { useQuery } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import toast from "react-hot-toast";
import { useUserStore } from "@/src/stores/user-store";
import { hasReviewForOrder, saveP2PReview } from "@/src/lib/p2p-user-actions";
import { TotpGateModal } from "@/src/components/transactions/totp-gate-modal";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { P2PMatchStatus } from "@/src/lib/status-constants";

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

  // Fetch the original P2P ad/order to get price, currency and other missing fields
  const originalOrderId = order?.orderId;
  const { data: originalOrderData } = useQuery({
    queryKey: p2pKey.orderById(originalOrderId ?? ""),
    queryFn: () => p2p.getOrderById(originalOrderId!),
    enabled: !!originalOrderId,
  });
  const originalOrder: any = (originalOrderData as any)?.data?.data;

  // Derive useful values
  const status: string = String(order?.status ?? "");
  // The API returns `matcherId` but NOT `userId` or `advertiserId`
  // Use matcherId to determine our role:
  //   If matcherId === currentUserId → we are the Matcher
  //   Otherwise → we are the Advertiser (creator of the ad)
  // Role maps to Buyer/Seller based on ad type:
  //   BUY ad:  Advertiser = Buyer (pays fiat),  Matcher = Seller (releases crypto)
  //   SELL ad: Advertiser = Seller (releases crypto), Matcher = Buyer (pays fiat)
  const adType: string = String(order?.type ?? "").toUpperCase();
  const currentUserId = user?.id != null ? String(user.id) : "";
  const isMatcher = Boolean(
    order?.matcherId && currentUserId && String(order.matcherId) === currentUserId
  );
  const isAdvertiser = !isMatcher && Boolean(order?.matcherId && currentUserId);

  const isBuyer =
    order?.buyerId && currentUserId
      ? String(order.buyerId) === currentUserId
      : isAdvertiser
        ? adType === "BUY"
        : adType === "SELL";
  const isSeller = !isBuyer;

  // Backend uses PARTIALLY_COMPLETED to mean "buyer confirmed payment" (= PAID state)
  // FULFILLED also means buyer has paid
  const normalizedStatus = 
    status.toUpperCase() === "PARTIALLY_COMPLETED" || status.toUpperCase() === "FULFILLED"
      ? "PAID" 
      : status.toUpperCase();

  const asset = order?.asset ?? originalOrder?.asset ?? "";
  const fiat = String(order?.fiatCurrency ?? originalOrder?.currency ?? originalOrder?.fiat ?? "USD").toUpperCase();
  const quantity = parseFloat(String(order?.quantity ?? 0));
  const price = parseFloat(String(originalOrder?.fixedPrice ?? originalOrder?.price ?? 0));
  const fiatAmount = order?.fiatAmount && order.fiatAmount > 0 ? order.fiatAmount : quantity * price;
  const paymentMethod = order?.paymentMethod;
  // Fall back to the buyer/seller pair when the match does not expose the
  // advertiser id. Never fall back to the signed-in user's own id.
  const buyerSellerCounterpartyId =
    order?.buyerId && currentUserId && String(order.buyerId) === currentUserId
      ? order?.sellerId
      : order?.sellerId && currentUserId && String(order.sellerId) === currentUserId
        ? order?.buyerId
        : undefined;
  const rawCounterpartyId = isAdvertiser ? order?.matcherId : order?.advertiserId;
  const counterpartyId =
    rawCounterpartyId && (!currentUserId || String(rawCounterpartyId) !== currentUserId)
      ? rawCounterpartyId
      : buyerSellerCounterpartyId;
  // A BUY ad has the advertiser as buyer and the matcher as seller; a SELL ad
  // is the reverse. Only use the name belonging to the counterparty's side so
  // the review prompt can never show the signed-in user's own name.
  const personName = (person: any, flatName?: string) =>
    flatName ||
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
    person?.username ||
    "";
  const sellerName = personName(order?.seller, order?.sellerName);
  const buyerName = personName(order?.buyer, order?.buyerName);
  const advertiserName = personName(order?.advertiser, order?.advertiserName);
  const matcherName = personName(order?.matcher, order?.matcherName);
  const counterpartyName = isAdvertiser
    ? (matcherName || (adType === "BUY" ? sellerName : buyerName) || "Trader")
    : (advertiserName || (adType === "BUY" ? buyerName : sellerName) || "Trader");

  const isSelfReview = Boolean(
    currentUserId && counterpartyId && String(counterpartyId) === currentUserId
  );
  const canReview = Boolean(counterpartyId) && !isSelfReview;

  const existingFeedbackSubmitted = !!order?.review || hasReviewForOrder(orderId) || feedbackSubmitted;

  // Helper: parse Go backend's non-standard UTC date format
  // e.g. "2026-06-10 11:34:54.503001 +0000 UTC" → valid JS Date
  // Values can arrive as strings, numbers (unix seconds/millis) or Date objects
  // depending on whether they came from REST or the realtime match room.
  const parseBackendDate = (value: unknown): Date | null => {
    if (value === null || value === undefined || value === "") return null;
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === "number") {
      const millis = value > 1e12 ? value : value * 1000;
      const fromNumber = new Date(millis);
      return isNaN(fromNumber.getTime()) ? null : fromNumber;
    }
    const dateStr = String(value);
    if (!dateStr || dateStr.startsWith("0001")) return null;
    const match = dateStr
      .trim()
      .match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:\s*([+-]\d{2}):?(\d{2}))?/
      );
    if (match) {
      const [, year, month, day, hour, minute, second, fraction, offsetHour, offsetMinute] = match;
      const millis = fraction ? Number(fraction.padEnd(3, "0").slice(0, 3)) : 0;
      const offset = offsetHour
        ? (offsetHour.startsWith("-") ? -1 : 1) *
          (Math.abs(Number(offsetHour)) * 60 + Number(offsetMinute ?? 0))
        : 0;
      return new Date(
        Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, millis) -
          offset * 60000
      );
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Use expiryTime from backend directly — avoids server clock skew issues
  const deadlineDate = parseBackendDate(order?.expiryTime ?? "");
  const deadlineStr = deadlineDate
    ? deadlineDate.toISOString()
    : new Date(Date.now() + 900000).toISOString();

  const updatedAtDate = parseBackendDate(order?.updatedAt || order?.createdAt || "");
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
    // Reason is passed from modal but intentionally omitted from API payload
    // because the backend UpdateOrderMatch struct does not support it.
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

    // If 2FA is enabled, gate behind TOTP first, then send email OTP
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
            reviewerName: user?.username || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Anonymous user",
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
        <div className="flex flex-col justify-center items-center h-full min-h-[500px] gap-4">
          <Loader color="yellow" size="lg" />
          <p className="text-white/40 text-sm">Loading order...</p>
        </div>
      </P2PLayout>
    );
  }

  if (!user?.id) {
    return (
      <P2PLayout>
        <div className="flex flex-col justify-center items-center h-full min-h-[400px] gap-4 text-center">
          <p className="text-white/60 text-sm">
            We couldn&apos;t load your account details. Your trade actions and
            chat need your session identity.
          </p>
          <Button
            className="mt-2"
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
        <div className="flex flex-col items-center justify-center py-20 text-white/50">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-white/70">Order not found.</div>
          <Button className="mt-4" onClick={() => router.push("/trades/p2p/orders")}>View All Orders</Button>
        </div>
      </P2PLayout>
    );
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pending Payment", color: "text-red-400 bg-red-400/10 border-red-400/20" },
    PAID: { label: "Payment Confirmed", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    PARTIALLY_COMPLETED: { label: "Payment Confirmed", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    RELEASED: { label: "Released", color: "text-green-400 bg-green-400/10 border-green-400/20" },
    COMPLETED: { label: "Completed", color: "text-green-400 bg-green-400/10 border-green-400/20" },
    CANCELLED: { label: "Cancelled", color: "text-red-400 bg-red-400/10 border-red-400/20" },
    DISPUTED: { label: "Disputed", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  };

  const statusInfo = statusConfig[status.toUpperCase()] ?? { label: status, color: "text-white/50 bg-white/5 border-white/10" };

  return (
    <P2PLayout>
      <div className="relative min-h-[calc(100vh-100px)] w-full max-w-[1400px] mx-auto py-6 max-[1150px]:py-4 px-4 font-sans max-[1150px]:pb-[90px] page-enter overflow-x-clip">
        
        {/* Background */}
        <div className="absolute top-0 left-10 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-slate-600/5 rounded-full blur-[140px] opacity-30 pointer-events-none"></div>

        <div className="relative z-10 w-full h-full">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => router.push("/trades/p2p/orders")} 
              className="group flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md"
            >
              <span className="text-white/70 group-hover:text-white group-hover:-translate-x-0.5 transition-transform">←</span>
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
              <span className="text-white text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap">Order <span className="font-mono text-white/50">#{orderId.slice(-8).toUpperCase()}</span></span>
              <span className={`shrink-0 whitespace-nowrap text-xs font-bold px-3 py-1 rounded-full border shadow-sm backdrop-blur-md ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Main split layout */}
        <div className="flex flex-col min-[1150px]:flex-row gap-6 min-[1150px]:h-[calc(100vh-220px)] min-h-[600px] max-[1150px]:min-h-0">
          {/* LEFT: Order Details Panel */}
          <div className="min-w-0 min-[1150px]:w-[50%] xl:w-[45%] overflow-y-auto custom-scrollbar pr-0 min-[1150px]:pr-2 pb-10 max-[1150px]:pb-0">
            <div className="bg-elevated/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl max-[1150px]:rounded-xl p-6 min-[1150px]:p-8 max-[1150px]:p-4 flex flex-col relative overflow-hidden">
              
              {/* Subtle inner highlight for 3D glass effect */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              
              {/* Step indicator */}
              <div className="mb-8 relative">
                <div className="flex items-center justify-between relative z-10">
                  {["Created", "Payment", "Released"].map((step, i) => {
                    const stepNum = i + 1;
                    const isReleased = normalizedStatus === "RELEASED" || normalizedStatus === "COMPLETED";
                    const currentStep = normalizedStatus === "PENDING" ? 2 : normalizedStatus === "PAID" ? 2 : isReleased ? 3 : 1;
                    const done = stepNum < currentStep || (isReleased && stepNum === 3);
                    const active = stepNum === currentStep && !done;
                    return (
                      <div key={step} className="flex flex-col items-center gap-2 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                          ${active ? "border-2 border-red-400 bg-red-400/20 text-red-400" 
                            : done ? "border-2 border-buy bg-buy/20 text-buy" 
                            : "border border-white/10 bg-white/5 text-white/30"}`}
                        >
                          {done ? "✓" : stepNum}
                        </div>
                        <span className={`text-xs font-semibold tracking-wide ${active ? "text-white" : done ? "text-buy" : "text-white/30"}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Connecting Lines */}
                <div className="absolute top-[16px] left-8 right-8 h-[2px] bg-white/5 -z-0">
                   <div className="h-full bg-gradient-to-r from-[#0ECB81] to-red-400 transition-all duration-1000" 
                        style={{ width: normalizedStatus === 'PENDING' ? '50%' : normalizedStatus === 'PAID' ? '75%' : '100%' }}></div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-black/20 rounded-xl p-5 border border-white/5 mb-6">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/40"></div>
                  Order Details
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  {[
                    { label: isBuyer ? "You Receive" : "Locked in Escrow", value: <span className="font-bold text-white text-base">{quantity.toLocaleString()} <span className="text-white/60 text-sm">{asset}</span></span> },
                    { label: isBuyer ? "You Pay" : "You Receive", value: <span className="font-bold text-buy text-base drop-shadow-[0_0_8px_rgba(14,203,129,0.4)]">{fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-buy/60 text-sm">{fiat}</span></span> },
                    { label: "Price", value: `${price.toLocaleString()} ${fiat}/${asset}` },
                    { label: "Counterparty", value: <span className="text-white/90 font-medium">{counterpartyName || "—"}</span> },
                    { label: "Order Time", value: <span className="text-white/70">{parseBackendDate(order.createdAt ?? "")?.toLocaleString() ?? "—"}</span> },
                  ].map((item, idx) => (
                    <div key={idx} className="flex min-w-0 flex-col gap-1">
                      <div className="text-white/40 text-xs">{item.label}</div>
                      <div className="min-w-0 break-words text-white/90">{item.value}</div>
                    </div>
                  ))}
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
                  onDisputeOpen={() => setDisputeOpen(true)}
                />
              )}

              {normalizedStatus === "PENDING" && isSeller && (
                <SellerPendingPanel 
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
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center mt-6">
                  <div className="text-green-400 font-bold text-lg mb-1">Order Completed</div>
                  <p className="text-white/60 text-sm">Crypto was successfully released from escrow.</p>
                </div>
              )}

              {normalizedStatus === "CANCELLED" && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center mt-6">
                  <div className="text-red-400 font-bold text-lg mb-1">Order Cancelled</div>
                  <p className="text-white/60 text-sm">This order was cancelled. No assets were exchanged.</p>
                </div>
              )}

              {normalizedStatus === "DISPUTED" && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 text-center mt-6">
                  <div className="text-orange-400 font-bold text-lg mb-1">Order under Dispute</div>
                  <p className="text-white/60 text-sm">Our support team is reviewing this transaction. Please monitor your email.</p>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT: Chat */}
          <div className="flex-1 min-w-0 max-[1150px]:min-h-[500px]">
            {order?.chatId ? (
              <ChatWindow chatId={order.chatId} currentUserId={currentUserId} />
            ) : (
              <div className="flex justify-center items-center h-full bg-elevated rounded-xl border border-white/5">
                <span className="text-white/40 text-sm">Chat is not available for this order</span>
              </div>
            )}
          </div>
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

      {/* Payment Confirmation Modal */}
      <Modal
        opened={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Confirm Payment Sent"
        centered
        classNames={{
          content: "bg-elevated border border-white/10 backdrop-blur-xl",
          header: "bg-elevated border-b border-white/5",
          title: "text-white font-bold text-lg",
          close: "text-white/50 hover:text-white",
        }}
      >
        <div className="flex flex-col gap-5 pt-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-sm">
            <div className="text-white/50 text-xs uppercase tracking-wider mb-2">You are confirming you sent:</div>
            <div className="text-white font-bold text-2xl">{fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-white/60 text-lg">{fiat}</span></div>
            <div className="text-white/50 mt-1 text-xs">via {paymentMethod?.data?.bankName ?? paymentMethod?.method ?? "transfer"}</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <span>Only confirm if you have <strong>ACTUALLY</strong> sent the payment. False confirmations may lead to account restrictions.</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setPaymentModalOpen(false)}
              className="flex-1 h-11 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >Cancel</button>
            <button 
              onClick={handleConfirmPayment}
              disabled={isUpdating}
              className="flex-1 h-11 rounded-xl bg-buy hover:bg-emerald-500 text-white font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >{isUpdating ? "Confirming..." : "Yes, I've Paid"}</button>
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
