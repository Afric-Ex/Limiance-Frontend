"use client";

import {
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  NumberInput,
  Loader,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "@/src/styles/assets-earn.module.css";
import { useState } from "react";
import { EmptyTable } from "../icons/empty-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { earnKeys, earnService, EarnProduct, EarnPosition } from "@/src/services/earn";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { MdClose, MdOutlineInfo, MdOutlineLock, MdOutlineSavings } from "react-icons/md";
import { useTranslations } from "next-intl";

const productTabs = [
  "Simple Earn",
  "Staking",
  "Launchpad",
  "Pool Savings",
  "Dual Investment",
  "Auto Invest",
  "Smart Trend",
];

const PRODUCT_TAB_KEYS: Record<string, string> = {
  "Simple Earn": "productSimpleEarn",
  "Staking": "productStaking",
  "Launchpad": "productLaunchpad",
  "Pool Savings": "productPoolSavings",
  "Dual Investment": "productDualInvestment",
  "Auto Invest": "productAutoInvest",
  "Smart Trend": "productSmartTrend",
};

const mainTabs = ["Products", "My Positions"];
const MAIN_TAB_KEYS: Record<string, string> = {
  "Products": "products",
  "My Positions": "myPositions",
};
const UPCOMING_PRODUCT_KEYS: Record<string, string> = {
  "Launchpad": "upcomingLaunchpad",
  "Pool Savings": "upcomingPoolSavings",
  "Dual Investment": "upcomingDualInvestment",
  "Auto Invest": "upcomingAutoInvest",
  "Smart Trend": "upcomingSmartTrend",
};

function formatApyPercent(raw: unknown): number {
  const val = Number(raw ?? 0);
  if (!Number.isFinite(val) || val <= 0) return 0;
  const pct = val <= 1 ? val * 100 : val;
  return Number(pct.toFixed(2));
}

interface NormalizedProduct {
  id: string;
  asset: string;
  name: string;
  image?: string;
  apy: number;
  minAmount: string;
  lockDays: number;
  isFlexible: boolean;
  isActive: boolean;
}

interface NormalizedPosition {
  id: string;
  productId: string;
  asset: string;
  image?: string;
  amount: number | string;
  earned: number | string;
  apy: number;
  lockDays: number;
  isFlexible: boolean;
  status: string;
  startDate: string;
  endDate?: string;
}

function ProductIcon({ image, asset }: { image?: string; asset: string }) {
  if (image) {
    return (
      <img
        src={image}
        alt={asset}
        loading="lazy"
        decoding="async"
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
      {asset.slice(0, 3)}
    </div>
  );
}

function StakeModal({
  product,
  onClose,
}: {
  product: NormalizedProduct;
  onClose: () => void;
}) {
  const t = useTranslations("Earn");
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: () => earnService.subscribe({ productId: product.id, amount }),
    onSuccess: () => {
      successNotification(
        product.lockDays > 0
          ? t("stakedSuccess", { amount, asset: product.asset })
          : t("subscribedSuccess", { amount, asset: product.asset })
      );
      queryClient.invalidateQueries({ queryKey: earnKeys.myPositions });
      queryClient.invalidateQueries({ queryKey: earnKeys.myRewards });
      queryClient.invalidateQueries({ queryKey: earnKeys.products });
      onClose();
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const parsedAmount = parseFloat(amount);
  const parsedMin = parseFloat(product.minAmount);
  const belowMin = !isNaN(parsedAmount) && !isNaN(parsedMin) && parsedAmount > 0 && parsedAmount < parsedMin;

  const isStaking = product.lockDays > 0;

  return (
    <div className="flex max-h-[min(85vh,720px)] flex-col overflow-hidden text-white">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.12] text-primary">
            {isStaking ? <MdOutlineLock size={22} /> : <MdOutlineSavings size={22} />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Limiance Earn
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold">
              {isStaking ? t("stake") : t("subscribe")} {product.asset}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeSubscriptionDialog")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <MdClose size={19} />
        </button>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <ProductIcon image={product.image} asset={product.asset} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{product.name}</p>
              <p className="mt-1 text-xs text-white/45">
                {isStaking
                  ? t("fixedTermDays", { days: product.lockDays })
                  : t("flexibleRedemption")}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{t("estApy")}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-400">{product.apy}%</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="earn-subscription-amount" className="text-sm font-medium text-white/80">
              {isStaking ? t("amountToStake") : t("amountToSubscribe")}
            </label>
            <span className="text-xs text-white/45">
              {t("minimum")} <span className="font-semibold text-white/75">{product.minAmount} {product.asset}</span>
            </span>
          </div>
          <div className="flex items-center rounded-xl border border-white/[0.09] bg-elevated px-4 transition-colors focus-within:border-primary/60">
            <NumberInput
              id="earn-subscription-amount"
              aria-label={
                isStaking
                  ? t("amountToStakeIn", { asset: product.asset })
                  : t("amountToSubscribeIn", { asset: product.asset })
              }
              placeholder="0.00"
              value={amount}
              onChange={(value) => setAmount(String(value ?? ""))}
              min={parseFloat(product.minAmount) || 0}
              hideControls
              classNames={{
                root: "!flex-1",
                input: "!h-12 !border-0 !bg-transparent !px-0 !text-base !font-semibold !text-white focus:!ring-0",
              }}
            />
            <span className="border-l border-white/[0.08] pl-3 text-sm font-semibold text-white/55">
              {product.asset}
            </span>
          </div>
          {belowMin && (
            <p className="text-xs text-red-400">
              {isStaking
                ? t("minimumStakeError", { amount: product.minAmount, asset: product.asset })
                : t("minimumSubscriptionError", { amount: product.minAmount, asset: product.asset })}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/[0.06] p-3.5">
          <MdOutlineInfo className="mt-0.5 shrink-0 text-primary" size={17} />
          <p className="text-xs leading-5 text-white/55">
            {isStaking
              ? t("lockedDaysNotice", { days: product.lockDays })
              : t("flexibleNotice")}
            {" "}{t("estimatedReturnsNote")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/[0.07] bg-black/10 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-xl border border-white/[0.09] bg-white/[0.025] text-sm font-semibold text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={() => subscribe()}
          disabled={isPending || !amount || Number(amount) <= 0 || !!belowMin}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(77,119,240,0.2)] transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Loader size="xs" color="white" />}
          {isStaking ? t("confirmStake") : t("confirmSubscription")}
        </button>
      </div>
    </div>
  );
}

export const EarnTab = ({
  activeProductTab,
  onProductTabChange,
}: {
  activeProductTab?: string;
  onProductTabChange?: (tab: string) => void;
} = {}) => {
  const t = useTranslations("Earn");
  const [mainTab, setMainTab] = useState("Products");
  const [internalProductTab, setInternalProductTab] = useState(productTabs[0]);
  const productTab =
    activeProductTab && productTabs.includes(activeProductTab)
      ? activeProductTab
      : internalProductTab;
  const handleProductTabChange = (val: string | null) => {
    const next = val ?? productTabs[0];
    setInternalProductTab(next);
    onProductTabChange?.(next);
  };
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [stakeOpen, { open: openStake, close: closeStake }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const {
    data: rawProducts,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: earnKeys.products,
    queryFn: () => earnService.fetchProducts(),
    select: (res) => (Array.isArray(res?.data) ? res.data : []) as (EarnProduct & { asset?: string; image?: string; lockDays?: number })[],
  });

  const { data: rawPositions } = useQuery({
    queryKey: earnKeys.myPositions,
    queryFn: () => earnService.myPositions(),
    select: (res) => (Array.isArray(res?.data) ? res.data : []) as (EarnPosition & { image?: string; earned?: number; lockDays?: number; apy?: number })[],
  });

  const { data: rewardsData } = useQuery({
    queryKey: earnKeys.myRewards,
    queryFn: () => earnService.myRewards(),
    staleTime: 30_000,
  });

  const { mutate: unstake, isPending: unstaking } = useMutation({
    mutationFn: (subscriptionId: string) =>
      earnService.unstake({ subscriptionId }),
    onSuccess: () => {
      successNotification(t("unstakeSuccess"));
      queryClient.invalidateQueries({ queryKey: earnKeys.myPositions });
      queryClient.invalidateQueries({ queryKey: earnKeys.myRewards });
      queryClient.invalidateQueries({ queryKey: earnKeys.products });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const products: NormalizedProduct[] = (rawProducts || []).map((p) => {
    const lockDays = Number(p.lockPeriodDays ?? p.lockDays ?? 0);
    return {
      id: p.id,
      asset: p.symbol || p.asset || "CRYPTO",
      name: p.name || `${p.symbol || "Crypto"} Earn`,
      image: p.image,
      apy: formatApyPercent(p.apy),
      minAmount: String(p.minAmount ?? "0"),
      lockDays,
      isFlexible: lockDays <= 0,
      isActive: p.isActive ?? true,
    };
  });

  const tabProducts = products.filter(
    (product) =>
      product.isActive &&
      (productTab === "Staking" ? product.lockDays > 0 : product.lockDays <= 0)
  );

  const positions: NormalizedPosition[] = (rawPositions || []).map((pos) => {
    const lockDays = Number(pos.product?.lockPeriodDays ?? pos.lockDays ?? 0);
    return {
      id: pos.id,
      productId: pos.productId,
      asset: pos.asset || pos.product?.symbol || "CRYPTO",
      image: pos.image,
      amount: pos.amount ?? 0,
      earned: pos.accruedRewards ?? pos.earned ?? 0,
      apy: formatApyPercent(pos.product?.apy ?? pos.apy),
      lockDays,
      isFlexible: lockDays <= 0,
      status: pos.status || "ACTIVE",
      startDate: pos.startDate,
      endDate: pos.endDate,
    };
  });

  return (
    <>
      <Modal
        opened={stakeOpen}
        onClose={closeStake}
        centered
        size="md"
        overlayProps={{ backgroundOpacity: 0.72, blur: 4 }}
        classNames={{
          content: "!overflow-hidden !rounded-2xl !border !border-white/[0.08] !bg-[#181a20] !p-0 shadow-2xl",
          header: "!hidden",
          body: "!p-0",
        }}
        withCloseButton={false}
      >
        {selectedProduct && (
          <StakeModal product={selectedProduct} onClose={closeStake} />
        )}
      </Modal>

      <section id="earn-products" className="flex flex-col gap-5 rounded-2xl border border-white/[0.07] bg-[#181a20] p-4 sm:gap-6 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{t("brandTitle")}</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{t("exploreEarnProducts")}</h2>
            <p className="mt-1 text-sm leading-5 text-white/45">
              {t("exploreEarnProductsSubtitle")}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t("earnProductsBadge")}
          </span>
        </div>

        <div className="flex gap-1 self-start rounded-xl border border-white/[0.07] bg-black/20 p-1" role="group" aria-label={t("earnSections")}>
          {mainTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={mainTab === tab}
              onClick={() => setMainTab(tab)}
              className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${
                mainTab === tab
                  ? "bg-primary text-white shadow-[0_4px_14px_rgba(77,119,240,0.2)]"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
              }`}
            >
              {t(MAIN_TAB_KEYS[tab])}
            </button>
          ))}
        </div>

        {mainTab === "Products" && (
          <Tabs
            classNames={classes}
            value={productTab}
            onChange={handleProductTabChange}
          >
            <TabsList aria-label={t("earnProductCategories")}>
              {productTabs.map((item) => (
                <TabsTab value={item} key={item}>
                  {t(PRODUCT_TAB_KEYS[item])}
                </TabsTab>
              ))}
            </TabsList>

            {(productTab === "Simple Earn" || productTab === "Staking") && (
              <TabsPanel value={productTab}>
                <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-surface">
                  <div className="flex flex-col gap-1 border-b border-white/[0.06] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {productTab === "Staking" ? t("fixedTermStaking") : t("flexibleSavings")}
                      </h3>
                      <p className="mt-1 text-xs text-white/45">
                        {productTab === "Staking"
                          ? t("fixedTermStakingDesc")
                          : t("flexibleSavingsDesc")}
                      </p>
                    </div>
                    {!productsLoading && !productsError && (
                      <span className="text-xs text-white/40">
                        {t("productCount", { count: tabProducts.length })}
                      </span>
                    )}
                  </div>

                  {productsLoading ? (
                    <div className="flex min-h-56 items-center justify-center">
                      <Loader color="blue" />
                    </div>
                  ) : productsError ? (
                    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 text-center">
                      <p className="text-sm text-white/55">{t("loadProductsError")}</p>
                      <button
                        type="button"
                        onClick={() => void refetchProducts()}
                        className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:bg-white/[0.05]"
                      >
                        {t("tryAgain")}
                      </button>
                    </div>
                  ) : tabProducts.length ? (
                    <div className="grid grid-cols-1 gap-3 p-3 sm:p-4">
                      {tabProducts.map((product) => (
                        <article
                          key={product.id}
                          className="grid grid-cols-1 gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-white/[0.13] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <ProductIcon image={product.image} asset={product.asset} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="truncate text-sm font-semibold text-white">{product.name}</h4>
                                <span className="rounded-md border border-white/[0.08] bg-white/[0.035] px-2 py-0.5 text-[10px] font-semibold text-white/55">
                                  {product.asset}
                                </span>
                              </div>
                              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/45">
                                {product.lockDays > 0 ? (
                                  <><MdOutlineLock size={13} /> {t("dayLock", { days: product.lockDays })}</>
                                ) : (
                                  <><MdOutlineSavings size={14} /> {t("flexibleRedemption")}</>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 items-center gap-3 border-t border-white/[0.06] pt-3 sm:flex sm:gap-6 sm:border-0 sm:pt-0">
                            <div className="sm:min-w-[95px] sm:text-right">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">{t("estApy")}</p>
                              <p className="mt-1 text-base font-bold tabular-nums text-emerald-400">{product.apy}%</p>
                            </div>
                            <div className="sm:min-w-[110px] sm:text-right">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">{t("minimum")}</p>
                              <p className="mt-1 text-xs font-medium text-white/75">{product.minAmount} {product.asset}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProduct(product);
                                openStake();
                              }}
                              className="col-span-2 min-h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:col-span-1"
                            >
                              {product.lockDays > 0 ? t("stake") : t("subscribe")}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-white/35">
                        {productTab === "Staking" ? <MdOutlineLock size={22} /> : <MdOutlineSavings size={22} />}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-white/80">
                          {productTab === "Staking" ? t("noStakingProducts") : t("noFlexibleEarnProducts")}
                        </h4>
                        <p className="mt-1 max-w-sm text-xs leading-5 text-white/40">
                          {t("newOpportunities")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsPanel>
            )}

            {productTabs.slice(2).map((item) => (
              <TabsPanel key={item} value={item}>
                <div className="grid min-h-[270px] grid-cols-1 overflow-hidden rounded-2xl border border-white/[0.07] bg-surface lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="flex flex-col justify-center p-5 sm:p-8">
                    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.1] text-primary">
                      <MdOutlineInfo size={22} />
                    </span>
                    <span className="mb-2 w-fit rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Coming soon
                    </span>
                    <h3 className="text-lg font-semibold text-white">{item}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                      {t(UPCOMING_PRODUCT_KEYS[item])}
                    </p>
                  </div>
                  <div className="flex flex-col justify-center gap-3 border-t border-white/[0.06] bg-white/[0.015] p-5 lg:border-l lg:border-t-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">{t("onThisPage")}</p>
                    <p className="text-xs leading-5 text-white/50">
                      Product availability and terms will be shown here before you can participate.
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Product details coming soon
                    </div>
                  </div>
                </div>
              </TabsPanel>
            ))}
          </Tabs>
        )}

        {mainTab === "My Positions" && (
        <div className="flex min-h-[250px] flex-col gap-5 rounded-2xl border border-white/[0.07] bg-surface p-4 sm:p-5">
          {/* Summary metrics bar */}
          {rewardsData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
              <div>
                <span className="text-xs text-white/50">{t("totalStaked")}</span>
                <p className="text-sm font-semibold text-white font-mono">${rewardsData.totalStakedUsd.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-white/50">{t("totalEarned")}</span>
                <p className="text-sm font-semibold text-emerald-400 font-mono">${rewardsData.totalEarnedUsd.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-white/50">Yesterday&apos;s Rewards</span>
                <p className="text-sm font-semibold text-emerald-400 font-mono">${rewardsData.yesterdayRewardsUsd.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-white/50">30-Day Rewards</span>
                <p className="text-sm font-semibold text-emerald-400 font-mono">${rewardsData.thirtyDayRewardsUsd.toFixed(2)}</p>
              </div>
            </div>
          )}

          {positions && positions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {positions.map((pos) => {
                const formattedEnd =
                  pos.endDate && !isNaN(new Date(pos.endDate).getTime())
                    ? `Ends ${new Date(pos.endDate).toLocaleDateString()}`
                    : "Flexible redemption";

                return (
                  <div
                    key={pos.id}
                    className="flex flex-col gap-4 rounded-xl border border-white/[0.07] bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <ProductIcon image={pos.image} asset={pos.asset} />
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-white">{pos.asset}</span>
                        <span className="text-xs text-white/55">
                          {pos.lockDays > 0 ? `${pos.lockDays}-day fixed` : "Flexible"} · {pos.apy}% APY
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end sm:gap-6">
                      <div className="flex flex-col gap-1 text-right">
                        <span className="font-semibold text-white font-mono">{pos.amount} {pos.asset}</span>
                        <span className="text-xs text-emerald-400">+{pos.earned} earned</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right text-xs text-white/55">
                        <span>{formattedEnd}</span>
                        <span className="text-emerald-400 font-medium">{pos.status}</span>
                      </div>
                      <button
                        onClick={() => unstake(pos.id)}
                        disabled={unstaking}
                        className="bg-gray-9/20 hover:bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors text-white"
                      >
                        {unstaking && <Loader size="xs" color="white" />}
                        Unstake
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-4">
                <EmptyTable />
                <span className="text-xs font-medium text-gray-9">{t("noActivePositions")}</span>
              </div>
            </div>
          )}
        </div>
      )}
      </section>
    </>
  );
};
