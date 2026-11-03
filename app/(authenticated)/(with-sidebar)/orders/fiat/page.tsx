import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { FiatBuySell } from "@/src/components/orders/fiat-buy-sell";
import { FiatDeposit } from "@/src/components/orders/fiat-deposit";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { FiatOrdersSkeleton } from "@/src/components/skeletons/orders";
import { OrdersPageFrame, ordersTabsClassNames } from "@/src/components/orders/orders-shared";

function FiatOrdersInner() {
  return (
    <OrdersPageFrame
      title="Fiat orders"
      description="Review fiat purchases, sales, deposits and withdrawals."
      actionLabel="Buy crypto"
      actionHref="/buy-crypto"
    >
      <Tabs classNames={ordersTabsClassNames} defaultValue="buy">
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
    </OrdersPageFrame>
  );
}

export default function FiatOrders() {
  return (
    <PageSuspense fallback={<FiatOrdersSkeleton />}>
      <FiatOrdersInner />
    </PageSuspense>
  );
}
