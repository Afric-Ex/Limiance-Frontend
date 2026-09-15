"use client";

import React, { useState, useEffect } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { PaymentMethodManager } from "@/src/components/p2p/payment-method-manager";
import { PaymentMethodBadge } from "@/src/components/p2p/payment-method-badge";
import { Button, Select, NumberInput, Textarea, Radio, Loader } from "@mantine/core";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import { usePaymentMethods } from "@/src/hooks/p2p/use-p2p";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PEditAdSkeleton } from "@/src/components/skeletons";

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

  const { data: adData, isLoading } = useQuery({
    queryKey: p2pKey.orderById(adId),
    queryFn: () => p2p.getOrderById(adId),
    enabled: !!adId
  });

  useEffect(() => {
    const adDataAny = adData as any;
    if (adDataAny?.data?.data) {
      const ad = adDataAny.data.data;
      setAdMode(ad.type?.toUpperCase() || "SELL");
      setAsset(ad.asset?.toUpperCase() || "USDT");
      setFiat(ad.fiat?.toUpperCase() || "USD");
      setPriceType(ad.priceType || "FIXED");
      setPrice(ad.price || "");
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

  if (isLoading) {
    return (
      <P2PLayout>
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <Loader color="blue" size="lg" />
        </div>
      </P2PLayout>
    );
  }

  return (
    <P2PLayout>
      <div className="w-full max-w-3xl mx-auto py-6 flex flex-col gap-8">
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Edit Ad</h1>
          {/* Ad ID explicitly hidden per request */}
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-2xl p-8 flex flex-col gap-8">
          
          {/* Step 1: Asset & Fiat (Disabled for edit) */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-white/70 mb-1 text-sm font-medium">Type</div>
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.05] text-white/50 h-12 flex items-center px-4 rounded-xl">{adMode}</div>
            </div>
            <div>
              <div className="text-white/70 mb-1 text-sm font-medium">Asset / Fiat</div>
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.05] text-white/50 h-12 flex items-center px-4 rounded-xl">{asset} / {fiat}</div>
            </div>
          </div>

          <div className="text-xs text-white/40 -mt-6">Type, Asset, and Fiat cannot be modified after ad creation.</div>

          <div className="w-full h-px bg-white/10" />

          {/* Step 2: Price Settings */}
          <div>
            <div className="text-white/70 font-medium mb-4">Price Type</div>
            <Radio.Group value={priceType} onChange={setPriceType as any} classNames={{ root: "flex gap-6 mb-6" }}>
              <Radio value="FIXED" label="Fixed" color="blue" />
              <Radio value="FLOATING" label="Floating" color="blue" />
            </Radio.Group>
            
            <div className="flex gap-6 items-end">
              <NumberInput
                label="Price"
                value={price}
                onChange={(val) => setPrice(val === "" ? "" : Number(val))}
                decimalScale={2}
                hideControls
                rightSection={<span className="text-white/50 pr-4">{fiat}</span>}
                classNames={{
                  label: "text-white/70 mb-2 font-medium",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all w-64"
                }}
              />
            </div>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Step 3: Trade Limits */}
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <NumberInput
                label="Total Trading Amount"
                value={totalAmount}
                onChange={(val) => setTotalAmount(val === "" ? "" : Number(val))}
                hideControls
                rightSection={<span className="text-white/50 pr-4">{asset}</span>}
                classNames={{
                  label: "text-white/70 mb-2 font-medium",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all"
                }}
              />
            </div>
            <div className="col-span-2 md:col-span-1 flex gap-4">
              <NumberInput
                label="Min Order"
                value={minOrder}
                onChange={(val) => setMinOrder(val === "" ? "" : Number(val))}
                hideControls
                classNames={{
                  label: "text-white/70 mb-2 font-medium",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all"
                }}
              />
              <div className="text-white/50 pt-10">~</div>
              <NumberInput
                label="Max Order"
                value={maxOrder}
                onChange={(val) => setMaxOrder(val === "" ? "" : Number(val))}
                hideControls
                rightSection={<span className="text-white/50 pr-4">{fiat}</span>}
                classNames={{
                  label: "text-white/70 mb-2 font-medium",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-12 rounded-xl focus:border-buy transition-all"
                }}
              />
            </div>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Step 4: Payment Methods */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-white/70 font-medium">Payment Methods (Max 3)</div>
              <Button variant="light" size="xs" onClick={() => setIsMethodManagerOpen(true)}>Manage Methods</Button>
            </div>
            
            {selectedMethods.length === 0 ? (
              <div className="text-sm text-[#F6465D] bg-[#F6465D]/10 p-4 rounded-xl border border-[#F6465D]/20">
                You must select at least one payment method.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedMethods.map(m => {
                  const methodObj = paymentMethodsList.find((pm: any) => pm.id === m);
                  const methodName = methodObj?.data?.bankName || methodObj?.method || m;
                  return <PaymentMethodBadge key={m} method={methodName} className="px-4 py-2 text-sm" />;
                })}
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
                value={remarks}
                onChange={(e) => setRemarks(e.currentTarget.value)}
                minRows={3}
                classNames={{
                  label: "text-white/70 mb-2 font-medium",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white rounded-xl focus:border-buy transition-all p-4"
                }}
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label="Auto-Reply (Optional)"
                value={autoReply}
                onChange={(e) => setAutoReply(e.currentTarget.value)}
                minRows={2}
                classNames={{
                  label: "text-white/70 mb-2 font-medium",
                  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white rounded-xl focus:border-buy transition-all p-4"
                }}
              />
            </div>
          </div>

          <div className="w-full h-px bg-white/10" />

          <div className="flex gap-4">
            <Button 
              size="lg" 
              variant="light"
              color="gray"
              className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl h-14"
              onClick={() => router.push("/trades/p2p/my-ads")}
            >
              Cancel
            </Button>
            <Button 
              size="lg" 
              className="flex-1 bg-buy hover:bg-buy/90 shadow-[0_0_20px_rgba(14,203,129,0.3)] text-white rounded-xl h-14 font-bold"
              disabled={!price || !totalAmount || !minOrder || !maxOrder || selectedMethods.length === 0}
              onClick={() => router.push("/trades/p2p/my-ads")}
            >
              Save Changes
            </Button>
          </div>

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
