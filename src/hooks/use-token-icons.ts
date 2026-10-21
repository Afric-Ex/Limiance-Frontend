"use client";

import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";

export interface TokenIcon {
  symbol: string;
  logo?: string;
  image?: string;
  icon?: string;
}

export function useTokenIcons() {
  return useQuery({
    queryKey: tradingKeys.listedTokens(),
    queryFn: () => tradingService.listedTokens({ limit: 1000 }),
    select: (res: any) => {
      const raw = res?.data ?? res;
      if (!Array.isArray(raw)) return {};
      const icons: Record<string, string> = {};
      for (const token of raw) {
        const symbol = String(token?.symbol ?? "").trim().toUpperCase();
        const logo = token?.logo ?? token?.image ?? token?.icon;
        if (symbol && logo && typeof logo === "string" && !icons[symbol]) {
          icons[symbol] = logo.trim();
        }
      }
      return icons;
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function useTokenIconMap() {
  const { data: icons = {} } = useTokenIcons();
  return icons;
}

export function useTokenIcon(symbol?: string) {
  const icons = useTokenIconMap();
  const cleanSymbol = symbol?.toUpperCase().trim();
  return cleanSymbol ? icons[cleanSymbol] : undefined;
}