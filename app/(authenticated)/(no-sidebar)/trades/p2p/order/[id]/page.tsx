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

  const status: string = order?.status ?? "";
  const adType: string = (order?.type ?? "").toUpperCase();
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

  const normalizedStatus =
    status.toUpperCase() === "PARTIALLY_COMPLETED" || status.toUpperCase() === "FULFILLED"
      ? "PAID"
      : status.toUpperCase();

  const asset = order?.asset ?? originalOrder?.asset ?? "";
  const fiat = (order?.fiatCurrency ?? originalOrder?.currency ?? originalOrder?.fiat ?? "USD").toUpperCase();
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
    ? order?.matcherName || order?.buyerName || order?.sellerName || "Trader"
    : order?.advertiserName || order?.sellerName || order?.buyerName || "Advertiser";

  const existingFeedbackSubmitted = !!order?.review || hasReviewForOrder(orderId) || feedbackSubmitted;

  const parseBackendDate = (dateStr: string): Date | null => {
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
        Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, millis) - offset * 60000
      );
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

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
        <div className="flex flex-col items-center justify-center py-16 text-white/50 bg-[#181a20] border border-white/[0.07] rounded-xl max-w-md mx-auto my-6 p-6 text-center">
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

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl mx-auto py-6 max-[1150px]:py-4 px-4 max-[1150px]:pb-[90px] page-enter">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/trades/p2p/orders")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/60 hover:text-white transition-colors text-xs font-medium"
            >
              <MdArrowBack size={14} />
              <span>Orders</span>
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-white text-base font-semibold">
                Order <span className="font-mono text-white/50">#{orderId.slice(-8).toUpperCase()}</span>
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Main split layout */}
        <div className="flex flex-col min-[1150px]:flex-row gap-5 min-[1150px]:h-[calc(100vh-210px)] min-h-[600px] max-[1150px]:min-h-0">
          {/* LEFT: Order Details Panel */}
          <div className="min-[1150px]:w-[50%] xl:w-[45%] overflow-y-auto custom-scrollbar pr-0 min-[1150px]:pr-1 pb-10 max-[1150px]:pb-0">
            <div className="bg-[#181a20] border border-white/[0.07] rounded-xl p-5 min-[1150px]:p-6 flex flex-col">
              {/* Step indicator */}
              <div className="mb-6 relative">
                <div className="flex items-center justify-between relative z-10">
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
                      <div key={step} className="flex flex-col items-center gap-1.5 bg-[#181a20] px-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                            active
                              ? "border border-primary bg-primary/10 text-primary"
                              : done
                              ? "border border-buy bg-buy/10 text-buy"
                              : "border border-white/10 bg-white/[0.02] text-white/30"
                          }`}
                        >
                          {done ? <MdCheck size={14} /> : stepNum}
                        </div>
                        <span
                          className={`text-[11px] font-medium tracking-tight ${
                            active ? "text-white" : done ? "text-buy" : "text-white/35"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="absolute top-[14px] left-10 right-10 h-[1px] bg-white/[0.08] -z-0">
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
              <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.05] mb-4">
                <div className="text-white/35 text-[10px] uppercase tracking-wider mb-3 font-semibold">
                  Transaction Summary
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-white/40">{isBuyer ? "You Receive" : "Locked in Escrow"}</div>
                    <div className="font-semibold text-white font-mono text-sm">
                      {quantity.toLocaleString()} <span className="text-white/50 text-xs font-sans">{asset}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-white/40">{isBuyer ? "You Pay" : "You Receive"}</div>
                    <div className="font-semibold text-buy font-mono text-sm">
                      {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                      <span className="text-buy/60 text-xs font-sans">{fiat}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-white/40">Unit Price</div>
                    <div className="text-white font-mono">
                      {price.toLocaleString()} {fiat}/{asset}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-white/40">Counterparty</div>
                    <div className="text-white/90 font-medium truncate">{counterpartyName || "—"}</div>
                  </div>
                  <div className="flex flex-col gap-0.5 col-span-2">
                    <div className="text-white/40">Order Timestamp</div>
                    <div className="text-white/70">
                      {parseBackendDate(order.createdAt ?? "")?.toLocaleString() ?? "—"}
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
            <div className="text-white/40 uppercase tracking-wider text-[10px] mb-1.5">You are confirming payment of:</div>
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
