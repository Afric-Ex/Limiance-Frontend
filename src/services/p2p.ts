import type { EditP2POrderInput, P2PAdsQueryParams } from "../lib/p2p-ws";
import { api, apiRoot } from "../lib/axios";
import { ApiResponse } from "../types/api";
import {
  AdvertiserInfo,
  AddP2PReviewPayload,
  CreateOrder,
  CreateOrderResponseDatum,
  CreatePaymentMethod,
  CreatePaymentMethodResponse,
  P2PChatMessage,
  P2PMatchOrder,
  P2POrderListings,
  P2PReleaseOrder,
  PaymentMethodsResponse,
  UserAds,
} from "../types/p2p";

export const p2pKey = {
  orderListing: () => ["order-listing"],
  orderListingRoot: ["order-listing"],
  pendingOrders: ["pending-orders"],
  paymentMethods: () => ["payment-method"],
  becomeAdvertiser: () => ["become-advertiser"],
  advertiserInfo: ["advertiser-info"],
  disputedOrders: ["disputed-orders"],
  allMatchedOrders: (params?: any) => ["all-matched-orders", params],
  allMatchedOrdersRoot: ["all-matched-orders"],
  matchedOrder: (id: string) => ["matched-order", id],
  orderById: (id: string) => ["order-by-id", id],
  orderByIdRoot: ["order-by-id"],
  chats: ["p2p-chats"],
  userOrders: (params?: {
    type?: string;
    currency?: string;
    asset?: string;
    minimum_quantity?: string;
    available_quantity?: string;
    payment_method?: string;
    country?: string;
    start_date?: string;
    end_date?: string;
    status?: "true" | "false";
    page?: number;
    limit?: number;
  }) => ["user-orders", params],
  userOrdersRoot: ["user-orders"],
  chatMessages: (chatId: string) => ["chat-messages", chatId],
  fetchOrderListing: (params?: {
    type?: string;
    currency?: string;
    asset?: string;
    minimum_quantity?: string;
    available_quantity?: string;
    payment_method?: string;
    country?: string;
    start_date?: string;
    end_date?: string;
    status?: "true" | "false";
    page?: number;
    limit?: number;
  }) => ["all-orders", params],
};

const assetLogoMap: Record<string, string> = {
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
};

const getWithRootFallback = async <T = unknown>(path: string): Promise<ApiResponse<T>> => {
  try {
    return await api.get(path);
  } catch (error: any) {
    if (![400, 404].includes(error?.response?.status)) throw error;
    return apiRoot.get(path);
  }
};

/** Accepts the WS `{ messages: [...] }` payload and the REST envelopes. */
const normalizeChatMessages = (raw: any): P2PChatMessage[] => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.messages)
      ? raw.messages
      : Array.isArray(raw?.data?.messages)
        ? raw.data.messages
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : [];
  const chatId = String(raw?.chatId ?? raw?.chat_id ?? "");

  return list.map((message: any) => {
    const senderId = String(message.senderId ?? message.sender_id ?? "");
    const content = String(message.content ?? message.message ?? "");
    const createdAt = String(message.createdAt ?? message.created_at ?? "");

    return {
      id: String(
        message.id ??
          message._id ??
          message.messageId ??
          `${chatId}:${senderId}:${createdAt}:${content}`
      ),
      content,
      senderId,
      createdAt,
    };
  });
};

const loadP2PWs = () => import("../lib/p2p-ws");

const shouldFallbackToRest = (error: unknown): boolean =>
  (error as { isTransport?: boolean } | null)?.isTransport !== false;

const withWsFallback = async <T>(
  restCall: () => Promise<T>,
  wsCall: () => Promise<T>
): Promise<T> => {
  try {
    return await restCall();
  } catch (restError) {
    if (typeof window === "undefined") throw restError;
    try {
      return await wsCall();
    } catch {
      throw restError;
    }
  }
};

const withRestFallback = async <T>(
  wsCall: () => Promise<T>,
  restCall: () => Promise<T>
): Promise<T> => {
  if (typeof window !== "undefined") {
    try {
      return await wsCall();
    } catch (error) {
      if (!shouldFallbackToRest(error)) throw error;
    }
  }
  return restCall();
};

const toggleAllOrdersRequest = async (
  action: "deactivate" | "reactivate"
): Promise<ApiResponse<unknown>> => {
  if (typeof window !== "undefined") {
    try {
      const { toggleP2POrderStatusWs } = await loadP2PWs();
      const payload = await toggleP2POrderStatusWs({ action });
      return { data: payload } as unknown as ApiResponse<unknown>;
    } catch (error) {
      if (!shouldFallbackToRest(error)) throw error;
    }
  }
  const endpoint =
    action === "deactivate" ? "deactivate_orders" : "reactivate_orders";
  return api.get(`trading/p2p/${endpoint}`);
};

export const p2p = {
  fetchOrderListing: async (params?: {
    type?: string;
    currency?: string;
    asset?: string;
    minimum_quantity?: string;
    available_quantity?: string;
    payment_method?: string;
    country?: string;
    start_date?: string;
    end_date?: string;
    status?: "true" | "false";
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<P2POrderListings>> => {
    return withWsFallback(
      async () => api.get(`trading/p2p/all_orders`, { params }),
      async () => {
        const { getP2POrdersWs, normalizeWsP2POrdersResponse } = await loadP2PWs();
        const payload = await getP2POrdersWs(params as P2PAdsQueryParams);
        return {
          data: normalizeWsP2POrdersResponse(payload),
        } as unknown as ApiResponse<P2POrderListings>;
      }
    );
  },

  userOrders: async (params?: {
    type?: string;
    currency?: string;
    asset?: string;
    minimum_quantity?: string;
    available_quantity?: string;
    payment_method?: string;
    country?: string;
    start_date?: string;
    end_date?: string;
    status?: "true" | "false";
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<UserAds>> => {
    return withWsFallback(
      async () => api.get(`trading/p2p/get_user_orders`, { params }),
      async () => {
        const { getUserP2POrdersWs, normalizeWsP2PUserAdsResponse } =
          await loadP2PWs();
        const payload = await getUserP2POrdersWs(params as P2PAdsQueryParams);
        return {
          data: normalizeWsP2PUserAdsResponse(payload),
        } as unknown as ApiResponse<UserAds>;
      }
    );
  },

  pendingOrders: async (params?: {
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<P2POrderListings>> => {
    const response = await api.get(`trading/p2p/pending_orders`, { params });
    return response;
  },

  advertiserInfo: (): Promise<ApiResponse<AdvertiserInfo>> =>
    api.get("trading/p2p/advertiser_info"),

  becomeAdvertiser: async () => {
    const response = await api.get("trading/p2p/become_an_advertiser");
    return response;
  },

  createOrder: async (
    data: CreateOrder,
    paymentMethodNames?: string[]
  ): Promise<ApiResponse<CreateOrderResponseDatum>> => {
    if (typeof window !== "undefined") {
      try {
        const { createP2POrderWs } = await loadP2PWs();
        const payload = await createP2POrderWs(data, paymentMethodNames);
        return {
          data: payload,
        } as unknown as ApiResponse<CreateOrderResponseDatum>;
      } catch (error) {
        if (!shouldFallbackToRest(error)) throw error;
      }
    }

    const response = await api.post("trading/p2p/create_order", {
      ...data,
      active: true,
      // Prefer the logo the caller resolved from `listed_tokens`; the local
      // map only covers the handful of majors and returns "" for the rest.
      assetLogo: data.assetLogo || assetLogoMap[data.asset.toUpperCase()] || "",
      quantity: data.quantity ? +data.quantity : null,
      minQuantity: data.minQuantity ? +data.minQuantity : null,
      maxQuantity: data.maxQuantity ? +data.maxQuantity : null,
      allCompletedOrders: data?.allCompletedOrders ? +data.allCompletedOrders : null,
      completedOrders: data?.completedOrders ? +data.completedOrders : null,
      daysSinceAccountCreation: data?.daysSinceAccountCreation ? +data.daysSinceAccountCreation : null,
      fixedPrice: data.fixedPrice ? +data.fixedPrice : null,
    });
    return response;
  },

  editOrder: async (
    id: string,
    data: EditP2POrderInput
  ): Promise<ApiResponse<unknown>> => {
    if (typeof window === "undefined") {
      throw new Error("Ad editing requires a live WebSocket connection");
    }
    const { editP2POrderWs } = await loadP2PWs();
    const payload = await editP2POrderWs(id, data);
    return { data: payload } as unknown as ApiResponse<unknown>;
  },

  addPaymentMethod: async (data: CreatePaymentMethod): Promise<ApiResponse<CreatePaymentMethodResponse>> => {
    const response = await api.post("/trading/p2p/payment_methods/bank", data);
    return response;
  },

  deletePaymentMethod: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await api.delete(`trading/p2p/payment_methods/${id}`);
    return response;
  },

  matchOrder: async (data: P2PMatchOrder): Promise<ApiResponse<CreatePaymentMethodResponse>> => {
    if (typeof window !== "undefined") {
      try {
        const { matchP2POrderWs } = await loadP2PWs();
        const payload = await matchP2POrderWs({
          orderId: data.orderId,
          quantity: data.quantity,
          paymentMethodId: data.paymentMethodId,
        });
        return {
          data: payload,
        } as unknown as ApiResponse<CreatePaymentMethodResponse>;
      } catch (error) {
        if (!shouldFallbackToRest(error)) throw error;
      }
    }

    const response = await api.post("trading/p2p/match_order", data);
    return response;
  },

  releaseOrder: async (data: P2PReleaseOrder): Promise<ApiResponse<CreatePaymentMethodResponse>> => {
    if (typeof window !== "undefined") {
      try {
        const { releaseP2POrderWs } = await loadP2PWs();
        const payload = await releaseP2POrderWs({
          orderMatchId: data.id,
          releaseCode: data.releaseCode,
          totpCode: data.totpCode,
        });
        return {
          data: payload,
        } as unknown as ApiResponse<CreatePaymentMethodResponse>;
      } catch (error) {
        if (!shouldFallbackToRest(error)) throw error;
      }
    }

    // Must use `api` (with /api/v1 prefix) — apiRoot misses the prefix and returns 404
    const response = await api.post(`trading/p2p/release_order/${data.id}`, {
      releaseCode: data.releaseCode,
      ...(data.totpCode ? { totpCode: data.totpCode } : {}),
    });
    return response;
  },

  fetchPaymentMethod: async (): Promise<ApiResponse<PaymentMethodsResponse>> => {
    const response = await api.get("trading/p2p/payment_methods");
    return response;
  },

  fetchChatMessages: async (
    chatId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ data: P2PChatMessage[] }> => {
    // P2P order chat is WebSocket-only (§8.3–8.4): get_chat_messages is sent on
    // the trading socket and answered with chat_messages.
    const { getChatMessagesWs } = await import("../lib/chat-ws");
    const payload = await getChatMessagesWs(chatId, params);
    return { data: normalizeChatMessages(payload) };
  },

  sendMessage: async (data: { chatId: string; content: string }): Promise<any> => {
    // P2P order chat is WebSocket-only (§8.1): chat_message is answered with
    // the new_chat_message delivery frame.
    const { sendChatMessageWs } = await import("../lib/chat-ws");
    return sendChatMessageWs(data.chatId, data.content);
  },

  fetchChats: async (params?: { page?: number; limit?: number }): Promise<any> => {
    // Primary: get_chats over the trading socket (§8.2).
    if (typeof window !== "undefined") {
      try {
        const { getChatsWs } = await import("../lib/chat-ws");
        return await getChatsWs();
      } catch {
        // Fall back to REST below.
      }
    }

    const response = await api.get(`trading/p2p/chats`, { params });
    return response;
  },

  getOrderById: async (id: string): Promise<ApiResponse<unknown>> => {
    return getWithRootFallback(`trading/p2p/get_order_by_id/${id}`);
  },

  getMatchedOrder: async (id: string): Promise<ApiResponse<unknown>> => {
    return withRestFallback(
      async () => {
        const { getP2PMatchWs, normalizeWsP2PMatchResponse } =
          await loadP2PWs();
        const payload = await getP2PMatchWs(id);
        return {
          data: normalizeWsP2PMatchResponse(payload),
        } as unknown as ApiResponse<unknown>;
      },
      () => getWithRootFallback(`trading/p2p/matched_order/${id}`)
    );
  },

  getAllMatchedOrders: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    asset?: string;
    currency?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<ApiResponse<unknown>> => {
    return withRestFallback(
      async () => {
        const { getUserP2PMatchesWs, normalizeWsUserMatchesResponse } =
          await loadP2PWs();
        const payload = await getUserP2PMatchesWs({
          status: params?.status,
          type: params?.type,
          page: params?.page,
          limit: params?.limit,
        });
        return {
          data: normalizeWsUserMatchesResponse(payload),
        } as unknown as ApiResponse<unknown>;
      },
      () => api.get(`trading/p2p/all_matched_orders`, { params })
    );
  },

  updateMatchedOrder: async (data: {
    orderMatchId: string;
    status: string;
    [key: string]: unknown;
  }): Promise<ApiResponse<unknown>> => {
    if (typeof window !== "undefined") {
      try {
        const { updateP2PMatchStatusWs } = await loadP2PWs();
        const payload = await updateP2PMatchStatusWs(
          data.orderMatchId,
          data.status
        );
        return { data: payload } as unknown as ApiResponse<unknown>;
      } catch (error) {
        if (!shouldFallbackToRest(error)) throw error;
      }
    }

    // /api/v1 prefix is required — apiRoot (no prefix) returns 404 for this endpoint
    const response = await api.patch(`trading/p2p/update_matched_order`, data);
    return response;
  },


  getReleaseCode: async (id: string): Promise<ApiResponse<unknown>> => {
    if (typeof window !== "undefined") {
      try {
        const { requestP2PReleaseCodeWs } = await loadP2PWs();
        const payload = await requestP2PReleaseCodeWs(id);
        return { data: payload } as unknown as ApiResponse<unknown>;
      } catch (error) {
        if (!shouldFallbackToRest(error)) throw error;
      }
    }

    // Must use `api` (with /api/v1 prefix) — apiRoot misses the prefix so OTP email was never sent
    const response = await api.get(`trading/p2p/get_release_order_code/${id}`);
    return response;
  },

  addReview: async (data: AddP2PReviewPayload): Promise<ApiResponse<unknown>> => {
    const response = await api.post(`trading/p2p/add_review`, data);
    return response;
  },

  deactivateAllOrders: async (): Promise<ApiResponse<unknown>> => {
    return toggleAllOrdersRequest("deactivate");
  },

  reactivateAllOrders: async (): Promise<ApiResponse<unknown>> => {
    return toggleAllOrdersRequest("reactivate");
  },

  toggleAllOrders: toggleAllOrdersRequest,

  deactivateSingleOrder: async (id: string): Promise<ApiResponse<unknown>> => {
    if (typeof window !== "undefined") {
      try {
        const { deactivateP2POrderWs } = await loadP2PWs();
        const payload = await deactivateP2POrderWs(id);
        return { data: payload } as unknown as ApiResponse<unknown>;
      } catch (error) {
        if (!shouldFallbackToRest(error)) throw error;
      }
    }

    const response = await api.get(`trading/p2p/deactivate_single_order/${id}`);
    return response;
  },

  reactivateSingleOrder: async (id: string): Promise<ApiResponse<unknown>> => {
    if (typeof window !== "undefined") {
      try {
        const { reactivateP2POrderWs } = await loadP2PWs();
        const payload = await reactivateP2POrderWs(id);
        return { data: payload } as unknown as ApiResponse<unknown>;
      } catch (error) {
        if (!shouldFallbackToRest(error)) throw error;
      }
    }

    const response = await api.get(`trading/p2p/reactivate_single_order/${id}`);
    return response;
  },

  getDisputedOrders: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<unknown>> => {
    const response = await api.get(`trading/p2p/advertiser_disputed_orders`, { params });
    return response;
  },

  getSellerPaymentMethodsById: async (id: string, params?: { query?: string }): Promise<ApiResponse<unknown>> => {
    const response = await api.get(`trading/p2p/get_payment_by_method_by_id/${id}`, { params });
    return response;
  },
};
