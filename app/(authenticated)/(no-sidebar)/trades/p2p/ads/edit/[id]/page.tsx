"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { PaymentMethodManager } from "@/src/components/p2p/payment-method-manager";
import { PaymentMethodBadge } from "@/src/components/p2p/payment-method-badge";
import { Button, Select, NumberInput, Textarea, Tooltip } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import { useEditAd, usePaymentMethods } from "@/src/hooks/p2p/use-p2p";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PEditAdSkeleton } from "@/src/components/skeletons/p2p";
import { IoChevronBack } from "react-icons/io5";
import { IoMdInformationCircleOutline } from "react-icons/io";
import clsx from "clsx";

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
const dropdownClass = "!bg-[#181a20] !border !border-white/[0.1] !shadow-2xl !rounded-lg";
const optionClass =
  "hover:!bg-white/5 data-[combobox-selected]:!bg-primary/20 data-[combobox-selected]:!text-primary !rounded-md !mx-1 !my-0.5 !text-xs !transition-colors";

function EditAdPageInner() {
  const router = useRouter();
  const params = useParams();
  const adId = params.id as string;

  const [adMode, setAdMode] = useState<"BUY" | "SELL">("SELL");
  const [asset, setAsset] = useState("USDT");
  const [fiat, setFiat] = useState("USD");
  const [priceType, setPriceType] = useState<"FLOATING" | "FIXED">("FIXED");
  const [price, setPrice] = useState<number | "">("");

  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [minOrder, setMinOrder] = useState<number | "">("");
  const [maxOrder, setMaxOrder] = useState<number | "">("");

  const [paymentWindow, setPaymentWindow] = useState("15");
  const [remarks, setRemarks] = useState("");
  const [autoReply, setAutoReply] = useState("");

  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [isMethodManagerOpen, setIsMethodManagerOpen] = useState(false);

  const { data: pmData } = usePaymentMethods();
  const paymentMethodsList = pmData?.data?.data ?? [];
  const { mutate: editAd, isPending: isSaving } = useEditAd();

  const methodName = (id: string) => {
    const methodObj = paymentMethodsList.find((pm: any) => pm.id === id);
    return methodObj?.data?.bankName || methodObj?.method || id;
  };

  const { data: adData, isLoading } = useQuery({
    queryKey: p2pKey.orderById(adId),
    queryFn: () => p2p.getOrderById(adId),
    enabled: !!adId,
  });

  useEffect(() => {
    const adDataAny = adData as any;
    if (adDataAny?.data?.data) {
      const ad = adDataAny.data.data;
      setAdMode(ad.type?.toUpperCase() || "SELL");
      setAsset(ad.asset?.toUpperCase() || "USDT");
      setFiat(ad.fiat?.toUpperCase() || ad.currency?.toUpperCase() || "USD");
      setPriceType(
        String(ad.priceType ?? "").toUpperCase() === "FLOATING" ||
          ad.floatingPrice
          ? "FLOATING"
          : "FIXED"
      );
      setPrice(ad.price ?? ad.fixedPrice ?? "");
      setTotalAmount(ad.quantity || ad.availableQuantity || "");
      setMinOrder(ad.minQuantity || "");
      setMaxOrder(ad.maxQuantity || "");
      setPaymentWindow(String(ad.paymentDuration || "15"));
      setRemarks(ad.remark || "");
      setAutoReply(ad.autoReply || "");
      if (ad.paymentMethod) {
        setSelectedMethods(ad.paymentMethod.map((pm: any) => pm.id || pm));
      }
    }
  }, [adData]);

  const handleSave = () => {
    if (
      !price ||
      !totalAmount ||
      !minOrder ||
      !maxOrder ||
      selectedMethods.length === 0
    ) {
      return;
    }

    editAd(
      {
        id: adId,
        data: {
          price: Number(price),
          floatingPrice: priceType === "FLOATING",
          quantity: Number(totalAmount),
          minQuantity: Number(minOrder),
          maxQuantity: Number(maxOrder),
          paymentDuration: paymentWindow,
          remark: remarks,
          paymentMethods: selectedMethods.map(methodName),
        },
      },
      {
        onSuccess: () => router.push("/trades/p2p/my-ads"),
      }
    );
  };

  if (isLoading) {
    return (
      <P2PLayout>
        <div className="w-full max-w-3xl mx-auto py-6 flex flex-col gap-4 animate-pulse">
          <div className="h-9 bg-white/[0.04] rounded-lg w-1/3" />
          <div className="h-48 bg-[#181a20] border border-white/[0.07] rounded-xl" />
          <div className="h-40 bg-[#181a20] border border-white/[0.07] rounded-xl" />
        </div>
      </P2PLayout>
    );
  }

  return (
    <P2PLayout>
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

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-bold text-white tracking-tight">Edit Advertisement</h1>
              <p className="text-xs text-white/40">
                Update price, order limits, and payment terms for this listing
              </p>
            </div>
            <span
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider",
                adMode === "BUY"
                  ? "bg-buy/15 text-buy border border-buy/25"
                  : "bg-sell/15 text-sell border border-sell/25"
              )}
            >
              {adMode} Listing
            </span>
          </div>
        </div>

        {/* Step 1: Base Asset & Fiat (Locked) */}
        <StepCard num={1} title="Asset & Fiat Configuration">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Type</span>
              <span className={clsx("text-sm font-bold", adMode === "BUY" ? "text-buy" : "text-sell")}>
                {adMode}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Asset / Fiat</span>
              <span className="text-sm font-bold text-white font-mono">
                {asset} / {fiat}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-white/40">
            Base type, trading asset, and fiat currency are locked and cannot be changed after publication.
          </p>
        </StepCard>

        {/* Step 2: Price Settings */}
        <StepCard num={2} title="Price Settings">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                Price Type
                <InfoTooltip
                  label="Fixed maintains a steady unit price. Floating indexes against the market price using a margin premium or discount."
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
              label={priceType === "FIXED" ? "Price" : "Floating Margin (%)"}
              value={price}
              onChange={(val) => setPrice(val === "" ? "" : Number(val))}
              decimalScale={priceType === "FIXED" ? 4 : 2}
              hideControls
              rightSection={<span className="text-white/40 pr-3 text-xs font-medium">{priceType === "FIXED" ? fiat : "%"}</span>}
              classNames={{
                label: labelClass,
                input: inputClass,
              }}
            />
          </div>
        </StepCard>

        {/* Step 3: Order Limits */}
        <StepCard num={3} title="Order Limits">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberInput
              label={`Total Trading Amount (${asset})`}
              value={totalAmount}
              onChange={(val) => setTotalAmount(val === "" ? "" : Number(val))}
              hideControls
              rightSection={<span className="text-white/40 pr-3 text-xs font-mono">{asset}</span>}
              classNames={{
                label: labelClass,
                input: inputClass,
              }}
            />
            <NumberInput
              label={`Min Order (${asset})`}
              value={minOrder}
              onChange={(val) => setMinOrder(val === "" ? "" : Number(val))}
              min={0}
              max={maxOrder !== "" && Number(maxOrder) > 0 ? Number(maxOrder) : undefined}
              clampBehavior="blur"
              hideControls
              classNames={{
                label: labelClass,
                input: inputClass,
              }}
            />
            <NumberInput
              label={`Max Order (${asset})`}
              value={maxOrder}
              onChange={(val) => setMaxOrder(val === "" ? "" : Number(val))}
              min={minOrder !== "" && Number(minOrder) > 0 ? Number(minOrder) : 0}
              max={totalAmount !== "" && Number(totalAmount) > 0 ? Number(totalAmount) : undefined}
              clampBehavior="blur"
              hideControls
              rightSection={<span className="text-white/40 pr-3 text-xs font-mono">{fiat}</span>}
              classNames={{
                label: labelClass,
                input: inputClass,
              }}
            />
          </div>
        </StepCard>

        {/* Step 4: Payment Methods */}
        <StepCard
          num={4}
          title="Payment Methods"
          right={
            <Button
              variant="subtle"
              className="!border !border-white/[0.08] !text-white/70 hover:!text-white hover:!bg-white/[0.06] !rounded-lg !h-8 !px-3 !text-xs !font-medium"
              size="xs"
              onClick={() => setIsMethodManagerOpen(true)}
            >
              Manage Methods
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/40">
              Select up to 3 verified payment methods to display on this advertisement.
            </p>

            {selectedMethods.length === 0 ? (
              <div className="text-xs text-[#F6465D] bg-[#F6465D]/10 px-3 py-2.5 rounded-lg border border-[#F6465D]/20">
                You must select at least one payment method.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedMethods.map((m) => (
                  <PaymentMethodBadge key={m} method={methodName(m)} className="px-3 py-1.5 text-xs" />
                ))}
              </div>
            )}
          </div>
        </StepCard>

        {/* Step 5: Remarks & Payment Window */}
        <StepCard num={5} title="Payment Window & Remarks">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <Textarea
            label="Remarks (Optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.currentTarget.value)}
            minRows={3}
            classNames={{
              label: labelClass,
              input: "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !text-xs !transition-all !duration-150 !rounded-lg !p-3 placeholder:!text-white/20",
            }}
          />

          <Textarea
            label="Auto-Reply Message (Optional)"
            placeholder="Automatic message sent to counterparties upon trade initiation..."
            value={autoReply}
            onChange={(e) => setAutoReply(e.currentTarget.value)}
            minRows={2}
            classNames={{
              label: labelClass,
              input: "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !text-xs !transition-all !duration-150 !rounded-lg !p-3 placeholder:!text-white/20",
            }}
          />
        </StepCard>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.04] !border !border-white/[0.08] !text-white/70 hover:!text-white hover:!bg-white/[0.08] !rounded-lg !h-11 !text-xs !font-semibold"
            onClick={() => router.push("/trades/p2p/my-ads")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-buy hover:!bg-buy/90 !text-white !rounded-lg !h-11 !text-xs !font-semibold"
            disabled={!price || !totalAmount || !minOrder || !maxOrder || selectedMethods.length === 0}
            loading={isSaving}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <PaymentMethodManager
        isOpen={isMethodManagerOpen}
        onClose={() => setIsMethodManagerOpen(false)}
        selectedMethodIds={selectedMethods}
        onChangeSelected={setSelectedMethods}
      />
    </P2PLayout>
  );
}

export default function EditAdPage() {
  return (
    <PageSuspense fallback={<P2PEditAdSkeleton />}>
      <EditAdPageInner />
    </PageSuspense>
  );
}