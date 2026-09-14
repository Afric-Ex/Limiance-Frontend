import { useQuery, useMutation } from "@tanstack/react-query";
import { asset, assetKeys } from "../services/asset";
import { useState, useEffect } from "react";
import { useUserStore } from "../stores/user-store";
import { mapSymbolToWalletChain } from "../utils/network-mapper";

export interface SelectedCoin {
  name: string;
  image: string;
  symbol: string;
  contractAddress: string;
  blockchain?: string;
}

export interface SelectedNetwork {
  name: string;
  symbol: string;
  blockchain: string;
}


export const useDeposit = () => {
  const [selectedCoin, setSelectedCoin] = useState<SelectedCoin>({
    name: "",
    image: "",
    symbol: "",
    contractAddress: "",
  });
  const [selectedNetwork, setSelectedNetwork] = useState<SelectedNetwork>({
    name: "",
    symbol: "",
    blockchain: "",
  });
  const [walletType, setWalletType] = useState(0);
  const user = useUserStore((state) => state.user);

  // tokens needed for history table coin image lookup
  const { data: supportedTokens } = useQuery({
    queryKey: assetKeys.supportedTokensKey("all"),
    queryFn: () => asset.fetchSupportedTokens({ limit: 200 }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: Infinity,
  });

  // fetch all pre-generated user wallets (evm, bitcoin, solana, bsc, etc.)
  const { data: allWallets, isLoading: allWalletsLoading } = useQuery({
    queryKey: assetKeys.allWallets(),
    queryFn: () => asset.allWallets({ limit: 100 }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: Infinity,
  });

  // chainId = the network symbol from the dropdown (e.g. "BSC", "BTC", "ETH")
  const chainId = selectedNetwork?.symbol;

  // Map the dropdown symbol to what the wallet DB actually stores
  const internalChainName = mapSymbolToWalletChain(chainId || "");

  // Check if a wallet for this chain already exists — avoids calling /wallet/generate
  const existingWallet = chainId
    ? allWallets?.find((w) => {
        if (!w.address || w.address.trim() === "") return false;
        const c = w.chain.toLowerCase();
        return c === chainId.toLowerCase() || 
               (internalChainName && c === internalChainName.toLowerCase());
      })
    : undefined;

  // Only call /wallet/generate if no existing wallet was found for this chain
  const {
    data: generatedWallet,
    isLoading: generateWalletLoading,
    isError: generateWalletError,
    error: generateWalletRawError,
    refetch: retryGenerateWallet,
  } = useQuery({
    queryKey: assetKeys.generateWalletKeys(chainId || "", walletType),
    queryFn: () =>
      asset.generateWallet({
        chain: chainId as string, // Backend now expects the exact symbol (e.g., "SOL", "ETH")
        walletType,
        userid: user?.id as string,
      }),
    enabled:
      !!selectedCoin?.name &&
      !!chainId &&
      !existingWallet &&
      !!user?.id,
    retry: false,
    throwOnError: false,
  });

  const walletAddress =
    existingWallet?.address ?? (generatedWallet as any)?.address ?? (generatedWallet as any)?.data?.address;
  const walletLoading =
    allWalletsLoading ||
    (!existingWallet && generateWalletLoading && !!chainId);
  const walletError =
    !existingWallet && generateWalletError && !!chainId;

  const resolvedWalletId =
    existingWallet?.id ?? (generatedWallet as any)?.id ?? (generatedWallet as any)?.data?.id;

  const { mutate: saveDestination } = useMutation({
    mutationFn: () =>
      asset.initiateDeposit({
        walletId: resolvedWalletId as string,
        asset: selectedCoin?.symbol,
        network: selectedNetwork?.symbol,
      }),
  });

  useEffect(() => {
    if (resolvedWalletId && selectedCoin?.name && selectedNetwork?.symbol) {
      saveDestination();
    }
  }, [resolvedWalletId, selectedCoin?.name, selectedNetwork?.symbol, saveDestination]);

  return {
    supportedTokens,
    selectedCoin,
    selectedNetwork,
    setSelectedCoin,
    setSelectedNetwork,
    walletAddress,
    walletLoading,
    walletError,
    retryGenerateWallet,
    walletType,
    setWalletType,
  };
};
