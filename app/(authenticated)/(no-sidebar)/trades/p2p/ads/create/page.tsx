"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { PaymentMethodManager } from "@/src/components/p2p/payment-method-manager";
import { PaymentMethodBadge } from "@/src/components/p2p/payment-method-badge";
import { Button, Select, NumberInput, Textarea, Checkbox, Tooltip, MultiSelect } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCreateAd, useAdvertiserInfo, usePaymentMethods } from "@/src/hooks/p2p/use-p2p";
import { CreateOrder } from "@/src/types/p2p";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { asset, assetKeys } from "@/src/services/asset";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { fiatKeys, fiatService } from "@/src/services/fiat";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { IoChevronBack } from "react-icons/io5";
import { MdPersonOff } from "react-icons/md";
import { getBanksForFiat } from "@/src/lib/banks";
import { NonAdvertiserModal } from "@/src/components/p2p/non-advertiser-modal";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PCreateAdSkeleton } from "@/src/components/skeletons/p2p";
import clsx from "clsx";

// Shown only while the backend lists load (or if those requests fail).
const FALLBACK_ASSETS = ["USDT", "BTC", "ETH"];
const FALLBACK_FIATS = ["USD", "EUR", "NGN", "GBP"];

const StepBadge = ({ num }: { num: number }) => (
  <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 font-mono">
    {num}
  </div>
);

const InfoTooltip = ({ label }: { label: string }) => (
  <Tooltip
    withArrow
    multiline
    w={260}
    arrowSize={6}
    color="#181a20"
    label={label}
    classNames={{ tooltip: "!text-xs !font-medium !border !border-white/[0.08] !text-white/80" }}
  >
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
    <section className="bg-[#181a20] border border-white/[0.07] rounded-xl p-5 max-[1150px]:p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <StepBadge num={num} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </section>
  );
}

const labelClass = "!text-xs !font-semibold !text-white/50 !uppercase !tracking-wider !mb-1.5";
const inputClass =
  "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !rounded-lg !h-11 !text-white !text-xs !transition-all !duration-150 placeholder:!text-white/20 font-mono";
const selectClass =
  "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !rounded-lg !h-11 !text-white !text-xs !transition-all !duration-150 placeholder:!text-white/20";
const descriptionClass = "!text-[11px] !text-white/40 !mt-1";
const dropdownClass = "!bg-[#181a20] !border !border-white/[0.1] !shadow-2xl !rounded-lg";
const optionClass =
  "hover:!bg-white/5 data-[combobox-selected]:!bg-primary/20 data-[combobox-selected]:!text-primary !rounded-md !mx-1 !my-0.5 !text-xs !transition-colors";
const pillBuy = "!bg-buy/15 !border !border-buy/30 !text-buy !font-semibold !rounded-md !text-xs";

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

  // Listed tokens for the asset picker
  const { data: listedTokens } = useQuery({
    queryKey: assetKeys.supportedTokensKey("all"),
    queryFn: () => asset.fetchSupportedTokens({ limit: 1000 }),
    select: (res: any) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []),
    staleTime: Infinity,
    retry: false,
  });

  const assetOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const token of listedTokens ?? []) {
      const symbol = String(token?.symbol ?? "").trim().toUpperCase();
      if (!symbol || seen.has(symbol)) continue;
      seen.add(symbol);
      options.push({ value: symbol, label: symbol });
    }
    return options.length
      ? options
      : FALLBACK_ASSETS.map((symbol) => ({ value: symbol, label: symbol }));
  }, [listedTokens]);

  const selectedTokenLogo = useMemo(() => {
    const token = (listedTokens ?? []).find(
      (t: any) => String(t?.symbol ?? "").trim().toUpperCase() === selectedAsset
    );
    return token?.image || token?.logo || token?.icon || undefined;
  }, [listedTokens, selectedAsset]);

  // Listed fiat currencies for the fiat picker
  const { data: listedCurrencies } = useQuery({
    queryKey: tradingKeys.listedCurrencies,
    queryFn: () => tradingService.listedCurrencies({ limit: 200 }),
    staleTime: Infinity,
    retry: false,
  });

  const fiatOptions = useMemo(() => {
    const body: any = (listedCurrencies as any)?.data ?? listedCurrencies;
    const rows: any[] = Array.isArray(body) ? body : [];
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const row of rows) {
      const code = String(
        typeof row === "string" ? row : row?.symbol ?? row?.code ?? row?.currency ?? row?.name ?? ""
      ).trim().toUpperCase();
      if (!code || seen.has(code)) continue;
      seen.add(code);
      options.push({ value: code, label: code });
    }
    return options.length
      ? options
      : FALLBACK_FIATS.map((code) => ({ value: code, label: code }));
  }, [listedCurrencies]);

  // Real balance from funding account via WebSocket portfolio channel
  const { coins: portfolioCoins } = usePortfolioWs({ coins: true });

  const balanceArray = Array.isArray(portfolioCoins) ? portfolioCoins : [];
  const assetBalanceInfo = balanceArray.find((b: any) =>
    b.coin === selectedAsset || b.symbol === selectedAsset || b.asset === selectedAsset
  );
  const balanceAvailable = !!assetBalanceInfo;
  const fundingBalance = assetBalanceInfo
    ? parseFloat(assetBalanceInfo.fundingBalance || "0")
    : 0;

  // Validation: for SELL ads, total amount can't exceed balance.
  const isOverBalance =
    adMode === "SELL" &&
    balanceAvailable &&
    totalAmount !== "" &&
    Number(totalAmount) > fundingBalance;

  // Market price in the selected fiat from the fiat-deposit quote
  const quoteSymbol = selectedAsset.trim().toLowerCase();
  const quoteCurrency = fiat.trim().toLowerCase();
  const { data: fiatQuote } = useQuery({
    queryKey: fiatKeys.quoteFor({
      depositAmount: "1",
      symbol: quoteSymbol,
      currency: quoteCurrency,
    }),
    queryFn: () =>
      fiatService.getQuote({
        depositAmount: "1",
        symbol: quoteSymbol,
        currency: quoteCurrency,
      }),
    enabled: !!quoteSymbol && !!quoteCurrency,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
    throwOnError: false,
  });

  const marketPriceInFiat = useMemo(() => {
    const payload: any = fiatQuote;
    if (!payload) return null;

    let body: any = payload;
    for (let depth = 0; depth < 3; depth += 1) {
      if (!body || typeof body !== "object" || Array.isArray(body)) break;
      if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) break;
      body = body.data;
    }

    if (body?.success === false || body?.error) return null;

    const toPrice = (value: unknown) => {
      const parsed = parseFloat(String(value ?? "").replace(/,/g, ""));
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const rate = toPrice(body?.rate ?? body?.Rate ?? body?.buyRate);
    if (rate !== null) return rate;

    const received = toPrice(body?.symbolAmountToReceive ?? body?.symbolAmountToReceived);
    return received !== null ? toPrice(1 / received) : null;
  }, [fiatQuote]);

  const handleSubmit = () => {
    if (!price || !totalAmount || !minOrder || !maxOrder || selectedMethodIds.length === 0 || !agreed) return;
    if (isOverBalance) return;

    const payload: CreateOrder = {
      type: adMode === "BUY" ? "Buy" : "Sell",
      asset: selectedAsset,
      assetLogo: selectedTokenLogo,
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
        <div className="w-full max-w-3xl mx-auto py-6 flex flex-col gap-4 animate-pulse">
          <div className="h-9 bg-white/[0.04] rounded-lg w-1/3" />
          <div className="h-48 bg-[#181a20] border border-white/[0.07] rounded-xl" />
          <div className="h-40 bg-[#181a20] border border-white/[0.07] rounded-xl" />
        </div>
      ) : !isAdvertiser ? (
        <div className="w-full max-w-3xl mx-auto py-20 flex flex-col items-center gap-4 text-white/50 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40">
            <MdPersonOff size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-white">Advertiser Account Required</p>
            <p className="text-xs text-white/40 max-w-md">
              You must be a registered and verified P2P advertiser to create and publish listings on the marketplace.
            </p>
          </div>
          <Button
            onClick={() => router.push("/trades/p2p/advertiser/register")}
            className="!bg-primary hover:!bg-primary/90 !text-white !font-semibold !rounded-lg !h-10 !px-5 !text-xs !mt-2"
          >
            Register as Advertiser
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto py-6 flex flex-col gap-4 page-enter">

          {/* Back + Header */}
          <div className="flex flex-col gap-3 mb-1">
            <Link
              href="/trades/p2p/my-ads"
              className="flex items-center gap-1.5 w-fit text-xs font-medium text-white/40 hover:text-white transition-colors"
            >
              <IoChevronBack size={14} />
              Back to My Ads
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-xl font-bold text-white tracking-tight">Post Advertisement</h1>
                <p className="text-xs text-white/40">
                  Publish a buy or sell offer to the Limiance P2P marketplace
                </p>
              </div>

              {/* Buy/Sell Toggle */}
              <div className="flex bg-black/40 border border-white/[0.06] rounded-lg p-1 self-start sm:self-center">
                <button
                  className={clsx(
                    "px-5 py-1.5 rounded-md text-xs font-semibold transition-colors",
                    adMode === "BUY" ? "bg-buy text-white" : "text-white/50 hover:text-white"
                  )}
                  onClick={() => setAdMode("BUY")}
                >
                  Buy
                </button>
                <button
                  className={clsx(
                    "px-5 py-1.5 rounded-md text-xs font-semibold transition-colors",
                    adMode === "SELL" ? "bg-sell text-white" : "text-white/50 hover:text-white"
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
                data={assetOptions}
                searchable
                classNames={{ label: labelClass, input: selectClass, dropdown: dropdownClass, option: optionClass }}
              />
              <Select
                label="Fiat Currency"
                value={fiat}
                onChange={(v) => setFiat(v || "NGN")}
                data={fiatOptions}
                searchable
                classNames={{ label: labelClass, input: selectClass, dropdown: dropdownClass, option: optionClass }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-lg px-3.5 py-2.5">
                <span className="text-xs text-white/40">Market Price</span>
                <span className="text-xs font-semibold text-white font-mono tabular-nums">
                  {marketPriceInFiat !== null
                    ? `${marketPriceInFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${fiat}`
                    : "—"}
                </span>
              </div>

              {adMode === "SELL" ? (
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-lg px-3.5 py-2.5">
                  <span className="text-xs text-white/40">Funding Balance</span>
                  <span className="text-xs font-semibold text-white font-mono tabular-nums">
                    {balanceAvailable
                      ? `${fundingBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${selectedAsset}`
                      : "—"}
                  </span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-lg px-3.5 py-2.5">
                  <span className="text-xs text-white/40">You are buying</span>
                  <span className="text-xs font-semibold text-buy font-mono">
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
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                  Price Type
                  <InfoTooltip
                    label="Fixed sets a specific price for every trade. Floating automatically indexes your price against the market price with your chosen margin percentage."
                  />
                </span>
                <div className="flex bg-black/40 border border-white/[0.06] rounded-lg p-1 w-fit">
                  <button
                    className={clsx(
                      "px-4 py-1.5 rounded-md text-xs font-semibold transition-colors",
                      priceType === "FIXED" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                    )}
                    onClick={() => setPriceType("FIXED")}
                  >
                    Fixed
                  </button>
                  <button
                    className={clsx(
                      "px-4 py-1.5 rounded-md text-xs font-semibold transition-colors",
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
                      ? `Market price: ${marketPriceInFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${fiat}`
                      : undefined
                    : "Positive values add a premium above market, negative values discount below market."
                }
                value={price}
                onChange={(val) => setPrice(val === "" ? "" : Number(val))}
                decimalScale={priceType === "FIXED" ? 4 : 2}
                hideControls
                rightSection={<span className="text-white/40 pr-3 text-xs font-medium">{priceType === "FIXED" ? fiat : "%"}</span>}
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
                <span className="text-xs text-white/40">
                  Define the trade volume and the per-order order limit range in {selectedAsset}
                </span>
                <InfoTooltip
                  label="Min/Max sets the allowable order amount per trade. Transactions outside this range will be rejected."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NumberInput
                  label={`Total Amount (${selectedAsset})`}
                  description={adMode === "SELL" && balanceAvailable ? `Available: ${fundingBalance.toLocaleString()} ${selectedAsset}` : undefined}
                  value={totalAmount}
                  onChange={(val) => setTotalAmount(val === "" ? "" : Number(val))}
                  hideControls
                  error={isOverBalance ? `Exceeds funding balance (${fundingBalance.toLocaleString()} ${selectedAsset})` : undefined}
                  rightSection={
                    adMode === "SELL" && balanceAvailable ? (
                      <button
                        className="text-[11px] font-bold text-primary hover:text-primary/80 pr-2"
                        onClick={() => setTotalAmount(fundingBalance)}
                      >
                        MAX
                      </button>
                    ) : (
                      <span className="text-white/40 pr-3 text-xs font-mono">{selectedAsset}</span>
                    )
                  }
                  classNames={{
                    label: labelClass,
                    description: descriptionClass,
                    input: inputClass,
                    section: "!w-fit !right-2",
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
                  variant="subtle"
                  className="!border !border-white/[0.08] !text-white/70 hover:!text-white hover:!bg-white/[0.06] !rounded-lg !h-8 !px-3 !text-xs !font-medium"
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
                  ? "Select the bank accounts where buyers will deposit fiat payment (maximum 3 accounts)."
                  : "Select the payment methods you accept from sellers (maximum 3 methods)."}
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
                    input: "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !text-xs !transition-all !duration-150 !rounded-lg !min-h-[44px]",
                    dropdown: dropdownClass,
                    option: optionClass,
                    pill: pillBuy,
                  }}
                />
              ) : selectedMethodIds.length === 0 ? (
                <div className="text-xs text-[#F6465D] bg-[#F6465D]/10 px-3 py-2.5 rounded-lg border border-[#F6465D]/20">
                  You must select at least one payment method to receive funds.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedMethodIds.map((id) => (
                    <PaymentMethodBadge key={id} method={methodName(id)} className="px-3 py-1.5 text-xs" />
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
                  classNames={{ label: labelClass, input: selectClass, dropdown: dropdownClass, option: optionClass }}
                />
              </div>
            </div>
            <Textarea
              label="Remarks (Optional)"
              placeholder="Terms and trading conditions for counterparties..."
              value={remarks}
              onChange={(e) => setRemarks(e.currentTarget.value)}
              minRows={3}
              classNames={{
                label: labelClass,
                input: "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !text-xs !transition-all !duration-150 !rounded-lg !p-3 placeholder:!text-white/20",
              }}
            />
          </StepCard>

          {/* Step 6: Review & Publish */}
          <StepCard num={6} title="Review & Publish">
            <div className="flex flex-col gap-4">
              <Checkbox
                label="I have read and agree to the Limiance P2P Trading Rules and terms of escrow service."
                checked={agreed}
                onChange={(e) => setAgreed(e.currentTarget.checked)}
                color="blue"
                classNames={{ label: "!text-white/70 !text-xs !cursor-pointer" }}
              />

              <Button
                size="md"
                className={clsx(
                  "w-full text-white font-semibold text-xs rounded-lg h-11 transition-all",
                  adMode === "BUY"
                    ? "!bg-buy hover:!bg-buy/90"
                    : "!bg-sell hover:!bg-sell/90"
                )}
                disabled={!price || !totalAmount || !minOrder || !maxOrder || selectedMethodIds.length === 0 || !agreed || isOverBalance}
                loading={isCreating}
                onClick={handleSubmit}
              >
                Post {adMode === "BUY" ? "Buy" : "Sell"} Advertisement
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