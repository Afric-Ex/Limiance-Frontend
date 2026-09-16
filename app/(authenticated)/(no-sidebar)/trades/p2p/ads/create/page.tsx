"use client";

import React, { useState } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { PaymentMethodManager } from "@/src/components/p2p/payment-method-manager";
import { Button, Select, NumberInput, Textarea, Checkbox, Tooltip, MultiSelect } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useCreateAd } from "@/src/hooks/p2p/use-p2p";
import { CreateOrder } from "@/src/types/p2p";
import { useMarketFeed } from "@/src/hooks/use-market-feed";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { MdInfoOutline } from "react-icons/md";
import { getBanksForFiat } from "@/src/lib/banks";
import { useAdvertiserInfo } from "@/src/hooks/p2p/use-p2p";
import { NonAdvertiserModal } from "@/src/components/p2p/non-advertiser-modal";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PCreateAdSkeleton } from "@/src/components/skeletons";

const FIAT_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  NGN: 1500,
  GBP: 0.78,
};

function CreateAdPageInner() {
  const router = useRouter();
  
  const { mutate: createAd, isPending: isCreating } = useCreateAd();

  // Advertiser guard
  const { data: advertiserData, isLoading: isCheckingAdvertiser } = useAdvertiserInfo();
  const isAdvertiser = !!advertiserData?.data?.data?.id;
  const [showNonAdvertiserModal, setShowNonAdvertiserModal] = React.useState(false);

  // Show modal as soon as we know the user is not an advertiser
  React.useEffect(() => {
    if (!isCheckingAdvertiser && !isAdvertiser) {
      setShowNonAdvertiserModal(true);
    }
  }, [isCheckingAdvertiser, isAdvertiser]);

  const [adMode, setAdMode] = useState<"BUY" | "SELL">("SELL");
  const [selectedAsset, setSelectedAsset] = useState("USDT");
  const [fiat, setFiat] = useState("NGN");
  const [priceType, setPriceType] = useState<"FLOATING" | "FIXED">("FIXED");
  const [price, setPrice] = useState<number | "">("");
  
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [minOrder, setMinOrder] = useState<number | "">("");
  const [maxOrder, setMaxOrder] = useState<number | "">("");

  const [paymentWindow, setPaymentWindow] = useState("15");
  const [remarks, setRemarks] = useState("");

  const [selectedMethodIds, setSelectedMethodIds] = useState<string[]>([]);
  const [isMethodManagerOpen, setIsMethodManagerOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Live market price from WebSocket — backend streams crypto/USDT pairs
  // For USDT itself, price is always 1. For others (BTC, ETH), we get the live USDT price.
  const wsPair = selectedAsset === "USDT" ? "BTC/USDT" : `${selectedAsset}/USDT`;
  const feed = useMarketFeed(wsPair);
  const currentMarketPrice = selectedAsset === "USDT" ? 1 : feed.price;

  // Real balance from funding account via WebSocket portfolio channel
  const { coins: portfolioCoins } = usePortfolioWs();

  const balanceArray = Array.isArray(portfolioCoins) ? portfolioCoins : [];
  const assetBalanceInfo = balanceArray.find((b: any) => 
    b.coin === selectedAsset || b.symbol === selectedAsset || b.asset === selectedAsset
  );
  const fundingBalance = assetBalanceInfo 
    ? parseFloat(assetBalanceInfo.fundingBalance || "0") 
    : 0;

  // Validation: for SELL ads, total amount can't exceed balance
  const isOverBalance = adMode === "SELL" && totalAmount !== "" && Number(totalAmount) > fundingBalance;

  const handleSubmit = () => {
    if (!price || !totalAmount || !minOrder || !maxOrder || selectedMethodIds.length === 0 || !agreed) return;
    if (isOverBalance) return;

    const payload: CreateOrder = {
      type: adMode === "BUY" ? "Buy" : "Sell",
      asset: selectedAsset,
      fiat: fiat,
      fixedPrice: String(price),
      paymentDuration: paymentWindow,
      minQuantity: String(minOrder),
      maxQuantity: String(maxOrder),
      quantity: String(totalAmount),
      paymentMethod: selectedMethodIds,
      remark: remarks,
      floatingPrice: priceType === "FLOATING",
      numberLinked: true,
      emailLinked: true,
      daysSinceAccountCreation: "30",
      completedOrders: "0",
      allCompletedOrders: "0",
      selectedCountry: "NG",
    };

    createAd(payload, {
      onSuccess: () => {
        router.push("/trades/p2p/my-ads");
      }
    });
  };

  return (
    <P2PLayout>
      {/* Advertiser guard modal */}
      <NonAdvertiserModal
        isOpen={showNonAdvertiserModal}
        onClose={() => {
          setShowNonAdvertiserModal(false);
          router.push("/trades/p2p");
        }}
      />

      {/* Loading state while checking advertiser status */}
      {isCheckingAdvertiser ? (
        <div className="w-full max-w-3xl mx-auto py-6 flex flex-col gap-6 animate-pulse">
          <div className="h-10 bg-white/10 rounded-xl w-1/2" />
          <div className="h-64 bg-white/5 border border-white/10 rounded-xl" />
          <div className="h-40 bg-white/5 border border-white/10 rounded-xl" />
        </div>
      ) : !isAdvertiser ? (
        <div className="w-full max-w-3xl mx-auto py-20 flex flex-col items-center gap-4 text-white/40">
          <p className="text-lg">You must be a registered advertiser to post ads.</p>
          <Button onClick={() => router.push("/trades/p2p/advertiser/register")} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
            Register as Advertiser
          </Button>
        </div>
      ) : (
      <div className="w-full max-w-3xl mx-auto py-6 flex flex-col gap-8">
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Post Ad</h1>
          {/* Buy/Sell Toggle */}
          <div className="flex bg-black/40 rounded-lg p-1">
            <button
              className={`px-8 py-2 rounded-md text-sm font-bold transition-colors ${
                adMode === "BUY" ? "bg-buy text-white" : "text-white/50 hover:text-white"
              }`}
              onClick={() => setAdMode("BUY")}
            >
              I want to Buy
            </button>
            <button
              className={`px-8 py-2 rounded-md text-sm font-bold transition-colors ${
                adMode === "SELL" ? "bg-[#F6465D] text-white" : "text-white/50 hover:text-white"
              }`}
              onClick={() => setAdMode("SELL")}
            >
              I want to Sell
            </button>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl p-8 flex flex-col gap-8">
          {/* Step 1: Asset & Fiat */}
          <div className="grid grid-cols-2 gap-6">
            <Select
              label="Asset"
              value={selectedAsset}
              onChange={(v) => setSelectedAsset(v || "USDT")}
              data={["USDT", "BTC", "ETH"]}
              classNames={{
                label: "text-white/70 mb-2 font-medium",
                input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all",
                dropdown: "bg-surface border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-xl",
                option: "hover:bg-white/10 data-[combobox-selected]:bg-buy/20 data-[combobox-selected]:text-buy rounded-lg mx-1 my-0.5 transition-colors"
              }}
            />
            <Select
              label="Fiat"
              value={fiat}
              onChange={(v) => setFiat(v || "NGN")}
              data={["USD", "EUR", "NGN", "GBP"]}
              classNames={{
                label: "text-white/70 mb-2 font-medium",
                input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all",
                dropdown: "bg-surface border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-xl",
                option: "hover:bg-white/10 data-[combobox-selected]:bg-buy/20 data-[combobox-selected]:text-buy rounded-lg mx-1 my-0.5 transition-colors"
              }}
            />
          </div>

          {/* Balance Info for SELL mode */}
          {adMode === "SELL" && (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
              <span className="text-sm text-white/60">
                Available {selectedAsset} Balance
              </span>
              <span className="text-sm font-mono font-semibold text-white">
                {fundingBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} {selectedAsset}
              </span>
            </div>
          )}

          <div className="w-full h-px bg-white/10" />

          {/* Step 2: Price Settings */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white/70 font-medium">Price Type</span>
              <div className="flex bg-black/40 rounded-lg p-0.5">
                <button
                  className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                    priceType === "FIXED" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  }`}
                  onClick={() => setPriceType("FIXED")}
                >
                  Fixed
                </button>
                <button
                  className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                    priceType === "FLOATING" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                  }`}
                  onClick={() => setPriceType("FLOATING")}
                >
                  Floating
                </button>
              </div>
            </div>
            
            <div className="flex gap-6 items-end">
              <NumberInput
                label={priceType === "FIXED" ? "Fixed Price" : "Floating Margin %"}
                value={price}
                onChange={(val) => setPrice(val === "" ? "" : Number(val))}
                decimalScale={priceType === "FIXED" ? 4 : 2}
                hideControls
                rightSection={<span className="text-white/50 pr-4">{priceType === "FIXED" ? fiat : "%"}</span>}
                classNames={{
                  label: "text-white/70 mb-2 font-medium",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all w-64"
                }}
              />
              <div className="text-sm text-white/50 pb-3">
                Market Price:{" "}
                <strong className="text-white">
                  {currentMarketPrice !== null 
                    ? (currentMarketPrice * (FIAT_RATES[fiat] || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) 
                    : "—"
                  } {fiat}
                </strong>
                {fiat !== "USD" && currentMarketPrice !== null && (
                  <span className="text-white/30 text-xs ml-1">(~{currentMarketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD)</span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Step 3: Trade Limits */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white/70 font-medium">Order Limits</span>
              <Tooltip 
                multiline 
                w={300}
                label="Min/Max Order sets the fiat range a buyer can trade per order. E.g. Min ₦5,000 and Max ₦500,000 means each trade must be within that range."
              >
                <span className="text-white/30 cursor-help"><MdInfoOutline size={16} /></span>
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <NumberInput
                label={`Total Trading Amount (${selectedAsset})`}
                description={adMode === "SELL" ? `Max: ${fundingBalance.toLocaleString()} ${selectedAsset}` : undefined}
                value={totalAmount}
                onChange={(val) => setTotalAmount(val === "" ? "" : Number(val))}
                hideControls
                error={isOverBalance ? `Exceeds your balance of ${fundingBalance.toLocaleString()} ${selectedAsset}` : undefined}
                rightSection={
                  adMode === "SELL" ? (
                    <button 
                      className="text-xs font-bold text-yellow-400 hover:text-yellow-300 pr-3"
                      onClick={() => setTotalAmount(fundingBalance)}
                    >
                      MAX
                    </button>
                  ) : (
                    <span className="text-white/50 pr-4">{selectedAsset}</span>
                  )
                }
                classNames={{
                  label: "text-white/70 mb-2 font-medium",
                  description: "text-white/30 text-xs",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all"
                }}
              />
              <div className="flex gap-3 items-end">
                <NumberInput
                label={`Min Order (${selectedAsset})`}
                value={minOrder}
                onChange={(val) => setMinOrder(val === "" ? "" : Number(val))}
                min={0}
                max={maxOrder === "" ? (totalAmount === "" ? undefined : Number(totalAmount)) : Number(maxOrder)}
                placeholder="0"
                classNames={{
                  label: "text-white/70 text-sm mb-1 font-medium",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all"
                }}
              />
              <div className="text-white/50 pt-8 hidden sm:block">—</div>
              <NumberInput
                label={`Max Order (${selectedAsset})`}
                value={maxOrder}
                onChange={(val) => setMaxOrder(val === "" ? "" : Number(val))}
                min={minOrder === "" ? 0 : Number(minOrder)}
                max={totalAmount === "" ? undefined : Number(totalAmount)}
                hideControls
                  classNames={{
                    label: "text-white/70 mb-2 font-medium",
                    input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all"
                  }}
                />
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Step 4: Payment Methods */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white/70 font-medium">Payment Methods (Max 3)</span>
                <Tooltip 
                  multiline 
                  w={300}
                  label={adMode === "SELL" 
                    ? "Select the bank/payment accounts where you want to receive fiat payment. Buyers will see your account details."
                    : "Select the payment methods you can pay with. Sellers will see which methods you support."
                  }
                >
                  <span className="text-white/30 cursor-help"><MdInfoOutline size={16} /></span>
                </Tooltip>
              </div>
              {adMode === "SELL" && (
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" size="xs" onClick={() => setIsMethodManagerOpen(true)}>
                  Select Accounts
                </Button>
              )}
            </div>
            
            <p className="text-white/40 text-xs mb-3">
              {adMode === "SELL" 
                ? "Choose the accounts where buyers will send fiat payment. Your account details (name, number, bank) will be visible to the buyer."
                : "Choose the payment methods you support. Sellers with matching methods will appear in the marketplace."
              }
            </p>

            {adMode === "BUY" ? (
              <MultiSelect
                data={getBanksForFiat(fiat)}
                value={selectedMethodIds}
                onChange={(val) => {
                  if (val.length <= 3) setSelectedMethodIds(val);
                }}
                searchable
                placeholder="Select up to 3 payment methods"
                classNames={{
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white min-h-[48px] rounded-xl focus:border-buy transition-all",
                  dropdown: "bg-surface border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-xl",
                  option: "hover:bg-white/10 data-[combobox-selected]:bg-buy/20 data-[combobox-selected]:text-buy rounded-lg mx-1 my-0.5 transition-colors",
                  pill: "bg-yellow-500 text-black font-semibold rounded-md"
                }}
              />
            ) : selectedMethodIds.length === 0 ? (
              <div className="text-sm text-[#F6465D] bg-[#F6465D]/10 p-4 rounded-lg border border-[#F6465D]/20">
                You must select at least one payment method.
              </div>
            ) : (
              <div className="text-sm text-buy bg-buy/10 p-4 rounded-lg border border-buy/20">
                ✓ {selectedMethodIds.length} payment method(s) selected
              </div>
            )}
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Step 5: Remarks & Payment Window */}
          <div className="grid grid-cols-2 gap-6">
            <Select
              label="Payment Time Limit"
              value={paymentWindow}
              onChange={(v) => setPaymentWindow(v || "15")}
              data={[
                { value: "15", label: "15 Minutes" },
                { value: "30", label: "30 Minutes" },
                { value: "45", label: "45 Minutes" }
              ]}
              classNames={{
                label: "text-white/70 mb-2 font-medium",
                input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all",
                dropdown: "bg-surface border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-xl",
                option: "hover:bg-white/10 data-[combobox-selected]:bg-buy/20 data-[combobox-selected]:text-buy rounded-lg mx-1 my-0.5 transition-colors"
              }}
            />
            <div className="col-span-2">
              <Textarea
                label="Remarks (Optional)"
                placeholder="Terms of trade..."
                value={remarks}
                onChange={(e) => setRemarks(e.currentTarget.value)}
                minRows={3}
                classNames={{
                  label: "text-white/70 mb-2 font-medium",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white rounded-xl focus:border-buy transition-all p-4"
                }}
              />
            </div>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Step 6: Review & Publish */}
          <div className="flex flex-col gap-6">
            <Checkbox
              label="I have read and agree to the Limiance P2P Trading Rules."
              checked={agreed}
              onChange={(e) => setAgreed(e.currentTarget.checked)}
              color="yellow"
              classNames={{
                label: "text-white/80"
              }}
            />

            <Button 
              size="lg" 
              className={`w-full ${adMode === "BUY" ? "bg-buy hover:bg-buy/90 shadow-[0_0_20px_rgba(14,203,129,0.3)]" : "bg-[#F6465D] hover:bg-[#F6465D]/90 shadow-[0_0_20px_rgba(246,70,93,0.3)]"} text-white font-bold text-lg rounded-xl h-14`}
              disabled={!price || !totalAmount || !minOrder || !maxOrder || selectedMethodIds.length === 0 || !agreed || isOverBalance}
              loading={isCreating}
              onClick={handleSubmit}
            >
              Post {adMode} Ad
            </Button>
          </div>

        </div>

        <PaymentMethodManager 
          isOpen={isMethodManagerOpen}
          onClose={() => setIsMethodManagerOpen(false)}
          selectedMethodIds={selectedMethodIds}
          onChangeSelected={setSelectedMethodIds}
          fiat={fiat}
          adMode={adMode}
        />
      </div>
      )}
    </P2PLayout>
  );
}

export default function CreateAdPage() {
  return (
    <PageSuspense fallback={<P2PCreateAdSkeleton />}>
      <CreateAdPageInner />
    </PageSuspense>
  );
}
