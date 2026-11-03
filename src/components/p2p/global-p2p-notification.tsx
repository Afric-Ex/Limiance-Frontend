import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import { toast } from "react-hot-toast";
import { useUserStore } from "@/src/stores/user-store";
import { wsClient } from "@/src/lib/websocket-client";
import { readMatchId } from "@/src/lib/p2p-ws";

interface MatchNotice {
  id: string;
  orderId?: string;
  asset?: string;
  quantity?: unknown;
  amount?: unknown;
  price?: unknown;
  fiat?: string;
  orderType?: string;
}

const NOTIFIED_STORAGE_KEY = "p2p-notified-matches";

function readStoredIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(NOTIFIED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function persistIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      NOTIFIED_STORAGE_KEY,
      JSON.stringify(Array.from(ids).slice(-200))
    );
  } catch {
    // Storage can be unavailable (private mode); in-memory dedupe still works.
  }
}

function toPositiveNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function GlobalP2PNotification() {
  const user = useUserStore((state) => state.user);
  const userId = user?.id != null ? String(user.id) : "";
  const knownIds = useRef<Set<string>>(new Set());
  const notifiedIds = useRef<Set<string>>(readStoredIds());
  const initialized = useRef(false);

  const notify = useCallback(
    (notice: MatchNotice) => {
      if (!userId || !notice.id) return;
      // Each match can surface through the WS push and the polling fallback.
      // Dedupe by both match id and advertisement id, and persist the result so
      // a component remount cannot re-announce the same match.
      const keys = [notice.id, notice.orderId].filter(Boolean).map(String);
      if (keys.some((key) => notifiedIds.current.has(key))) return;
      keys.forEach((key) => {
        notifiedIds.current.add(key);
        knownIds.current.add(key);
      });
      persistIds(notifiedIds.current);

      const asset = notice.asset ? String(notice.asset).toUpperCase() : "";
      const quantity = toPositiveNumber(notice.quantity);
      const price = toPositiveNumber(notice.price);
      const amount =
        toPositiveNumber(notice.amount) ??
        (quantity && price ? quantity * price : undefined);

      const cryptoPart =
        asset && quantity
          ? `${quantity.toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })} ${asset}`
          : "";
      const fiatPart =
        amount && amount > 0
          ? `${amount.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} ${notice.fiat ?? ""}`.trim()
          : "";

      const sizeParts = [cryptoPart, fiatPart].filter(Boolean);
      const size = sizeParts.length ? ` for ${sizeParts.join(" (")}${sizeParts.length > 1 ? ")" : ""}` : "";
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

      // `p2p_new_match` is delivered to the advertiser. Ignore echoes where the
      // signed-in user is the taker (or is explicitly a different advertiser).
      const advertiserId = match.advertiserId ?? match.advertiser_id;
      const matcherId = match.matcherId ?? match.matcher_id;
      if (advertiserId && String(advertiserId) !== userId) return;
      if (matcherId && String(matcherId) === userId) return;

      notify({
        id,
        orderId: match.orderId ?? match.order_id,
        asset: match.asset,
        quantity: match.quantity,
        amount: match.amount ?? match.fiatAmount ?? match.fiat_amount,
        price: match.price ?? match.fixedPrice ?? match.fixed_price ?? match.rate,
        fiat: match.fiat ?? match.fiatCurrency ?? match.fiat_currency,
        orderType: match.type ?? match.orderType ?? match.order_type,
      });
    });
  }, [userId, notify]);

  useEffect(() => {
    const orders: any[] = (data as any)?.data?.data ?? [];

    if (!initialized.current) {
      if (data !== undefined) {
        orders.forEach((order) => {
          if (order?.id) knownIds.current.add(String(order.id));
          if (order?.orderId) knownIds.current.add(String(order.orderId));
        });
        initialized.current = true;
      }
      return;
    }

    orders.forEach((order) => {
      const id = String(order?.id ?? "");
      if (!id || knownIds.current.has(id) || notifiedIds.current.has(id)) return;
      knownIds.current.add(id);

      if (!userId) return;
      // Notify only the advertiser (the owner of the matched ad), never the
      // taker who initiated the match or unrelated users.
      const advertiserId = order?.advertiserId ?? order?.advertiser_id;
      const matcherId = order?.matcherId ?? order?.matcher_id;
      const buyerId = order?.buyerId ?? order?.buyer_id;
      const sellerId = order?.sellerId ?? order?.seller_id;
      const adType = String(order?.type ?? order?.order?.type ?? "").toUpperCase();
      const adOwnerId =
        adType === "BUY" ? buyerId : adType === "SELL" ? sellerId : undefined;
      const isAdvertiser =
        (advertiserId && String(advertiserId) === userId) ||
        (adOwnerId && String(adOwnerId) === userId);
      if (matcherId && String(matcherId) === userId) return;
      if (!isAdvertiser && (advertiserId || adOwnerId)) return;

      notify({
        id,
        orderId: order?.orderId ?? order?.order_id,
        asset: order?.asset,
        quantity: order?.quantity,
        amount: order?.amount ?? order?.fiatAmount ?? order?.fiat_amount,
        price:
          order?.price ??
          order?.fixedPrice ??
          order?.fixed_price ??
          order?.adPrice ??
          order?.rate,
        fiat: order?.fiat ?? order?.fiatCurrency ?? order?.fiat_currency,
        orderType: order?.type,
      });
    });
  }, [data, userId, notify]);

  return null;
}
