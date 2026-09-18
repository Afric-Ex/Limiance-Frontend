"use client";

import { Modal, TextInput } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { MdArrowBack } from "react-icons/md";
import { asset, assetKeys } from "@/src/services/asset";
import { SelectedCoin, SelectedNetwork } from "@/src/hooks/use-deposit";
import { InlineLoading } from "../shared/inline-loading";
import { UNSUPPORTED_CHAIN_SYMBOLS } from "@/src/utils/network-mapper";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSelect: (coin: SelectedCoin, network: SelectedNetwork) => void;
}

const inputClass =
  "!bg-white/[0.04] !border !border-white/[0.08] !text-white !text-sm !rounded-xl !h-11 focus:!border-primary/60 placeholder:!text-white/20";

export const TokenNetworkModal = ({ opened, onClose, onSelect }: Props) => {
  const [view, setView] = useState<"coin" | "network">("coin");
  const [coinSearch, setCoinSearch] = useState("");
  const [networkSearch, setNetworkSearch] = useState("");
  const [pendingCoin, setPendingCoin] = useState<SelectedCoin | null>(null);

  const { data: allTokens, isLoading: tokensLoading } = useQuery({
    queryKey: assetKeys.supportedTokensKey("all"),
    queryFn: () => asset.fetchSupportedTokens({ limit: 200 }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: Infinity,
  });

  const { data: allChains, isLoading: chainsLoading } = useQuery({
    queryKey: assetKeys.supportedChainsKey(""),
    queryFn: () => asset.fetchSupportedChains({ limit: 100 }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: Infinity,
  });

  // Remove unsupported chains entirely (XRP, Tezos, Cardano, Avalanche, Doge, Kava, NEAR)
  const supportedChains = allChains?.filter(
    (c: any) => !UNSUPPORTED_CHAIN_SYMBOLS.has(c.symbol.toLowerCase())
  );

  // Remove tokens whose native chain is unsupported
  const supportedTokens = allTokens?.filter((t: any) => {
    const sym = t.symbol.toLowerCase();
    if (UNSUPPORTED_CHAIN_SYMBOLS.has(sym)) return false;
    if (t.blockchain && UNSUPPORTED_CHAIN_SYMBOLS.has(t.blockchain.toLowerCase())) return false;
    return true;
  });

  const filteredTokens = coinSearch.trim()
    ? supportedTokens?.filter(
        (t: any) =>
          t.symbol.toLowerCase().includes(coinSearch.toLowerCase()) ||
          t.name.toLowerCase().includes(coinSearch.toLowerCase())
      )
    : supportedTokens;

  const supportedChainsForCoin = pendingCoin
    ? supportedChains?.filter((chain: any) => {
        // BTC only ever uses the Bitcoin chain
        if (pendingCoin.symbol.toLowerCase() === "btc" || pendingCoin.symbol.toLowerCase() === "bitcoin") {
          return chain.symbol.toLowerCase() === "btc" || chain.name.toLowerCase() === "bitcoin";
        }

        const tokenParts = [pendingCoin.symbol, pendingCoin.name, pendingCoin.blockchain]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());
        const chainParts = [chain.symbol, chain.name, chain.blockchain, chain.standard, chain.supportedPairs]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        const directMatch = tokenParts.some((tokenPart) =>
          chainParts.some((chainPart) => chainPart === tokenPart || chainPart.includes(tokenPart) || tokenPart.includes(chainPart))
        );

        const stablecoinFallback =
          ["usdt", "usdc", "busd", "dai"].includes(pendingCoin.symbol.toLowerCase()) &&
          chainParts.some((chainPart) =>
            ["erc20", "trc20", "bep20", "ethereum", "tron", "bsc", "polygon", "solana", "arbitrum", "optimism"].some((networkPart) =>
              chainPart.includes(networkPart)
            )
          );

        return directMatch || stablecoinFallback;
      })
    : supportedChains;

  const filteredChains = networkSearch.trim()
    ? supportedChainsForCoin?.filter(
        (c: any) =>
          c.symbol.toLowerCase().includes(networkSearch.toLowerCase()) ||
          c.name.toLowerCase().includes(networkSearch.toLowerCase()) ||
          c.standard.toLowerCase().includes(networkSearch.toLowerCase())
      )
    : supportedChainsForCoin;

  const handleCoinClick = (coin: NonNullable<typeof allTokens>[number]) => {
    setPendingCoin({
      name: coin.name,
      symbol: coin.symbol,
      image: coin.image,
      contractAddress: coin.contractAddress,
      blockchain: coin.blockchain,
    });
    setNetworkSearch("");
    setView("network");
  };

  const handleNetworkClick = (chain: NonNullable<typeof allChains>[number]) => {
    if (!pendingCoin) return;
    onSelect(pendingCoin, {
      name: chain.name,
      symbol: chain.symbol,
      blockchain: chain.blockchain,
    });
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
                filteredTokens.map((token: any, index: number) => (
                <button
                  key={`${token.symbol}-${token.blockchain ?? "native"}-${index}`}
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
