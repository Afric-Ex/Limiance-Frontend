"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, NumberInput, Skeleton } from "@mantine/core";
import { useP2PStore } from "@/src/stores/p2p-store";
import { asset, assetKeys } from "@/src/services/asset";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { fiatKeys, fiatService } from "@/src/services/fiat";

const selectClassNames = {
  input:
    "!bg-white/[0.04] !border-white/[0.07] hover:!border-white/[0.14] focus:!border-primary/50 !text-white !h-10 !rounded-lg !font-medium !text-xs !transition-colors",
  dropdown: "!bg-[#181a20] !border !border-white/[0.09] !text-white !rounded-lg !shadow-2xl",
  option:
    "hover:!bg-white/[0.08] data-[combobox-selected]:!bg-primary/20 data-[combobox-selected]:!text-primary !rounded-md !mx-1 !my-0.5 !text-xs !transition-colors",
};

type FilterOption = { value: string; label: string; image?: string };

const CURRENCY_ICONS: Record<string, string> = {
  AED: "/currency/aed.svg",
  AUD: "/currency/aud.svg",
  CAD: "/currency/cad.svg",
  CHF: "/currency/chf.svg",
  EUR: "/currency/eur.svg",
  GBP: "/currency/gbp.svg",
  GHS: "/currency/ghs.svg",
  INR: "/currency/inr.svg",
  JPY: "/currency/jpy.svg",
  NGN: "/currency/ngn.svg",
  NOK: "/currency/nok.svg",
  USD: "/currency/usd.svg",
};

const firstImage = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const OptionIcon = ({ src, label }: { src?: string; label: string }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span className="w-4 h-4 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold text-white/70 flex items-center justify-center shrink-0">
        {label.slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={18}
      height={18}
      loading="lazy"
      className="w-4 h-4 rounded-full object-cover shrink-0"
      onError={() => setFailed(true)}
    />
  );
};

const renderOption = ({ option }: { option: FilterOption }) => (
  <div className="flex items-center gap-2">
    <OptionIcon src={option.image} label={option.label} />
    <span className="text-xs">{option.label}</span>
  </div>
);

export const FilterBar = () => {
  const { adFilters, setAdFilters } = useP2PStore();

  const { data: listedTokens, isLoading: tokensLoading } = useQuery({
    queryKey: assetKeys.supportedTokensKey("all"),
    queryFn: () => asset.fetchSupportedTokens({ limit: 1000 }),
    select: (res: any) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []),
    staleTime: Infinity,
    retry: false,
  });

  const assetOptions = useMemo(() => {
    const bySymbol = new Map<string, FilterOption>();
    for (const token of listedTokens ?? []) {
      const symbol = String(token?.symbol ?? "").trim().toUpperCase();
      if (!symbol) continue;
      const image = firstImage(token?.image, token?.logo, token?.icon);
      const existing = bySymbol.get(symbol);
      if (!existing) {
        bySymbol.set(symbol, { value: symbol, label: symbol, image });
      } else if (!existing.image && image) {
        existing.image = image;
      }
    }
    return [...bySymbol.values()];
  }, [listedTokens]);

  const { data: listedCurrencies, isLoading: currenciesLoading } = useQuery({
    queryKey: tradingKeys.listedCurrencies,
    queryFn: () => tradingService.listedCurrencies({ limit: 200 }),
    staleTime: Infinity,
    retry: false,
  });

  const fiatOptions = useMemo(() => {
    const body: any = (listedCurrencies as any)?.data ?? listedCurrencies;
    const rows: any[] = Array.isArray(body) ? body : [];
    const byCode = new Map<string, FilterOption>();
    for (const row of rows) {
      const code = String(
        typeof row === "string" ? row : row?.symbol ?? row?.code ?? row?.currency ?? row?.name ?? ""
      ).trim().toUpperCase();
      if (!code) continue;
      const image = firstImage(row?.logo, row?.image, row?.icon) ?? CURRENCY_ICONS[code];
      const existing = byCode.get(code);
      if (!existing) {
        byCode.set(code, { value: code, label: code, image });
      } else if (!existing.image && image) {
        existing.image = image;
      }
    }
    return [...byCode.values()];
  }, [listedCurrencies]);

  const { data: banksData } = useQuery({
    queryKey: fiatKeys.banks,
    queryFn: () => fiatService.getBanks(),
    staleTime: Infinity,
    retry: false,
  });

  const banksByFiat = useMemo(() => {
    const byFiat: Record<string, string[]> = {};
    if (banksData?.banks) {
      for (const bank of banksData.banks) {
        const currency = (bank as any).currency || (bank as any).fiat;
        if (!currency) continue;
        if (!byFiat[currency]) byFiat[currency] = [];
        byFiat[currency].push(bank.name);
      }
    }
    return byFiat;
  }, [banksData]);

  const paymentMethodOptions = useMemo(
    () => ["All", ...(banksByFiat[adFilters.fiat] || [])],
    [adFilters.fiat, banksByFiat]
  );

  const handleFiatChange = (val: string | null) => {
    const nextFiat = val || "";
    const keepMethod =
      adFilters.paymentMethod === "All" ||
      (banksByFiat[nextFiat] || []).includes(adFilters.paymentMethod);
    setAdFilters({
      fiat: nextFiat,
      ...(keepMethod ? {} : { paymentMethod: "All" }),
    });
  };

  const isLoading = tokensLoading || currenciesLoading;

  const selectedAsset = assetOptions.find((option) => option.value === adFilters.asset);
  const selectedFiat = fiatOptions.find((option) => option.value === adFilters.fiat);

  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center gap-3 bg-[#181a20] border border-white/[0.07] p-3 rounded-xl mb-5">
        <div className="flex bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.07] max-[1150px]:w-full">
          <Skeleton height={32} width={70} radius="sm" />
          <Skeleton height={32} width={70} radius="sm" />
        </div>
        <Skeleton height={38} width={200} radius="sm" />
        <Skeleton height={38} width={115} radius="sm" />
        <Skeleton height={38} width={115} radius="sm" />
        <Skeleton height={38} width={170} radius="sm" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#181a20] border border-white/[0.07] p-3 rounded-xl mb-5">
      {/* Buy/Sell Tabs */}
      <div className="flex bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.07] max-[1150px]:w-full">
        <button
          className={`px-5 py-1.5 rounded-md text-xs font-semibold transition-all max-[1150px]:flex-1 ${
            adFilters.type === "BUY" ? "bg-buy text-white" : "text-white/50 hover:text-white"
          }`}
          onClick={() => setAdFilters({ type: "BUY" })}
        >
          Buy
        </button>
        <button
          className={`px-5 py-1.5 rounded-md text-xs font-semibold transition-all max-[1150px]:flex-1 ${
            adFilters.type === "SELL" ? "bg-[#F6465D] text-white" : "text-white/50 hover:text-white"
          }`}
          onClick={() => setAdFilters({ type: "SELL" })}
        >
          Sell
        </button>
      </div>

      <div className="flex-1 min-w-[180px] max-[1150px]:w-full max-[1150px]:flex-none">
        <NumberInput
          placeholder="Enter Amount"
          value={adFilters.amount ? Number(adFilters.amount) : ""}
          onChange={(val) => setAdFilters({ amount: val ? val.toString() : "" })}
          hideControls
          classNames={{
            input:
              "!bg-white/[0.04] !border-white/[0.07] hover:!border-white/[0.14] focus:!border-primary/50 !text-white !placeholder-white/30 !h-10 !rounded-lg !text-xs !transition-colors",
          }}
          rightSection={<span className="text-white/40 pr-2 font-medium text-xs font-mono">{adFilters.fiat}</span>}
        />
      </div>

      <div className="w-[115px] max-[1150px]:w-[calc(50%-6px)]">
        <Select
          value={adFilters.asset}
          onChange={(val) => setAdFilters({ asset: val || "USDT" })}
          data={assetOptions}
          searchable
          classNames={selectClassNames}
          leftSection={
            <OptionIcon
              src={selectedAsset?.image}
              label={selectedAsset?.label ?? adFilters.asset}
            />
          }
          leftSectionPointerEvents="none"
          renderOption={renderOption}
        />
      </div>

      <div className="w-[115px] max-[1150px]:w-[calc(50%-6px)]">
        <Select
          value={adFilters.fiat}
          onChange={handleFiatChange}
          data={fiatOptions}
          searchable
          classNames={selectClassNames}
          leftSection={
            <OptionIcon
              src={selectedFiat?.image ?? CURRENCY_ICONS[adFilters.fiat]}
              label={selectedFiat?.label ?? adFilters.fiat}
            />
          }
          leftSectionPointerEvents="none"
          renderOption={renderOption}
        />
      </div>

      <div className="w-[170px] max-[1150px]:w-full">
        <Select
          value={adFilters.paymentMethod}
          onChange={(val) => setAdFilters({ paymentMethod: val || "All" })}
          data={paymentMethodOptions}
          searchable
          placeholder="Payment Method"
          classNames={selectClassNames}
        />
      </div>
    </div>
  );
};
