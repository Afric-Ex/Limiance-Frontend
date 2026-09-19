import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import { toast } from "react-hot-toast";
import { useUserStore } from "@/src/stores/user-store";

export function GlobalP2PNotification() {
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const user = useUserStore((state) => state.user);

  // Poll for all matched orders every 5 seconds globally
  const { data } = useQuery({
    queryKey: p2pKey.allMatchedOrders(undefined),
    queryFn: () => p2p.getAllMatchedOrders(),
    refetchInterval: 5000,
    staleTime: 0,
  });

  useEffect(() => {
    const orders: any[] = (data as any)?.data?.data ?? [];
    
    if (!isInitialized) {
      if (orders.length > 0) {
        setKnownOrderIds(new Set(orders.map((o) => o.id)));
      }
      if (data !== undefined) {
        setIsInitialized(true);
      }
      return;
    }

    const currentOrderIds = new Set(orders.map((o) => o.id));
    
    // Check for any new order IDs that we didn't know about before
    const newOrders = orders.filter((o) => !knownOrderIds.has(o.id));
    
    if (newOrders.length > 0) {
      // Fire notification!
      newOrders.forEach((o) => {
        const isMatcher = Boolean(o.matcherId && user?.id && o.matcherId === user.id);
        const isAdvertiser = !isMatcher && Boolean(o.matcherId && user?.id);

        if (isAdvertiser) {
          const orderType = o.type ?? "P2P";
          toast.success(`You have a new ${orderType} order!\n\nA user has started a new trade with you.`, {
            duration: 10000,
          });

          // Also surface it in the bell/store so it isn't lost once the toast expires
          import("@/src/stores/notification-store").then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
              title: `New ${orderType} order`,
              body: `A user has started a new trade with you${o.amount ? ` for ${o.amount}` : ""}.`,
              type: "p2p_order",
              link: `/trades/p2p/order/${o.id}`,
            });
          });
        }
      });
      setKnownOrderIds(currentOrderIds);
    }
  }, [data, isInitialized, knownOrderIds, user?.id]);

  return null;
}
