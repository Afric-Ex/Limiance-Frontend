"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { p2pKey } from "@/src/services/p2p";
import {
  subscribeP2PGlobalEvents,
  subscribeP2PMatchRoom,
  subscribeP2POrdersFeed,
  type P2PMatchStatusEvent,
} from "@/src/lib/p2p-ws";
import { useWsConnected } from "@/src/hooks/use-ws-connection";

function patchMatchedOrder(
  queryClient: ReturnType<typeof useQueryClient>,
  orderMatchId: string,
  patch: Record<string, unknown>,
  seed = false
) {
  queryClient.setQueryData<any>(p2pKey.matchedOrder(orderMatchId), (current: any) => {
    const body = current?.data;
    if (body && typeof body === "object" && "data" in body) {
      const order = body.data && typeof body.data === "object" ? body.data : {};
      return {
        ...current,
        data: {
          ...body,
          success: true,
          data: { ...order, ...patch },
        },
      };
    }

    if (!seed) return current;

    return {
      ...(current ?? {}),
      data: {
        statusCode: 200,
        success: true,
        message: "",
        data: { ...patch },
      },
    };
  });
}

export function useP2PAdsFeed(params: any) {
  const queryClient = useQueryClient();
  const paramsKey = JSON.stringify(params ?? {});

  useEffect(() => {
    let parsedParams: Record<string, unknown> = {};
    try {
      parsedParams = paramsKey ? JSON.parse(paramsKey) : {};
    } catch {
      parsedParams = {};
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const invalidate = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        queryClient.invalidateQueries({
          queryKey: p2pKey.orderListingRoot,
        });
      }, 750);
    };

    let hasSubscribed = false;
    const unsubscribe = subscribeP2POrdersFeed(parsedParams as any, {
      onSubscribed: () => {
        if (hasSubscribed) invalidate();
        hasSubscribed = true;
      },
      onUpdated: invalidate,
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [paramsKey, queryClient]);
}

export function useP2PMatchRoom(orderMatchId: string) {
  const queryClient = useQueryClient();
  const connected = useWsConnected();

  useEffect(() => {
    if (!orderMatchId) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const invalidate = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        queryClient.invalidateQueries({
          queryKey: p2pKey.matchedOrder(orderMatchId),
        });
        queryClient.invalidateQueries({
          queryKey: p2pKey.allMatchedOrdersRoot,
        });
      }, 600);
    };

    const applyStatus = (event: P2PMatchStatusEvent) => {
      if (!event.status) return;
      patchMatchedOrder(queryClient, orderMatchId, {
        status: event.status,
        updatedAt: event.timestamp ?? new Date().toISOString(),
      });
      invalidate();
    };

    let hasSubscribed = false;
    const unsubscribe = subscribeP2PMatchRoom(orderMatchId, {
      onSubscribed: () => {
        if (hasSubscribed) invalidate();
        hasSubscribed = true;
      },
      onState: (order) => {
        patchMatchedOrder(queryClient, orderMatchId, order, true);
      },
      onStatusChanged: applyStatus,
      onCompleted: (event) => {
        applyStatus({
          ...event,
          status: event.status || "COMPLETED",
        });
      },
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [orderMatchId, queryClient]);

  return { connected };
}

export function useP2PGlobalEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let ordersTimer: ReturnType<typeof setTimeout> | null = null;
    let adsTimer: ReturnType<typeof setTimeout> | null = null;

    const invalidateOrders = () => {
      if (ordersTimer) return;
      ordersTimer = setTimeout(() => {
        ordersTimer = null;
        queryClient.invalidateQueries({
          queryKey: p2pKey.allMatchedOrdersRoot,
        });
      }, 750);
    };

    const invalidateAds = () => {
      if (adsTimer) return;
      adsTimer = setTimeout(() => {
        adsTimer = null;
        queryClient.invalidateQueries({ queryKey: p2pKey.userOrdersRoot });
        queryClient.invalidateQueries({ queryKey: p2pKey.orderListingRoot });
      }, 750);
    };

    const unsubscribe = subscribeP2PGlobalEvents({
      onNewMatch: invalidateOrders,
      onOrdersUpdated: invalidateAds,
      onOrderUpdated: ({ orderId }) => {
        invalidateAds();
        if (orderId) {
          queryClient.invalidateQueries({
            queryKey: p2pKey.orderById(orderId),
          });
        }
      },
      onOrderStatusToggled: invalidateAds,
    });

    return () => {
      if (ordersTimer) clearTimeout(ordersTimer);
      if (adsTimer) clearTimeout(adsTimer);
      unsubscribe();
    };
  }, [queryClient]);
}
