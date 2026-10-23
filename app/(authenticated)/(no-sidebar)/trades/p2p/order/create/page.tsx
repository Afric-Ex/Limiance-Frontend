"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { OrderConfirmationModal } from "@/src/components/p2p/order-confirmation-modal";
import { Button, NumberInput, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import { useMatchOrder, usePaymentMethods } from "@/src/hooks/p2p/use-p2p";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import toast from "react-hot-toast";
import { MdVerified, MdOutlineArrowBack, MdInfoOutline } from "react-icons/md";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PCreateOrderSkeleton } from "@/src/components/skeletons/p2p";

function PreOrderScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adId = searchParams.get("adId");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState<number | "">("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const { data: adData, isLoading: adLoading } = useQuery({
    queryKey: p2pKey.orderById(adId ?? ""),
    queryFn: () => p2p.getOrderById(adId!),
    enabled: !!adId,
  });

  const ad = (adData?.data as any)?.data;
  const adType = String(ad?.type ?? "").toUpperCase();
  const userAction = adType === "SELL" ? "Buy" : "Sell";
  const isBuying = userAction === "Buy";

  const { data: pmData, isLoading: pmLoading } = usePaymentMethods({
    enabled: !!ad && !isBuying,
  });

  const { mutate: matchOrder, isPending: isCreating } = useMatchOrder();

  const paymentMethods: any[] = pmData?.data?.data ?? [];
  const sellerPaymentMethods: any[] = Array.isArray(ad?.paymentMethod) ? ad.paymentMethod : [];

  const advertiserName = ad
    ? [ad.advertiser?.firstName, ad.advertiser?.lastName].filter(Boolean).join(" ") || "Merchant"
    : "";

  const price = parseFloat(String(ad?.price ?? 0));
  const minQty = parseFloat(String(ad?.minQuantity ?? 0));
  const maxQty = parseFloat(String(ad?.maxQuantity ?? 0));
  const available = parseFloat(String(ad?.availableQuantity ?? 0));
  const numAmount = Number(amount) || 0;

  const cryptoAmount = userAction === "Buy" ? numAmount / (price || 1) : numAmount;
  const fiatAmount = userAction === "Buy" ? numAmount : numAmount * price;

  const effectivePaymentId = isBuying
    ? sellerPaymentMethods.some((pm) => pm.id === selectedPaymentId)
      ? selectedPaymentId
      : sellerPaymentMethods[0]?.id ?? null
    : paymentMethods.some((pm) => pm.id === selectedPaymentId)
    ? selectedPaymentId
    : null;

  const { coins: portfolio, isLoading: balanceLoading } = usePortfolioWs({ coins: true });

  const userCoin = portfolio?.find(
    (p: any) => p.symbol.toUpperCase() === (ad?.asset ?? "").toUpperCase()
  );
  const fundingBalance =
    userAction === "Sell" ? parseFloat(userCoin?.fundingBalance ?? "0") || 0 : 0;

  let validationError = "";
  if (numAmount > 0) {
    if (cryptoAmount < minQty)
      validationError = `Minimum order is ${minQty.toLocaleString()} ${ad?.asset?.toUpperCase()}`;
    else if (cryptoAmount > maxQty)
      validationError = `Maximum order is ${maxQty.toLocaleString()} ${ad?.asset?.toUpperCase()}`;
    else if (cryptoAmount > available)
      validationError = `Only ${available.toLocaleString()} ${ad?.asset?.toUpperCase()} available`;
    else if (userAction === "Sell" && cryptoAmount > fundingBalance)
      validationError = `Insufficient funding balance (Available: ${fundingBalance} ${ad?.asset?.toUpperCase()})`;
  }

  const canProceed = numAmount > 0 && !validationError && !!effectivePaymentId;

  const handleConfirm = () => {
    if (!adId || !effectivePaymentId) return;
    matchOrder(
      { orderId: adId, paymentMethodId: effectivePaymentId, quantity: cryptoAmount },
      {
        onSuccess: (res: any) => {
          const matchId =
            res?.data?.orderMatchId ||
            res?.data?.data?.id ||
            res?.data?.id ||
            res?.id ||
            res?.data?.data?._id ||
            res?.data?._id;
          if (matchId) {
            toast.success("Order created successfully!");
            router.push(`/trades/p2p/order/${matchId}`);
          } else {
            toast.success("Order created successfully!");
            router.push(`/trades/p2p`);
          }
        },
      }
    );
  };

  if (adLoading || !adId) {
    return (
      <P2PLayout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <Loader color="blue" size="md" />
        </div>
      </P2PLayout>
    );
  }

  if (!ad) {
    return (
      <P2PLayout>
        <div className="flex flex-col items-center justify-center py-20 text-white/50 bg-[#181a20] border border-white/[0.07] rounded-xl max-w-xl mx-auto my-6 p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 mb-3">
            <MdInfoOutline size={22} />
          </div>
          <div className="text-white/80 font-medium text-sm mb-1">Ad Not Found</div>
          <p className="text-white/40 text-xs mb-4">This listing has expired, fulfilled, or is no longer available.</p>
          <Button
            className="!bg-primary hover:!bg-primary/90 !text-white !h-8 !text-xs !font-semibold !rounded-lg"
            onClick={() => router.push("/trades/p2p")}
          >
            Back to Marketplace
          </Button>
        </div>
      </P2PLayout>
    );
  }

  return (
    <P2PLayout>
      <div className="w-full max-w-5xl mx-auto py-6 max-[1150px]:py-4 max-[1150px]:pb-[90px] page-enter">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push("/trades/p2p")}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07]"
          >
            <MdOutlineArrowBack size={14} />
            <span>Marketplace</span>
          </button>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            {userAction} {ad.asset.toUpperCase()}{" "}
            <span className="text-white/40 text-sm font-normal">from {advertiserName}</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 min-[1150px]:grid-cols-[1fr_380px] gap-5">
          {/* Left: Ad Details */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#181a20] border border-white/[0.07] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {advertiserName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{advertiserName}</span>
                    {ad.advertiser?.verified && <MdVerified className="text-buy text-sm" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
                    <span>{Math.floor(Number(ad.advertiser?.totalOrdersCompleted ?? 0))} Orders</span>
                    <span>·</span>
                    <span className="text-buy font-medium">
                      {parseFloat(ad.advertiser?.completionPercentage ?? "0").toFixed(1)}% Completion
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg">
                  <div className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">Price</div>
                  <div className="text-base font-bold text-white font-mono tabular-nums">
                    {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{" "}
                    <span className="text-xs font-normal text-white/50">{ad.fiat.toUpperCase()}</span>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg">
                  <div className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">
                    {userAction === "Sell" ? "Buyer Target" : "Available"}
                  </div>
                  <div className="text-base font-bold text-white font-mono tabular-nums">
                    {available.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-white/50">{ad.asset.toUpperCase()}</span>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg">
                  <div className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">Order Limit</div>
                  <div className="text-xs font-medium text-white font-mono tabular-nums">
                    {minQty.toLocaleString()} – {maxQty.toLocaleString()}{" "}
                    <span className="text-white/50">
                      {userAction === "Sell" ? ad.asset.toUpperCase() : ad.fiat.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-lg">
                  <div className="text-white/35 text-[10px] uppercase tracking-wider mb-0.5">Payment Window</div>
                  <div className="text-xs font-medium text-white">{ad.paymentDuration ?? 15} Minutes</div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {ad.remark && (
              <div className="bg-[#181a20] border border-white/[0.07] rounded-xl p-4">
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Counterparty Remarks
                </div>
                <div className="text-white/75 text-xs whitespace-pre-line leading-relaxed">{ad.remark}</div>
              </div>
            )}

            {/* Accepted payment methods */}
            {ad.paymentMethod?.length > 0 && (
              <div className="bg-[#181a20] border border-white/[0.07] rounded-xl p-4">
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2.5">
                  Supported Payment Options
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ad.paymentMethod.map((pm: any) => (
                    <span
                      key={pm.id}
                      className="text-xs bg-white/[0.05] border border-white/[0.07] text-white/70 px-2.5 py-1 rounded font-medium"
                    >
                      {pm.method}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Form */}
          <div>
            <div className="bg-[#181a20] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-4 sticky top-6">
              <div
                className={`text-center text-xs font-semibold py-2 px-3 rounded-lg border ${
                  userAction === "Buy"
                    ? "bg-buy/10 border-buy/20 text-buy"
                    : "bg-[#F6465D]/10 border-[#F6465D]/20 text-[#F6465D]"
                }`}
              >
                You are {userAction === "Buy" ? "Buying" : "Selling"} {ad.asset.toUpperCase()}
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block font-medium">
                  {userAction === "Buy" ? "I Want to Spend" : "I Want to Sell (Crypto Quantity)"}
                </label>
                <NumberInput
                  placeholder={`Enter amount in ${userAction === "Buy" ? ad.fiat.toUpperCase() : ad.asset.toUpperCase()}`}
                  value={amount}
                  onChange={(val) => setAmount(val === "" ? "" : Number(val))}
                  rightSection={
                    <span className="text-white/40 pr-3 font-medium text-xs font-mono">
                      {userAction === "Buy" ? ad.fiat.toUpperCase() : ad.asset.toUpperCase()}
                    </span>
                  }
                  classNames={{
                    input:
                      "!bg-white/[0.04] !border-white/[0.08] focus:!border-primary/50 !text-white !text-sm !h-11 !rounded-lg !font-mono",
                  }}
                  hideControls
                />
                {validationError && <p className="text-[#F6465D] text-xs mt-1.5">{validationError}</p>}
                {userAction === "Sell" && (
                  <div className="flex justify-between items-center mt-1.5 px-0.5 text-xs">
                    <span className="text-white/35">Available Funding Balance</span>
                    <span className="text-white/70 font-mono">
                      {balanceLoading
                        ? "Loading..."
                        : userCoin
                        ? `${fundingBalance.toFixed(8).replace(/\.?0+$/, "")} ${ad.asset.toUpperCase()}`
                        : "—"}
                    </span>
                  </div>
                )}
              </div>

              {/* You receive */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block font-medium">I Will Receive</label>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3.5 h-11 flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold text-sm">
                    {(userAction === "Buy" ? cryptoAmount : fiatAmount).toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </span>
                  <span className="text-white/40 font-sans font-medium">
                    {userAction === "Buy" ? ad.asset.toUpperCase() : ad.fiat.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Payment Method Select */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block font-medium">
                  {isBuying ? "Payment Details (Counterparty)" : "Receive Via (Your Saved Methods)"}
                </label>
                {isBuying ? (
                  sellerPaymentMethods.length === 0 ? (
                    <div className="bg-[#F6465D]/10 border border-[#F6465D]/20 rounded-lg p-3 text-[#F6465D] text-xs">
                      No active payment method on this advertisement. Please select another listing.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {sellerPaymentMethods.map((pm) => (
                        <label
                          key={pm.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            effectivePaymentId === pm.id
                              ? "border-primary/50 bg-primary/[0.06]"
                              : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={pm.id}
                            checked={effectivePaymentId === pm.id}
                            onChange={() => setSelectedPaymentId(pm.id)}
                            className="accent-primary w-3.5 h-3.5"
                          />
                          <div className="min-w-0">
                            <div className="text-white text-xs font-medium">
                              {pm.data?.bankName ?? pm.method}
                            </div>
                            {pm.data?.accountName && (
                              <div className="text-white/50 text-[11px] truncate">
                                {pm.data.accountName}
                              </div>
                            )}
                            {pm.data?.accountNumber && (
                              <div className="text-white/35 font-mono text-[11px]">
                                {pm.data.accountNumber}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )
                ) : pmLoading ? (
                  <div className="text-white/40 text-xs">Loading payment methods...</div>
                ) : paymentMethods.length === 0 ? (
                  <div
                    onClick={() => router.push("/account/payment-methods")}
                    className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-primary text-xs flex items-center gap-2.5 cursor-pointer hover:bg-primary/15 transition-colors"
                  >
                    <MdInfoOutline size={16} className="shrink-0" />
                    <span>
                      No payment methods saved. <span className="underline font-medium">Add one in account settings.</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {paymentMethods.map((pm) => (
                      <label
                        key={pm.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          effectivePaymentId === pm.id
                            ? "border-primary/50 bg-primary/[0.06]"
                            : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm.id}
                          checked={effectivePaymentId === pm.id}
                          onChange={() => setSelectedPaymentId(pm.id)}
                          className="accent-primary w-3.5 h-3.5"
                        />
                        <div className="min-w-0">
                          <div className="text-white text-xs font-medium">
                            {pm.data?.bankName ?? pm.method}
                          </div>
                          {pm.data?.accountNumber && (
                            <div className="text-white/40 text-[11px]">
                              {pm.data.accountName} · {pm.data.accountNumber}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className={`w-full !font-semibold !text-xs !h-11 !rounded-lg text-white transition-colors ${
                  userAction === "Buy" ? "!bg-buy hover:!bg-buy/90" : "!bg-[#F6465D] hover:!bg-[#F6465D]/90"
                }`}
                disabled={!canProceed}
                onClick={() => setIsModalOpen(true)}
              >
                {userAction} {ad.asset.toUpperCase()}
              </Button>

              <p className="text-white/30 text-[11px] text-center leading-normal">
                Cryptocurrency is held in platform escrow until payment verification is confirmed by both parties.
              </p>
            </div>
          </div>
        </div>
      </div>

      <OrderConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        type={userAction.toUpperCase() as "BUY" | "SELL"}
        asset={ad.asset}
        fiat={ad.fiat}
        cryptoAmount={userAction === "Buy" ? cryptoAmount : numAmount}
        fiatAmount={userAction === "Buy" ? numAmount : fiatAmount}
        price={price}
        isLoading={isCreating}
      />
    </P2PLayout>
  );
}

export default function PreOrderScreen() {
  return (
    <PageSuspense fallback={<P2PCreateOrderSkeleton />}>
      <PreOrderScreenContent />
    </PageSuspense>
  );
}
