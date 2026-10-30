"use client";

import { Modal, TextInput } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@mantine/hooks";
import { useMemo, useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { MdArrowBack } from "react-icons/md";
import { asset, assetKeys } from "@/src/services/asset";
import { SelectedCoin, SelectedNetwork } from "@/src/hooks/use-deposit";
import { useTokenIconMap } from "@/src/hooks/use-token-icons";
import { InlineLoading } from "../shared/inline-loading";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSelect: (coin: SelectedCoin, network: SelectedNetwork) => void;
}

/** One token as listed once per chain: every chain it lives on, plus the
 *  contract address for each of those chains. */
interface TokenEntry extends SelectedCoin {
  blockchains: string[];
  contractAddresses: Record<string, string>;
}

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

const inputClass =
  "!bg-white/[0.04] !border !border-white/[0.08] !text-white !text-sm !rounded-xl !h-11 focus:!border-primary/60 placeholder:!text-white/20";

export const TokenNetworkModal = ({ opened, onClose, onSelect }: Props) => {
  const [view, setView] = useState<"coin" | "network">("coin");
  const [coinSearch, setCoinSearch] = useState("");
  const [networkSearch, setNetworkSearch] = useState("");
  const [pendingCoin, setPendingCoin] = useState<TokenEntry | null>(null);

  const tokenIcons = useTokenIconMap();

  const getIconUrl = (symbol?: string, fallback?: string) => {
    if (!symbol) return fallback;
    return tokenIcons[symbol.toUpperCase().trim()] || fallback;
  };

  // Search runs server-side (debounced) so a coin sitting beyond the fetched
  // page still matches — filtering only loaded rows would wrongly report
  // "no coins found". Empty queries reuse the unfiltered cache keys.
  const [debouncedCoinSearch] = useDebouncedValue(coinSearch.trim(), 350);
  const [debouncedNetworkSearch] = useDebouncedValue(networkSearch.trim(), 350);

  const { data: allTokens, isLoading: tokensLoading } = useQuery({
    queryKey: assetKeys.supportedTokensKey(debouncedCoinSearch || "all"),
    queryFn: () =>
      asset.fetchSupportedTokens({
        limit: 1000,
        ...(debouncedCoinSearch ? { q: debouncedCoinSearch } : {}),
      }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: Infinity,
  });

  const { data: allChains, isLoading: chainsLoading } = useQuery({
    queryKey: assetKeys.supportedChainsKey(debouncedNetworkSearch),
    queryFn: () =>
      asset.fetchSupportedChains({
        limit: 100,
        ...(debouncedNetworkSearch ? { q: debouncedNetworkSearch } : {}),
      }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: Infinity,
  });

  // listed_networks / listed_tokens are the backend's own supported lists, so no
  // client-side blocklist. Anything the backend does not support never arrives.
  const supportedChains = allChains;

  // listed_tokens returns one row per token PER CHAIN, so CNGN arrives four times
  // (Arc, Monad, Celo, Lisk). Collapse to one entry per symbol and carry every
  // chain plus that chain's contract address, so the network step can offer them
  // all and still send the right contract for whichever one is picked.
  const supportedTokens = useMemo<TokenEntry[]>(() => {
    const bySymbol = new Map<string, TokenEntry>();

    for (const token of allTokens ?? []) {
      const symbol = String(token.symbol ?? "").trim();
      if (!symbol) continue;

      const key = symbol.toLowerCase();
      const chain = String(token.blockchain ?? "").trim();
      const contractAddress = String(token.contractAddress ?? "").trim();
      const existing = bySymbol.get(key);

      if (!existing) {
        bySymbol.set(key, {
          name: token.name,
          symbol: token.symbol,
          image: token.image,
          contractAddress,
          blockchain: chain,
          blockchains: chain ? [chain] : [],
          contractAddresses: chain && contractAddress ? { [normalize(chain)]: contractAddress } : {},
        });
        continue;
      }

      if (chain && !existing.blockchains.some((c) => normalize(c) === normalize(chain))) {
        existing.blockchains.push(chain);
      }
      if (chain && contractAddress) {
        existing.contractAddresses[normalize(chain)] = contractAddress;
      }
      // Some chains list the token with no image; keep whichever row has one.
      if (!existing.image && token.image) existing.image = token.image;
    }

    return [...bySymbol.values()];
  }, [allTokens]);

  const filteredTokens = coinSearch.trim()
    ? supportedTokens?.filter(
        (t: any) =>
          t.symbol.toLowerCase().includes(coinSearch.toLowerCase()) ||
          t.name.toLowerCase().includes(coinSearch.toLowerCase())
      )
    : supportedTokens;

  // A token is listed once per chain, each with its own `blockchain`. Offer the
  // network step every chain that token actually has a row for, matched exactly.
  const coinBlockchains = useMemo(
    () => (pendingCoin?.blockchains ?? []).map(normalize).filter(Boolean),
    [pendingCoin]
  );

  const matchingChains = useMemo(() => {
    if (!pendingCoin) return supportedChains ?? [];

    // BTC only ever uses the Bitcoin chain, and its listed_networks row may
    // spell the chain either way.
    if (["btc", "bitcoin"].includes(pendingCoin.symbol.toLowerCase())) {
      return (supportedChains ?? []).filter((chain: any) =>
        ["btc", "bitcoin"].includes(normalize(chain.blockchain ?? chain.symbol))
      );
    }

    if (!coinBlockchains.length) return [];

    return (supportedChains ?? []).filter((chain: any) =>
      [chain.blockchain, chain.symbol]
        .filter(Boolean)
        .some((value) => coinBlockchains.includes(normalize(value)))
    );
  }, [pendingCoin, supportedChains, coinBlockchains]);

  // listed_networks also returns one row per chain PER TOKEN STANDARD, so a single
  // chain arrives several times. The network step only needs the chain itself, so
  // keep the first row per chain and drop the rest.
  const supportedChainsForCoin = useMemo(() => {
    const seen = new Set<string>();
    return matchingChains.filter((chain: any) => {
      const key = normalize(chain.blockchain) || normalize(chain.symbol);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [matchingChains]);

  const filteredChains = networkSearch.trim()
    ? supportedChainsForCoin?.filter(
        (c: any) =>
          c.symbol?.toLowerCase().includes(networkSearch.toLowerCase()) ||
          c.name?.toLowerCase().includes(networkSearch.toLowerCase()) ||
          c.standard?.toLowerCase().includes(networkSearch.toLowerCase())
      )
    : supportedChainsForCoin;

  const handleCoinClick = (coin: TokenEntry) => {
    setPendingCoin(coin);
    setNetworkSearch("");
    setView("network");
  };

  const handleNetworkClick = (chain: NonNullable<typeof allChains>[number]) => {
    if (!pendingCoin) return;
    // The contract address is per chain, so the merged coin's is only correct for
    // the chain it came from. Swap in the address that belongs to the picked chain.
    onSelect(
      {
        ...pendingCoin,
        contractAddress:
          pendingCoin.contractAddresses?.[normalize(chain.blockchain ?? chain.symbol)] ??
          pendingCoin.contractAddress,
      },
      {
        name: chain.name,
        symbol: chain.symbol,
        blockchain: chain.blockchain,
        image: getIconUrl(chain.symbol, chain.image),
      }
    );
    handleClose();
  };

  const handleClose = () => {
    setView("coin");
    setCoinSearch("");
    setNetworkSearch("");
    setPendingCoin(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      size="lg"
      padding={0}
      classNames={{
        content: "!bg-elevated !border !border-white/[0.06] !rounded-2xl !overflow-hidden",
        header: "!bg-elevated !border-b !border-white/[0.06] !px-6 !py-4",
        title: "!text-white !font-bold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06] !rounded-lg",
        body: "!p-0",
      }}
      title={
        view === "coin" ? (
          "Select Coin"
        ) : (
          <button
            onClick={() => setView("coin")}
            className="flex items-center gap-2 text-white font-bold text-base hover:text-primary transition-colors"
          >
            <MdArrowBack size={18} />
            Select Network
            {pendingCoin && (
              <span className="flex items-center gap-1.5 ml-1">
                {pendingCoin.image && (
                  <img src={pendingCoin.image} alt={pendingCoin.symbol} width={16} height={16} className="rounded-full" />
                )}
                <span className="text-primary">{pendingCoin.symbol}</span>
              </span>
            )}
          </button>
        )
      }
    >
      <div className="flex flex-col" style={{ height: "520px" }}>
        {/* Search */}
        <div className="px-6 py-4 border-b border-white/[0.04]">
          <TextInput
            placeholder={view === "coin" ? "Search coin name or symbol…" : "Search network…"}
            value={view === "coin" ? coinSearch : networkSearch}
            onChange={(e) =>
              view === "coin"
                ? setCoinSearch(e.target.value)
                : setNetworkSearch(e.target.value)
            }
            leftSection={<IoSearchOutline size={16} className="text-white/40" />}
            classNames={{ input: inputClass }}
            autoFocus
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {view === "coin" ? (
            tokensLoading ? (
              <div className="flex justify-center py-12"><InlineLoading /></div>
            ) : !filteredTokens?.length ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-white/30">
                <IoSearchOutline size={32} />
                <span className="text-sm">No coins found</span>
              </div>
            ) : (
                filteredTokens.map((token: TokenEntry) => (
                <button
                  key={token.symbol}
                  onClick={() => handleCoinClick(token)}
                  className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0 text-left"
                >
                  {token.image ? (
                    <img src={token.image} alt={token.symbol} width={36} height={36} className="rounded-full shrink-0" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                      {token.symbol[0]}
                    </span>
                  )}
                  <span className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-bold text-white/90">{token.symbol}</span>
                    <span className="text-xs text-white/40 truncate">{token.name}</span>
                  </span>
                </button>
              ))
            )
          ) : (
            chainsLoading ? (
              <div className="flex justify-center py-12"><InlineLoading /></div>
            ) : !filteredChains?.length ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-white/30">
                <IoSearchOutline size={32} />
                <span className="text-sm">No networks found</span>
              </div>
            ) : (
                filteredChains.map((chain: any, index: number) => (
                <button
                  key={`${chain.symbol}-${chain.name}-${index}`}
                  onClick={() => handleNetworkClick(chain)}
                  type="button"
                  className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0 text-left"
                >
                  {(() => {
                    // listed_networks leaves `image` empty for some chains, so fall
                    // back to the known-icons map before giving up on an avatar.
                    const iconSrc = getIconUrl(chain.symbol, chain.image);
                    return iconSrc ? (
                      <img src={iconSrc} alt={chain.symbol} width={36} height={36} className="rounded-full shrink-0" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                        {(chain.symbol || chain.name || "?")[0]}
                      </span>
                    );
                  })()}
                  <span className="flex flex-col flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white/90">{chain.symbol}</span>
                      {chain.standard && (
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wide">
                          {chain.standard}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-white/40 truncate">{chain.name}</span>
                  </span>
                </button>
              ))
            )
          )}
        </div>
      </div>
    </Modal>
  );
};
