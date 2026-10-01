"use client";

import React, { useState } from "react";
import Link from "next/link";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { PaymentMethodManager } from "@/src/components/p2p/payment-method-manager";
import { PaymentMethodBadge } from "@/src/components/p2p/payment-method-badge";
import { Button, Select, NumberInput, Textarea, Checkbox, Tooltip, MultiSelect } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useCreateAd, useAdvertiserInfo, usePaymentMethods } from "@/src/hooks/p2p/use-p2p";
import { CreateOrder } from "@/src/types/p2p";
import { useMarketFeed } from "@/src/hooks/use-market-feed";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { IoChevronBack } from "react-icons/io5";
import { getBanksForFiat } from "@/src/lib/banks";
import { NonAdvertiserModal } from "@/src/components/p2p/non-advertiser-modal";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PCreateAdSkeleton } from "@/src/components/skeletons/p2p";
import clsx from "clsx";

const FIAT_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  NGN: 1500,
  GBP: 0.78,
};

// ─── Shared piece styles (matches withdrawal / account flows) ─────────────────

const StepBadge = ({ num }: { num: number }) => (
  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-[0_0_10px_rgba(77,119,240,0.4)]">
    {num}
  </div>
);

const InfoTooltip = ({ label }: { label: string }) => (
  <Tooltip withArrow multiline w={260} arrowSize={8} color="#181a20" label={label}
    classNames={{ tooltip: "!text-xs !font-medium !border !border-white/[0.08]" }}>
    <span className="cursor-help text-white/30 hover:text-white/60 transition-colors">
      <IoMdInformationCircleOutline size={15} />
    </span>
  </Tooltip>
);

function StepCard({
  num,
  title,
  right,
  children,
}: {
  num: number;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#181a20] border border-white/[0.06] rounded-2xl p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl flex flex-col gap-5 max-[1150px]:gap-4">
      <div className="flex items-center gap-3">
        <StepBadge num={num} />
        <h3 className="text-base font-bold text-white">{title}</h3>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </section>
  );
}

const labelClass = "!text-xs !font-semibold !text-white/40 !uppercase !tracking-wider !mb-2";
const inputClass =
  "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20";
const descriptionClass = "!text-xs !text-white/30 !mt-1.5";
const dropdownClass = "!bg-[#1c1e27] !border !border-white/[0.1] !shadow-2xl !rounded-xl";
const optionClass =
  "hover:!bg-white/10 data-[combobox-selected]:!bg-primary/20 data-[combobox-selected]:!text-primary !rounded-lg !mx-1 !my-0.5 !transition-colors";
const pillBuy = "!bg-buy !text-white !font-semibold !rounded-md";
const pillSell = "!bg-sell !text-white !font-semibold !rounded-md";

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

  // Resolve selected method names for SELL chips (matches edit-ad flow)
  const { data: pmData } = usePaymentMethods();
  const paymentMethodsList = (pmData as any)?.data?.data ?? [];
  const methodName = (id: string) => {
    const m = paymentMethodsList.find((pm: any) => pm.id === id);
    return m?.data?.bankName || m?.method || id;
  };

  // Live market price from WebSocket — backend streams crypto/USDT pairs
  // For USDT itself, price is always 1. For others (BTC, ETH), we get the live USDT price.
  const wsPair = selectedAsset === "USDT" ? "BTC/USDT" : `${selectedAsset}/USDT`;
  const feed = useMarketFeed(wsPair);
  const currentMarketPrice = selectedAsset === "USDT" ? 1 : feed.price;

  // Real balance from funding account via WebSocket portfolio channel
  const { coins: portfolioCoins } = usePortfolioWs({ coins: true });

  const balanceArray = Array.isArray(portfolioCoins) ? portfolioCoins : [];
  const assetBalanceInfo = balanceArray.find((b: any) =>
    b.coin === selectedAsset || b.symbol === selectedAsset || b.asset === selectedAsset
  );
  // console.log(assetBalanceInfo)
  const balanceAvailable = !!assetBalanceInfo;
  const fundingBalance = assetBalanceInfo
    ? parseFloat(assetBalanceInfo.fundingBalance || "0")
    : 0;

  // Validation: for SELL ads, total amount can't exceed balance.
  // Only enforced when the coin's balance is actually known — if the portfolio
  // feed hasn't loaded (or the coin has no record), don't block submission.
  const isOverBalance =
    adMode === "SELL" &&
    balanceAvailable &&
    totalAmount !== "" &&
    Number(totalAmount) > fundingBalance;

  const marketPriceInFiat =
    currentMarketPrice !== null ? currentMarketPrice * (FIAT_RATES[fiat] || 1) : null;

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
        <div className="w-full max-w-3xl mx-auto py-6 flex flex-col gap-5 max-[1150px]:gap-4 page-enter">

          {/* Back + Header */}
          <div className="flex flex-col gap-4 mb-1">
            <Link
              href="/trades/p2p/my-ads"
              className="flex items-center gap-1 w-fit text-sm font-medium text-white/40 hover:text-primary transition-colors"
            >
              <IoChevronBack size={16} />
              Back to My Ads
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-white">Post Ad</h1>
                <p className="text-sm text-white/40">
                  Advertise your price to buy or sell crypto on the P2P marketplace
                </p>
              </div>

              {/* Buy/Sell Toggle */}
              <div className="flex bg-black/40 border border-white/[0.06] rounded-xl p-1 self-start sm:self-center">
                <button
                  className={clsx(
                    "px-6 py-2 rounded-lg text-sm font-bold transition-colors",
                    adMode === "BUY" ? "bg-buy text-white shadow-[0_0_20px_rgba(37,171,66,0.35)]" : "text-white/50 hover:text-white"
                  )}
                  onClick={() => setAdMode("BUY")}
                >
                  Buy
                </button>
                <button
                  className={clsx(
                    "px-6 py-2 rounded-lg text-sm font-bold transition-colors",
                    adMode === "SELL" ? "bg-sell text-white shadow-[0_0_20px_rgba(246,70,93,0.35)]" : "text-white/50 hover:text-white"
                  )}
                  onClick={() => setAdMode("SELL")}
                >
                  Sell
                </button>
              </div>
            </div>
          </div>

          {/* Step 1: Asset & Fiat */}
          <StepCard num={1} title="Asset & Fiat">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Asset"
                value={selectedAsset}
                onChange={(v) => setSelectedAsset(v || "USDT")}
                data={["USDT", "BTC", "ETH"]}
                classNames={{ label: labelClass, input: inputClass, dropdown: dropdownClass, option: optionClass }}
              />
              <Select
                label="Fiat Currency"
                value={fiat}
                onChange={(v) => setFiat(v || "NGN")}
                data={["USD", "EUR", "NGN", "GBP"]}
                classNames={{ label: labelClass, input: inputClass, dropdown: dropdownClass, option: optionClass }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
                <span className="text-xs font-medium text-white/40">Market Price</span>
                <span className="text-sm font-bold text-white">
                  {marketPriceInFiat !== null
                    ? `${marketPriceInFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${fiat}`
                    : "—"}
                </span>
              </div>

              {adMode === "SELL" ? (
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
                  <span className="text-xs font-medium text-white/40">Available Balance</span>
                  <span className="text-sm font-bold text-white">
                    {balanceAvailable
                      ? `${fundingBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${selectedAsset}`
                      : "—"}
                  </span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
                  <span className="text-xs font-medium text-white/40">You're buying</span>
                  <span className="text-sm font-bold text-buy">
                    {selectedAsset} in {fiat}
                  </span>
                </div>
              )}
            </div>
          </StepCard>

          {/* Step 2: Price Settings */}
          <StepCard num={2} title="Price Settings">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                  Price Type
                  <InfoTooltip
                    label="Fixed lets you set a set price for each trade. Floating automatically adjusts your price against the live market price by the margin you set."
                  />
                </span>
                <div className="flex bg-black/40 border border-white/[0.06] rounded-xl p-1 w-fit">
                  <button
                    className={clsx(
                      "px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                      priceType === "FIXED" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                    )}
                    onClick={() => setPriceType("FIXED")}
                  >
                    Fixed
                  </button>
                  <button
                    className={clsx(
                      "px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                      priceType === "FLOATING" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                    )}
                    onClick={() => setPriceType("FLOATING")}
                  >
                    Floating
                  </button>
                </div>
              </div>

              <NumberInput
                label={priceType === "FIXED" ? "Price" : "Floating Margin (Premium %)"}
                description={
                  priceType === "FIXED"
                    ? marketPriceInFiat !== null
                      ? `Market price is ${marketPriceInFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${fiat}`
                      : undefined
                    : "Positive value adds a premium, negative applies a discount to the live market price."
                }
                value={price}
                onChange={(val) => setPrice(val === "" ? "" : Number(val))}
                decimalScale={priceType === "FIXED" ? 4 : 2}
                hideControls
                rightSection={<span className="text-white/50 pr-4">{priceType === "FIXED" ? fiat : "%"}</span>}
                classNames={{
                  label: labelClass,
                  description: descriptionClass,
                  input: inputClass,
                }}
              />
            </div>
          </StepCard>

          {/* Step 3: Order Limits */}
          <StepCard num={3} title="Order Limits">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Min / Max sets the fiat range a buyer can trade per order
                </span>
                <InfoTooltip
                  label="Min/Max Order sets the range a buyer can trade per order. E.g. Min ₦5,000 and Max ₦500,000 means each trade must be within that range."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NumberInput
                  label={`Total Amount (${selectedAsset})`}
                  description={adMode === "SELL" && balanceAvailable ? `Max ${fundingBalance.toLocaleString()} ${selectedAsset}` : undefined}
                  value={totalAmount}
                  onChange={(val) => setTotalAmount(val === "" ? "" : Number(val))}
                  hideControls
                  error={isOverBalance ? `Exceeds your balance of ${fundingBalance.toLocaleString()} ${selectedAsset}` : undefined}
                  rightSection={
                    adMode === "SELL" && balanceAvailable ? (
                      <button
                        className="text-xs font-bold text-warning-1 hover:text-warning-1/80 pr-3"
                        onClick={() => setTotalAmount(fundingBalance)}
                      >
                        MAX
                      </button>
                    ) : (
                      <span className="text-white/50 pr-4">{selectedAsset}</span>
                    )
                  }
                  classNames={{
                    label: labelClass,
                    description: descriptionClass,
                    input: inputClass,
                    section: "!w-fit !right-3",
                  }}
                />

                <NumberInput
                  label={`Min Order (${selectedAsset})`}
                  value={minOrder}
                  onChange={(val) => setMinOrder(val === "" ? "" : Number(val))}
                  min={0}
                  max={maxOrder !== "" && Number(maxOrder) > 0 ? Number(maxOrder) : undefined}
                  clampBehavior="blur"
                  placeholder="0"
                  classNames={{
                    label: labelClass,
                    input: inputClass,
                  }}
                />

                <NumberInput
                  label={`Max Order (${selectedAsset})`}
                  value={maxOrder}
                  onChange={(val) => setMaxOrder(val === "" ? "" : Number(val))}
                  min={minOrder !== "" && Number(minOrder) > 0 ? Number(minOrder) : 0}
                  max={totalAmount !== "" && Number(totalAmount) > 0 ? Number(totalAmount) : undefined}
                  clampBehavior="blur"
                  hideControls
                  classNames={{
                    label: labelClass,
                    input: inputClass,
                  }}
                />
              </div>
            </div>
          </StepCard>

          {/* Step 4: Payment Methods */}
          <StepCard
            num={4}
            title="Payment Methods"
            right={
              adMode === "SELL" ? (
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  size="xs"
                  onClick={() => setIsMethodManagerOpen(true)}
                >
                  Manage Accounts
                </Button>
              ) : undefined
            }
          >
            <div className="flex flex-col gap-3">
              <p className="text-xs text-white/40 leading-relaxed">
                {adMode === "SELL"
                  ? "Choose the accounts where buyers will send fiat payment. Your account details (name, number, bank) will be visible to the buyer."
                  : "Choose the payment methods you support. Sellers with matching methods will appear in the marketplace."}
                {" "}(Max 3)
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
                    input: "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !text-sm !transition-all !duration-200 !rounded-xl !min-h-[56px]",
                    dropdown: dropdownClass,
                    option: optionClass,
                    pill: pillBuy,
                  }}
                />
              ) : selectedMethodIds.length === 0 ? (
                <div className="text-sm text-sell bg-sell/10 p-4 rounded-xl border border-sell/20">
                  You must select at least one payment method.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedMethodIds.map((id) => (
                    <PaymentMethodBadge key={id} method={methodName(id)} className="px-4 py-2 text-sm" />
                  ))}
                </div>
              )}
            </div>
          </StepCard>

          {/* Step 5: Payment Window & Remarks */}
          <StepCard num={5} title="Payment Window & Remarks">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Payment Time Limit"
                  value={paymentWindow}
                  onChange={(v) => setPaymentWindow(v || "15")}
                  data={[
                    { value: "15", label: "15 Minutes" },
                    { value: "30", label: "30 Minutes" },
                    { value: "45", label: "45 Minutes" },
                  ]}
                  classNames={{ label: labelClass, input: inputClass, dropdown: dropdownClass, option: optionClass }}
                />
              </div>
            </div>
            <Textarea
              label="Remarks (Optional)"
              placeholder="Terms of trade..."
              value={remarks}
              onChange={(e) => setRemarks(e.currentTarget.value)}
              minRows={3}
              classNames={{
                label: labelClass,
                input: "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !text-white !text-sm !transition-all !duration-200 !rounded-xl !p-4 placeholder:!text-white/20",
              }}
            />
          </StepCard>

          {/* Step 6: Review & Publish */}
          <StepCard num={6} title="Review & Publish">
            <div className="flex flex-col gap-5">
              <Checkbox
                label="I have read and agree to the Limiance P2P Trading Rules."
                checked={agreed}
                onChange={(e) => setAgreed(e.currentTarget.checked)}
                color="green"
                classNames={{ label: "!text-white/80 !text-sm" }}
              />

              <Button
                size="lg"
                className={clsx(
                  "w-full text-white font-bold text-lg rounded-xl h-14 transition-all",
                  adMode === "BUY"
                    ? "bg-buy hover:bg-buy/90"
                    : "bg-sell hover:bg-sell/90"
                )}
                disabled={!price || !totalAmount || !minOrder || !maxOrder || selectedMethodIds.length === 0 || !agreed || isOverBalance}
                loading={isCreating}
                onClick={handleSubmit}
              >
                Post {adMode === "BUY" ? "Buy" : "Sell"} Ad
              </Button>
            </div>
          </StepCard>
        </div>
      )}

      <PaymentMethodManager
        isOpen={isMethodManagerOpen}
        onClose={() => setIsMethodManagerOpen(false)}
        selectedMethodIds={selectedMethodIds}
        onChangeSelected={setSelectedMethodIds}
        fiat={fiat}
        adMode={adMode}
      />
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