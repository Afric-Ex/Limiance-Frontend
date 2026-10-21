import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import { toast } from "react-hot-toast";
import { useUserStore } from "@/src/stores/user-store";
import { wsClient } from "@/src/lib/websocket-client";
import { readMatchId } from "@/src/lib/p2p-ws";

interface MatchNotice {
  id: string;
  asset?: string;
  quantity?: unknown;
  amount?: unknown;
  fiat?: string;
  orderType?: string;
}

export function GlobalP2PNotification() {
  const user = useUserStore((state) => state.user);
  const userId = user?.id;
  const knownIds = useRef<Set<string>>(new Set());
  const notifiedIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const notify = useCallback(
    (notice: MatchNotice) => {
      if (!userId || !notice.id || notifiedIds.current.has(notice.id)) return;
      notifiedIds.current.add(notice.id);
      knownIds.current.add(notice.id);

      const asset = notice.asset ? String(notice.asset).toUpperCase() : "";
      const quantity = Number(notice.quantity);
      const amount = Number(notice.amount);
      const size =
        asset && Number.isFinite(quantity) && quantity > 0
          ? ` for ${quantity.toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })} ${asset}`
          : Number.isFinite(amount) && amount > 0
            ? ` (${amount.toLocaleString()} ${notice.fiat ?? ""})`
            : "";
      const orderType = notice.orderType ? ` ${notice.orderType}` : "";

      toast.success(
        `New${orderType} P2P trade started\n\nA user has started a new trade with you${size}.`,
        { duration: 10000 }
      );

      import("@/src/stores/notification-store").then(({ useNotificationStore }) => {
        useNotificationStore.getState().addNotification({
          title: `New${orderType} P2P order`,
          body: `A user has started a new trade with you${size}.`,
          type: "p2p_order",
          link: `/trades/p2p/order/${notice.id}`,
        });
      });
    },
    [userId]
  );

  const { data } = useQuery({
    queryKey: p2pKey.allMatchedOrders(undefined),
    queryFn: () => p2p.getAllMatchedOrders(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!userId) return;
    return wsClient.subscribe("p2p_new_match", null, (payload) => {
      const id = readMatchId(payload);
      if (!id) return;
      const match = payload?.orderMatch ?? payload?.order_match ?? {};
      notify({
        id,
        asset: match.asset,
        quantity: match.quantity,
        amount: match.amount ?? match.fiatAmount,
        fiat: match.fiat,
        orderType: match.type,
      });
    });
  }, [userId, notify]);

  useEffect(() => {
    const orders: any[] = (data as any)?.data?.data ?? [];

    if (!initialized.current) {
      if (data !== undefined) {
        orders.forEach((order) => {
          if (order?.id) knownIds.current.add(String(order.id));
        });
        initialized.current = true;
      }
      return;
    }

    orders.forEach((order) => {
      const id = String(order?.id ?? "");
      if (!id || knownIds.current.has(id)) return;
      knownIds.current.add(id);

      if (!order?.matcherId || !userId) return;
      if (order.matcherId === userId) return;

      notify({
        id,
        asset: order?.asset,
        quantity: order?.quantity,
        amount: order?.amount ?? order?.fiatAmount,
        fiat: order?.fiat ?? order?.fiatCurrency,
        orderType: order?.type,
      });
    });
  }, [data, userId, notify]);

  return null;
}
