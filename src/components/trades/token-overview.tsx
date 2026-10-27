"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { asset, assetKeys } from "@/src/services/asset";

type TokenInfo = {
  symbol?: string;
  name?: string;
  description?: string;
  blockchain?: string;
  decimals?: number | string;
  contractAddress?: string;
  isStablecoin?: boolean;
  isTradable?: boolean;
  website?: string;
  whitepaperUrl?: string;
  explorerUrl?: string;
  listedAt?: string;
};

// Only http(s) links are rendered as links.
const safeUrl = (value?: string) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

const shorten = (value: string) => (value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value);

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

function DetailRow({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-2.5 text-xs">
      <span className="text-white/50">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-white/90" title={title ?? value}>
        {value}
      </span>
    </div>
  );
}

/**
 * Overview tab. Everything shown comes from the listed-tokens API; a field the
 * API doesn't return is simply left out (no placeholder numbers).
 */
export function TokenOverview({ base }: { base: string }) {
  const [expanded, setExpanded] = useState(false);

  const { data: token, isLoading } = useQuery({
    queryKey: assetKeys.supportedTokensKey("all"),
    queryFn: () => asset.fetchSupportedTokens({ limit: 1000 }),
    select: (res: any): TokenInfo | null => {
      const list: TokenInfo[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list.find((t) => String(t?.symbol ?? "").toUpperCase() === base.toUpperCase()) ?? null;
    },
    staleTime: Infinity,
    retry: false,
  });

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-white/40">Loading token info…</div>;
  }
  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-white/40">
        No token information available for {base}.
      </div>
    );
  }

  const details: { label: string; value: string; title?: string }[] = [];
  if (token.name) details.push({ label: "Name", value: token.name });
  details.push({ label: "Symbol", value: base.toUpperCase() });
  if (token.blockchain) details.push({ label: "Network", value: token.blockchain });
  if (token.decimals !== undefined && token.decimals !== null && token.decimals !== "")
    details.push({ label: "Decimals", value: String(token.decimals) });
  if (typeof token.isStablecoin === "boolean")
    details.push({ label: "Type", value: token.isStablecoin ? "Stablecoin" : "Token" });
  if (token.contractAddress)
    details.push({ label: "Contract", value: shorten(token.contractAddress), title: token.contractAddress });
  const listed = formatDate(token.listedAt);
  if (listed) details.push({ label: "Listed", value: listed });

  const links = [
    { label: "Website", href: safeUrl(token.website) },
    { label: "Whitepaper", href: safeUrl(token.whitepaperUrl) },
    { label: "Explorer", href: safeUrl(token.explorerUrl) },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  const description = token.description?.trim();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 min-[1300px]:grid-cols-2">
        <section>
          <h3 className="mb-1 text-base font-bold text-white">Token details</h3>
          <div>
            {details.map((row) => (
              <DetailRow key={row.label} {...row} />
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {description && (
            <section>
              <h3 className="mb-2 text-base font-bold text-white">About {token.name || base}</h3>
              <p className={expanded ? "text-sm leading-6 text-white/80" : "line-clamp-4 text-sm leading-6 text-white/80"}>
                {description}
              </p>
              {description.length > 220 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 text-xs font-semibold text-white/60 transition-colors hover:text-white"
                >
                  {expanded ? "Show Less" : "Show More"}
                </button>
              )}
            </section>
          )}

          {links.length > 0 && (
            <section>
              <h3 className="mb-2 text-base font-bold text-white">Explore</h3>
              <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-white/[0.06] px-2.5 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}