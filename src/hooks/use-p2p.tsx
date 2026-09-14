import { useForm } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import { asset, assetKeys } from "../services/asset";
import { tradingService } from "../services/trading";

export const useP2P = () => {
  const addPaymentMethodForm = useForm({
    initialValues: {
      accountNumber: "",
      bankName: "",
      accountName: "",
      method: "",
    },
  });

  const postAdsForm = useForm({
    initialValues: {
      type: "Buy" as "Buy" | "Sell",
      asset: "",
      fiat: "",
      fixedPrice: "",
      paymentDuration: "30",
      minQuantity: "",
      maxQuantity: "",
      quantity: "",
      numberLinked: false,
      emailLinked: false,
      daysSinceAccountCreation: "",
      completedOrders: "",
      allCompletedOrders: "",
      selectedCountry: "Nigeria",
      remark: "",
      paymentMethod: [] as string[],
      floatingPrice: true,
      premium: 0,
    },
  });

  const { data: portfolio } = useQuery({
    queryKey: assetKeys.portfolio(),
    queryFn: asset.fetchPortfolio,
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []), // GUARANTEE ARRAY
    staleTime: 30_000,
  });

  const { data: tokensRaw, isLoading: isLoadingTokens } = useQuery({
    queryKey: ["listed-tokens"],
    queryFn: tradingService.listedTokens,
    staleTime: Infinity,
    retry: false,
  });

  const listedTokens: { symbol: string; name?: string; logo?: string }[] = (() => {
    const raw = tokensRaw?.data;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw
        .map((t: any) => ({ symbol: t.symbol || t.name || String(t), name: t.name, logo: t.logo }))
        .filter((t: any) => !!t.symbol);
    }
    const coins = ["USDT", "BTC", "ETH", "NGN", "USD"];
    return coins.map((c: string) => ({ symbol: c }));
  })();

  const selectedAsset = postAdsForm.values.asset;
  const availableBalance =
    portfolio?.find(
      (item) => item.symbol.toUpperCase() === selectedAsset.toUpperCase()
    )?.fundingBalance ?? "0";

  return {
    postAdsForm,
    addPaymentMethodForm,
    availableBalance,
    listedTokens,
    isLoadingTokens,
  };
};
