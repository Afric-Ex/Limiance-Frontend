import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import classes from "@/src/styles/assets-margin.module.css";
import { FiatBuySell } from "@/src/components/orders/fiat-buy-sell";
import { FiatDeposit } from "@/src/components/orders/fiat-deposit";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { FiatOrdersSkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageHeader } from "@/src/components/orders/orders-page-header";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

function FiatOrdersInner() {
  return (
    <main className="flex flex-col gap-8 px-5 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-6 mt-2">
      <OrdersPageHeader
        icon={<MdOutlineAccountBalanceWallet size={24} />}
        title="Fiat Orders"
        description="Fiat buy/sell orders and deposit / withdrawal records"
      />

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
