"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, NumberInput, Skeleton } from "@mantine/core";
import { useP2PStore } from "@/src/stores/p2p-store";
import { asset, assetKeys } from "@/src/services/asset";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { fiatKeys, fiatService } from "@/src/services/fiat";

const selectClassNames = {
  input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white h-11 rounded-xl focus:border-buy focus:ring-1 focus:ring-buy/30 transition-all font-semibold",
  dropdown: "bg-surface border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-xl",
  option: "hover:bg-white/10 data-[combobox-selected]:bg-buy/20 data-[combobox-selected]:text-buy rounded-lg mx-1 my-0.5 transition-colors",
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
      <span className="w-5 h-5 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold text-white/70 flex items-center justify-center shrink-0">
        {label.slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      className="w-5 h-5 rounded-full object-cover shrink-0"
      onError={() => setFailed(true)}
    />
  );
};

const renderOption = ({ option }: { option: FilterOption }) => (
  <div className="flex items-center gap-2">
    <OptionIcon src={option.image} label={option.label} />
    <span>{option.label}</span>
  </div>
);

export const FilterBar = () => {
  const { adFilters, setAdFilters } = useP2PStore();

  // Listed tokens for the asset picker — the backend's own supported-token list.
  // `listed_tokens` answers one row per token per chain, so collapse to one
  // entry per symbol (same aggregation the ads/deposit pickers use).
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

  // Listed fiat currencies for the fiat picker
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
      const image =
        firstImage(row?.logo, row?.image, row?.icon) ?? CURRENCY_ICONS[code];
      const existing = byCode.get(code);
      if (!existing) {
        byCode.set(code, { value: code, label: code, image });
      } else if (!existing.image && image) {
        existing.image = image;
      }
    }
    return [...byCode.values()];
  }, [listedCurrencies]);

  // Banks for the selected fiat
  const { data: banksData } = useQuery({
    queryKey: fiatKeys.banks,
    queryFn: () => fiatService.getBanks(),
    staleTime: Infinity,
    retry: false,
  });

  const banksByFiat: Record<string, string[]> = {};
  if (banksData?.banks) {
    for (const bank of banksData.banks) {
      const currency = (bank as any).currency || (bank as any).fiat;
      if (!currency) continue;
      if (!banksByFiat[currency]) banksByFiat[currency] = [];
      banksByFiat[currency].push(bank.name);
    }
  }

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
      <div className="flex flex-wrap items-center gap-4 max-[1150px]:gap-3 bg-[#181a20] border border-white/[0.06] p-6 max-[1150px]:p-4 rounded-2xl max-[1150px]:rounded-xl mb-6 max-[1150px]:mb-4">
        <div className="flex bg-black/30 rounded-xl p-1.5 border border-white/[0.06] max-[1150px]:w-full">
          <Skeleton height={40} width={100} />
          <Skeleton height={40} width={100} />
        </div>
        <Skeleton height={48} width={200} />
        <Skeleton height={48} width={120} />
        <Skeleton height={48} width={120} />
        <Skeleton height={48} width={180} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 max-[1150px]:gap-3 bg-[#181a20] border border-white/[0.06] p-6 max-[1150px]:p-4 rounded-2xl max-[1150px]:rounded-xl mb-6 max-[1150px]:mb-4">
      {/* Buy/Sell Tabs */}
      <div className="flex bg-black/30 rounded-xl p-1.5 border border-white/[0.06] max-[1150px]:w-full">
        <button
          className={`px-8 py-2 rounded-lg text-sm font-bold transition-all duration-300 max-[1150px]:flex-1 ${
            adFilters.type === "BUY" ? "bg-buy text-white shadow-[0_0_15px_rgba(14,203,129,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => setAdFilters({ type: "BUY" })}
        >
          Buy
        </button>
        <button
          className={`px-8 py-2 rounded-lg text-sm font-bold transition-all duration-300 max-[1150px]:flex-1 ${
            adFilters.type === "SELL" ? "bg-[#F6465D] text-white shadow-[0_0_15px_rgba(246,70,93,0.3)]" : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => setAdFilters({ type: "SELL" })}
        >
          Sell
        </button>
      </div>

      <div className="flex-1 min-w-[200px] max-[1150px]:w-full max-[1150px]:flex-none">
        <NumberInput
          placeholder="Enter Amount"
          value={adFilters.amount ? Number(adFilters.amount) : ""}
          onChange={(val) => setAdFilters({ amount: val ? val.toString() : "" })}
          hideControls
          classNames={{
            input: "bg-white/[0.03] backdrop-blur-md border-white/[0.05] text-white placeholder-white/30 h-11 rounded-xl focus:border-buy focus:ring-1 focus:ring-buy/30 transition-all",
          }}
          rightSection={<span className="text-white/50 pr-2 font-medium text-xs">{adFilters.fiat}</span>}
        />
      </div>

      <div className="w-[120px] max-[1150px]:w-[calc(50%-6px)]">
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

      <div className="w-[120px] max-[1150px]:w-[calc(50%-6px)]">
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

      <div className="w-[180px] max-[1150px]:w-full">
        <Select
          value={adFilters.paymentMethod}
          onChange={(val) => setAdFilters({ paymentMethod: val || "All" })}
          data={paymentMethodOptions}
          searchable
          placeholder="Payment Method"
          classNames={{ ...selectClassNames, input: selectClassNames.input.replace("font-semibold", "font-medium") }}
        />
      </div>
    </div>
  );
};
