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
import { earnKeys, earnService } from "@/src/services/earn";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { StakingProduct, StakingPosition } from "@/src/types/asset";

const productTabs = [
  "Simple Earn",
  "Staking",
  "Launchpad",
  "Pool savings",
  "Dual Investment",
  "Auto Invest",
  "Smart Trend",
];

const headings: { [k: string]: string[] } = {
  "Simple Earn": ["Coin", "Amount", "APR", "Cumulative Total reward", "Action"],
  Staking: ["Coin", "Redemption Date", "Redemption Amount", "Receive Amount", "Est. Arrival Date", "Action"],
  Launchpad: ["Project name", "Asset", "Amount", "Action"],
  "Pool savings": ["Coin", "Total Balance", "Cummulative Interest", "Action"],
  "Dual Investment": ["Product", "Subscription Date", "Subscription Amount", "Target Price", "Settlement Date", "APR", "Status", "Action"],
  "Auto Invest": ["Plan Name", "Auto-Investment Schedule", "Total Invested", "Purchased Amount", "Average Price", "Action"],
  "Smart Trend": ["Product Name", "Subcription", "Market Value", "Investment Period", "Funding Rate Alert", "Profit", "Action"],
};

const mainTabs = ["Products", "My Positions"];

function StakeModal({
  product,
  onClose,
}: {
  product: StakingProduct;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: (): Promise<any> =>
      earnService.subscribe({ productId: product.id, amount }),
    onSuccess: () => {
      successNotification("Staking subscription created");
      queryClient.invalidateQueries({ queryKey: earnKeys.myPositions });
      onClose();
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const belowMin = amount && parseFloat(amount) < parseFloat(product.minAmount);

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold">Stake {product.asset}</h3>
        <p className="text-sm text-white/55">
          {product.lockDays > 0 ? `${product.lockDays}-day lock` : "Flexible"} · {product.apy}% APY
        </p>
      </div>
      <NumberInput
        label={`Amount (min: ${product.minAmount} ${product.asset})`}
        placeholder="0.00"
        value={amount}
        onChange={(v) => setAmount(String(v))}
        min={parseFloat(product.minAmount)}
        hideControls
        classNames={{ input: "!bg-transparent !border-white/20" }}
      />
      {belowMin && (
        <p className="text-xs text-red-400">Minimum stake is {product.minAmount} {product.asset}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onClose} className="bg-gray-9/20 rounded-xl py-3 text-sm font-medium">
          Cancel
        </button>
        <button
          onClick={() => subscribe()}
          disabled={isPending || !amount || !!belowMin}
          className="bg-primary rounded-xl py-3 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending && <Loader size="xs" color="white" />}
          Confirm
        </button>
      </div>
    </div>
  );
}

export const EarnTab = () => {
  const [mainTab, setMainTab] = useState("Products");
  const [productTab, setProductTab] = useState(productTabs[0]);
  const [selectedProduct, setSelectedProduct] = useState<StakingProduct | null>(null);
  const [stakeOpen, { open: openStake, close: closeStake }] = useDisclosure(false);
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: earnKeys.products,
    queryFn: () => earnService.fetchProducts(),
    select: (res) => res.data as StakingProduct[],
  });

  const { data: positions } = useQuery({
    queryKey: earnKeys.myPositions,
    queryFn: () => earnService.myPositions(),
    select: (res) => res.data as StakingPosition[],
  });

  const { mutate: unstake, isPending: unstaking } = useMutation({
    mutationFn: (subscriptionId: string): Promise<any> =>
      earnService.unstake({ subscriptionId }),
    onSuccess: () => {
      successNotification("Unstaked successfully");
      queryClient.invalidateQueries({ queryKey: earnKeys.myPositions });
    },
    onError: (e: any) => errorMessageHandler(e),
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
          onChange={(val) => setProductTab(val ?? productTabs[0])}
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

          {/* Simple Earn tab — shows real staking products */}
          <TabsPanel value="Simple Earn">
            <div className="py-5 min-h-292px border border-gray-9 rounded-32px bg-gray-7 px-7 pb-9">
              {products && products.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-gray-15/10 rounded-xl border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={product.image}
                          alt={product.asset}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">{product.asset}</span>
                          <span className="text-xs text-white/55">
                            {product.lockDays > 0 ? `${product.lockDays}-day fixed` : "Flexible"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-success-6 font-semibold">{product.apy}% APY</span>
                          <span className="text-xs text-white/55">Min: {product.minAmount} {product.asset}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            openStake();
                          }}
                          className="bg-primary px-5 py-2 rounded-lg text-sm font-semibold"
                        >
                          Stake
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center py-10">
                  <div className="flex flex-col items-center gap-4">
                    <EmptyTable />
                    <span className="text-xs font-medium text-gray-9">No Records</span>
                  </div>
                </div>
              )}
            </div>
          </TabsPanel>

          {/* Remaining tabs — keep existing table structure */}
          {productTabs.slice(1).map((item) => (
            <TabsPanel key={item} value={item}>
              <div className="py-5 h-292px border border-gray-9 rounded-32px bg-gray-7 px-7 pb-9">
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
                  <div className="flex-1 flex items-center justify-center">
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
        <div className="py-5 min-h-292px border border-gray-9 rounded-32px bg-gray-7 px-7 pb-9">
          {positions && positions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {positions.map((pos) => (
                <div
                  key={pos.id}
                  className="flex items-center justify-between p-4 bg-gray-15/10 rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={pos.image}
                      alt={pos.asset}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{pos.asset}</span>
                      <span className="text-xs text-white/55">
                        {pos.lockDays > 0 ? `${pos.lockDays}-day fixed` : "Flexible"} · {pos.apy}% APY
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col gap-1 text-right">
                      <span className="font-semibold">{pos.amount} {pos.asset}</span>
                      <span className="text-xs text-success-6">+{pos.earned} earned</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right text-xs text-white/55">
                      <span>Ends {new Date(pos.endDate).toLocaleDateString()}</span>
                      <span className="text-green-400">{pos.status}</span>
                    </div>
                    <button
                      onClick={() => unstake(pos.id)}
                      disabled={unstaking}
                      className="bg-gray-9/20 border border-white/20 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                      {unstaking && <Loader size="xs" color="white" />}
                      Unstake
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-4">
                <EmptyTable />
                <span className="text-xs font-medium text-gray-9">No Positions</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
