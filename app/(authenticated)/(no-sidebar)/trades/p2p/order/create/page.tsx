"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { OrderConfirmationModal } from "@/src/components/p2p/order-confirmation-modal";
import { Button, NumberInput, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import { asset, assetKeys } from "@/src/services/asset";
import { useMatchOrder, usePaymentMethods } from "@/src/hooks/p2p/use-p2p";
import toast from "react-hot-toast";
import { Suspense } from "react";

function PreOrderScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adId = searchParams.get("adId");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState<number | "">("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  // Fetch the specific ad
  const { data: adData, isLoading: adLoading } = useQuery({
    queryKey: p2pKey.orderById(adId ?? ""),
    queryFn: () => p2p.getOrderById(adId!),
    enabled: !!adId,
  });

  // Fetch user's saved payment methods
  const { data: pmData, isLoading: pmLoading } = usePaymentMethods();

  const { mutate: matchOrder, isPending: isCreating } = useMatchOrder();

  const ad = (adData?.data as any)?.data;
  const paymentMethods: any[] = pmData?.data?.data ?? [];

  const advertiserName = ad
    ? [ad.advertiser?.firstName, ad.advertiser?.lastName].filter(Boolean).join(" ")
    : "";

  // The user's action is opposite to the ad type:
  // If the ad is SELL → user is BUYING. If ad is BUY → user is SELLING.
  const userAction = ad?.type === "Sell" ? "Buy" : "Sell";

  const price = parseFloat(String(ad?.price ?? 0));
  const minQty = parseFloat(String(ad?.minQuantity ?? 0));
  const maxQty = parseFloat(String(ad?.maxQuantity ?? 0));
  const available = parseFloat(String(ad?.availableQuantity ?? 0));
  const numAmount = Number(amount) || 0;

  const cryptoAmount = userAction === "Buy" ? numAmount / price : numAmount;
  const fiatAmount = userAction === "Buy" ? numAmount : numAmount * price;

  // Fetch portfolio to get the per-asset funding balance (supports fractional amounts)
  const { data: portfolio, isLoading: balanceLoading } = useQuery({
    queryKey: assetKeys.portfolio(),
    queryFn: asset.fetchPortfolio,
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: 30_000,
    enabled: userAction === "Sell",
  });

  const fundingBalance = userAction === "Sell"
    ? parseFloat(
        portfolio?.find((p: any) => p.symbol.toUpperCase() === (ad?.asset ?? "").toUpperCase())?.fundingBalance ?? "0"
      )
    : 0;

  // Validation
  let validationError = "";
  if (numAmount > 0) {
    if (cryptoAmount < minQty) validationError = `Minimum order is ${minQty.toLocaleString()} ${ad?.asset?.toUpperCase()}`;
    else if (cryptoAmount > maxQty) validationError = `Maximum order is ${maxQty.toLocaleString()} ${ad?.asset?.toUpperCase()}`;
    else if (cryptoAmount > available) validationError = `Only ${available.toLocaleString()} ${ad?.asset?.toUpperCase()} available`;
    else if (userAction === "Sell" && cryptoAmount > fundingBalance) validationError = `Insufficient funding balance (Available: ${fundingBalance} ${ad?.asset?.toUpperCase()})`;
  }

  const canProceed = numAmount > 0 && !validationError && !!selectedPaymentId;

  const handleConfirm = () => {
    if (!adId || !selectedPaymentId) return;
    matchOrder(
      { orderId: adId, paymentMethodId: selectedPaymentId, quantity: cryptoAmount },
      {
        onSuccess: (res: any) => {
          const matchId = res?.data?.orderMatchId || res?.data?.data?.id || res?.data?.id || res?.id || res?.data?.data?._id || res?.data?._id;
          if (matchId) {
            toast.success("Order created!");
            router.push(`/trades/p2p/order/${matchId}`);
          } else {
            console.log("Order response missing ID:", res);
            toast.success("Order created!");
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
          <Loader color="blue" size="lg" />
        </div>
      </P2PLayout>
    );
  }

  if (!ad) {
    return (
      <P2PLayout>
        <div className="flex flex-col items-center justify-center py-20 text-white/50">
          <div className="text-4xl mb-4">⚠️</div>
          <div>Ad not found or no longer available.</div>
          <Button className="mt-4" onClick={() => router.push("/trades/p2p")}>Back to Marketplace</Button>
        </div>
      </P2PLayout>
    );
  }

  return (
    <P2PLayout>
      <div className="w-full max-w-4xl mx-auto py-6 max-[1150px]:py-4 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/trades/p2p")} className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">
            {userAction} {ad.asset.toUpperCase()}
            <span className="text-white/40 text-base font-normal ml-2">from {advertiserName}</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 min-[1150px]:grid-cols-[1fr_380px] gap-6 max-[1150px]:gap-4 max-[1150px]:flex max-[1150px]:flex-col">
          {/* Left: Ad Details */}
          <div className="flex flex-col gap-4">
            {/* Advertiser Card */}
            <div className="bg-[#111] border border-white/[0.05] shadow-xl rounded-2xl max-[1150px]:rounded-xl p-6 max-[1150px]:p-4">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white ${ad.advertiser?.verified ? "ring-2 ring-blue-500 bg-blue-500/20" : "bg-white/10"}`}>
                  {advertiserName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-semibold">{advertiserName}</span>
                    {ad.advertiser?.verified && <span className="text-blue-400 text-xs">✓ Verified</span>}
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-white/50">
                    <span className="bg-white/5 px-2 py-0.5 rounded">{Math.floor(Number(ad.advertiser?.totalOrdersCompleted ?? 0))} orders</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded">{parseFloat(ad.advertiser?.completionPercentage ?? "0").toFixed(1)}% completion</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl">
                  <div className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Price</div>
                  <div className="text-white font-bold text-xl">{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} <span className="text-sm font-normal text-white/60">{ad.fiat.toUpperCase()}</span></div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl">
                  <div className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">
                    {userAction === "Sell" ? "Buyer Wants" : "Available"}
                  </div>
                  <div className="text-white font-bold text-xl">{available.toLocaleString()} <span className="text-sm font-normal text-white/60">{ad.asset.toUpperCase()}</span></div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl">
                  <div className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Order Limit</div>
                  <div className="text-white font-medium">
                    {minQty.toLocaleString()} – {maxQty.toLocaleString()}{" "}
                    <span className="text-sm text-white/60">
                      {userAction === "Sell" ? ad.asset.toUpperCase() : ad.fiat.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl">
                  <div className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Payment Window</div>
                  <div className="text-white font-medium">{ad.paymentDuration ?? 15} Minutes</div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {ad.remark && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <div className="text-white/60 text-sm font-medium mb-2">Advertiser's Remarks</div>
                <div className="text-white/80 text-sm whitespace-pre-line leading-relaxed">{ad.remark}</div>
              </div>
            )}

            {/* Ad's accepted payment methods */}
            {ad.paymentMethod?.length > 0 && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <div className="text-white/60 text-sm font-medium mb-3">Accepted Payment Methods</div>
                <div className="flex flex-wrap gap-2">
                  {ad.paymentMethod.map((pm: any) => (
                    <span key={pm.id} className="text-sm bg-white/10 text-white/80 px-3 py-1 rounded-full">
                      {pm.method}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Form */}
          <div>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 max-[1150px]:p-4 flex flex-col gap-5 max-[1150px]:gap-4 sticky top-6">
              <div className={`text-center text-sm font-semibold py-3 px-4 rounded-xl border ${userAction === "Buy" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                You are {userAction === "Buy" ? "Buying" : "Selling"} {ad.asset.toUpperCase()}
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-white/60 text-sm mb-2 block font-medium">
                  {userAction === "Buy" ? "I want to spend" : "I want to sell (amount in crypto)"}
                </label>
                <NumberInput
                  placeholder={`Enter amount in ${userAction === "Buy" ? ad.fiat.toUpperCase() : ad.asset.toUpperCase()}`}
                  value={amount}
                  onChange={(val) => setAmount(val === "" ? "" : Number(val))}
                  rightSection={<span className="text-white/50 pr-4 font-medium text-sm">{userAction === "Buy" ? ad.fiat.toUpperCase() : ad.asset.toUpperCase()}</span>}
                  classNames={{
                    input: `bg-black/40 border-${validationError ? "red-500" : "white/10"} text-white text-lg h-14 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all`
                  }}
                  hideControls
                  min={minQty}
                  max={maxQty}
                />
                {validationError && (
                  <p className="text-red-400 text-xs mt-1.5">{validationError}</p>
                )}
                {userAction === "Sell" && (
                  <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-white/40 text-xs">Your funding balance</span>
                    <span className="text-white/70 text-xs font-medium">
                      {balanceLoading
                        ? "Loading..."
                        : `${fundingBalance.toFixed(8).replace(/\.?0+$/, "")} ${ad.asset.toUpperCase()}`
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* You receive */}
              <div>
                <label className="text-white/60 text-sm mb-2 block font-medium">I will receive</label>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 h-14 flex items-center justify-between">
                  <span className="text-white text-xl font-medium">
                    {(userAction === "Buy" ? cryptoAmount : fiatAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </span>
                  <span className="text-white/50 font-medium text-sm">{userAction === "Buy" ? ad.asset.toUpperCase() : ad.fiat.toUpperCase()}</span>
                </div>
              </div>

              {/* Payment Method Select */}
              <div>
                <label className="text-white/60 text-sm mb-2 block font-medium">Pay with (your saved methods)</label>
                {pmLoading ? (
                  <div className="text-white/40 text-sm">Loading payment methods...</div>
                ) : paymentMethods.length === 0 ? (
                  <div 
                    onClick={() => router.push("/account/payment-methods")}
                    className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-400 text-sm flex items-center gap-3 cursor-pointer hover:bg-blue-500/20 transition-colors"
                  >
                    <span className="text-xl">ℹ️</span>
                    <span>No payment methods saved. <span className="underline font-medium">Click here to add one in your account settings.</span></span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {paymentMethods.map((pm) => (
                      <label key={pm.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedPaymentId === pm.id ? "border-blue-500/50 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm.id}
                          checked={selectedPaymentId === pm.id}
                          onChange={() => setSelectedPaymentId(pm.id)}
                          className="accent-blue-500 w-4 h-4"
                        />
                        <div>
                          <div className="text-white text-sm font-medium">{pm.data?.bankName ?? pm.method}</div>
                          {pm.data?.accountNumber && (
                            <div className="text-white/40 text-xs">{pm.data.accountName} · {pm.data.accountNumber}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <Button
                size="xl"
                radius="md"
                className={`w-full font-bold text-base shadow-lg ${userAction === "Buy" ? "bg-[#0ECB81] hover:bg-[#0ECB81]/90 shadow-[#0ECB81]/20" : "bg-[#F6465D] hover:bg-[#F6465D]/90 shadow-[#F6465D]/20"} text-white transition-all`}
                disabled={!canProceed}
                onClick={() => setIsModalOpen(true)}
              >
                {userAction} {ad.asset.toUpperCase()}
              </Button>

              <p className="text-white/30 text-xs text-center">
                By proceeding you agree to P2P trading terms. Only send payment after order is confirmed.
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
    <Suspense fallback={
      <P2PLayout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <Loader color="blue" size="lg" />
        </div>
      </P2PLayout>
    }>
      <PreOrderScreenContent />
    </Suspense>
  );
}
