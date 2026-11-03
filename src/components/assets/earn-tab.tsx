"use client";

import {
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  Table,
  TableTh,
  TableTr,
  Select,
  NumberInput,
  Loader,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "@/src/styles/assets-earn.module.css";
import { useState } from "react";
import { WithCurvedImageBorder } from "../shared/with-curved-image-border";
import { EmptyTable } from "../icons/empty-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { earnKeys, earnService, EarnProduct, EarnPosition } from "@/src/services/earn";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";

const productTabs = [
  "Simple Earn",
  "Staking",
  "Launchpad",
  "Pool Savings",
  "Dual Investment",
  "Auto Invest",
  "Smart Trend",
];

const headings: { [k: string]: string[] } = {
  "Simple Earn": ["Coin", "Amount", "APR", "Cumulative Total reward", "Action"],
  Staking: ["Coin", "Redemption Date", "Redemption Amount", "Receive Amount", "Est. Arrival Date", "Action"],
  Launchpad: ["Project name", "Asset", "Amount", "Action"],
  "Pool Savings": ["Coin", "Total Balance", "Cummulative Interest", "Action"],
  "Pool savings": ["Coin", "Total Balance", "Cummulative Interest", "Action"],
  "Dual Investment": ["Product", "Subscription Date", "Subscription Amount", "Target Price", "Settlement Date", "APR", "Status", "Action"],
  "Auto Invest": ["Plan Name", "Auto-Investment Schedule", "Total Invested", "Purchased Amount", "Average Price", "Action"],
  "Smart Trend": ["Product Name", "Subcription", "Market Value", "Investment Period", "Funding Rate Alert", "Profit", "Action"],
};

const mainTabs = ["Products", "My Positions"];

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
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: () => earnService.subscribe({ productId: product.id, amount }),
    onSuccess: () => {
      successNotification(`Successfully staked ${amount} ${product.asset}`);
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

  return (
    <div className="flex flex-col gap-6 p-2 text-white">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold">Stake {product.asset}</h3>
        <p className="text-sm text-white/55">
          {product.lockDays > 0 ? `${product.lockDays}-day fixed lock` : "Flexible term"} · {product.apy}% APY
        </p>
      </div>
      <NumberInput
        label={`Amount (min: ${product.minAmount} ${product.asset})`}
        placeholder="0.00"
        value={amount}
        onChange={(v) => setAmount(String(v ?? ""))}
        min={parseFloat(product.minAmount) || 0}
        hideControls
        classNames={{ input: "!bg-transparent !border-white/20 !text-white" }}
      />
      {belowMin && (
        <p className="text-xs text-red-400">Minimum stake is {product.minAmount} {product.asset}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onClose}
          className="bg-gray-9/20 hover:bg-white/10 rounded-xl py-3 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => subscribe()}
          disabled={isPending || !amount || Number(amount) <= 0 || !!belowMin}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {isPending && <Loader size="xs" color="white" />}
          Confirm
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

  const { data: rawProducts } = useQuery({
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
      successNotification("Unstaked successfully");
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

  const tabProducts = products.filter((p) =>
    productTab === "Staking" ? p.lockDays > 0 : p.lockDays <= 0
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
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
        withCloseButton={false}
      >
        {selectedProduct && (
          <StakeModal product={selectedProduct} onClose={closeStake} />
        )}
      </Modal>

      <div className="flex gap-4 border-b border-b-white/15 mb-4">
        {mainTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              mainTab === tab
                ? "border-primary text-white"
                : "border-transparent text-white/55"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {mainTab === "Products" && (
        <Tabs
          classNames={classes}
          value={productTab}
          onChange={handleProductTabChange}
        >
          <TabsList>
            {productTabs.map((item) => (
              <TabsTab value={item} key={item}>
                <WithCurvedImageBorder display={productTab === item}>
                  {item}
                </WithCurvedImageBorder>
              </TabsTab>
            ))}
          </TabsList>

          {/* Simple Earn & Staking tabs — render live backend earn products */}
          {(productTab === "Simple Earn" || productTab === "Staking") && (
            <TabsPanel value={productTab}>
              <div className="py-5 min-h-[292px] border border-gray-9 rounded-32px bg-gray-7 px-7 pb-9">
                {tabProducts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {tabProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 bg-gray-15/10 rounded-xl border border-white/10"
                        >
                          <div className="flex items-center gap-4">
                            <ProductIcon image={product.image} asset={product.asset} />
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-white">{product.name} ({product.asset})</span>
                              <span className="text-xs text-white/55">
                                {product.lockDays > 0 ? `${product.lockDays}-day fixed lock` : "Flexible term"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="flex flex-col gap-1 text-right">
                              <span className="text-emerald-400 font-semibold">{product.apy}% APY</span>
                              <span className="text-xs text-white/55">Min: {product.minAmount} {product.asset}</span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                openStake();
                              }}
                              className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              {product.lockDays > 0 ? "Stake" : "Subscribe"}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center py-10">
                    <div className="flex flex-col items-center gap-4">
                      <EmptyTable />
                      <span className="text-xs font-medium text-gray-9">
                        {productTab === "Staking"
                          ? "No Fixed Staking Products Available"
                          : "No Flexible Savings Products Available"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsPanel>
          )}

          {/* Remaining tabs — keep structured placeholder layout */}
          {productTabs.slice(2).map((item) => (
            <TabsPanel key={item} value={item}>
              <div className="py-5 min-h-[292px] border border-gray-9 rounded-32px bg-gray-7 px-7 pb-9">
                <div className="flex flex-col h-full gap-5">
                  <div className="flex flex-col">
                    <div className="self-end">
                      {productTab === "Launchpad" && (
                        <Select data={["All coins"]} defaultValue="All coins" />
                      )}
                    </div>
                    <div className="w-full overflow-auto">
                      <Table classNames={{ th: classes.table_th, tr: classes.table_tr }}>
                        <TableTr>
                          {headings[item].map((h) => (
                            <TableTh key={h}>{h}</TableTh>
                          ))}
                        </TableTr>
                      </Table>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-10">
                    <div className="flex flex-col items-center gap-4">
                      <EmptyTable />
                      <span className="text-xs font-medium text-gray-9">No Records</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsPanel>
          ))}
        </Tabs>
      )}

      {mainTab === "My Positions" && (
        <div className="py-5 min-h-[292px] border border-gray-9 rounded-32px bg-gray-7 px-7 pb-9 flex flex-col gap-6">
          {/* Summary metrics bar */}
          {rewardsData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
              <div>
                <span className="text-xs text-white/50">Total Staked</span>
                <p className="text-sm font-semibold text-white font-mono">${rewardsData.totalStakedUsd.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-white/50">Total Earned</span>
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
                    className="flex items-center justify-between p-4 bg-gray-15/10 rounded-xl border border-white/10"
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
                    <div className="flex items-center gap-8">
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
                <span className="text-xs font-medium text-gray-9">No Active Positions</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
