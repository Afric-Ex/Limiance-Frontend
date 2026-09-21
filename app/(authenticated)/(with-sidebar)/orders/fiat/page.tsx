import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { FiatBuySell } from "@/src/components/orders/fiat-buy-sell";
import { FiatDeposit } from "@/src/components/orders/fiat-deposit";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { FiatOrdersSkeleton } from "@/src/components/skeletons/orders";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

function FiatOrdersInner() {
  return (
    <main className="flex flex-col gap-6 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4 mt-2">
      {/* Page header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
          <MdOutlineAccountBalanceWallet size={22} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
            Fiat Orders
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Fiat buy/sell orders and deposit / withdrawal records
          </p>
        </div>
      </div>

      <Tabs classNames={classes} defaultValue="buy">
        <TabsList>
          <TabsTab value="buy">Buy (Sell)</TabsTab>
          <TabsTab value="deposit">Deposit (Withdraw)</TabsTab>
        </TabsList>

        <TabsPanel value="buy">
          <FiatBuySell />
        </TabsPanel>
        <TabsPanel value="deposit">
          <FiatDeposit />
        </TabsPanel>
      </Tabs>
    </main>
  );
}

export default function FiatOrders() {
  return (
    <PageSuspense fallback={<FiatOrdersSkeleton />}>
      <FiatOrdersInner />
    </PageSuspense>
  );
}
