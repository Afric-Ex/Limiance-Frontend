import { api, apiRoot } from "../lib/axios";
import { ApiResponse } from "../types/api";
import {
  AdvertiserInfo,
  AddP2PReviewPayload,
  CreateOrder,
  CreateOrderResponseDatum,
  CreatePaymentMethod,
  CreatePaymentMethodResponse,
  P2PChatMessagesResponse,
  P2PMatchOrder,
  P2POrderListings,
  P2PReleaseOrder,
  PaymentMethodsResponse,
  UserAds,
} from "../types/p2p";

export const p2pKey = {
  orderListing: () => ["order-listing"],
  pendingOrders: ["pending-orders"],
  paymentMethods: () => ["payment-method"],
  becomeAdvertiser: () => ["become-advertiser"],
  advertiserInfo: ["advertiser-info"],
  disputedOrders: ["disputed-orders"],
  allMatchedOrders: (params?: any) => ["all-matched-orders", params],
  matchedOrder: (id: string) => ["matched-order", id],
  orderById: (id: string) => ["order-by-id", id],
  releaseCode: (id: string) => ["release-code", id],
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
    const response = await api.get(`trading/p2p/all_orders`, { params });
    return response;
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
    const response = await api.get(`trading/p2p/get_user_orders`, { params });
    return response;
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

  createOrder: async (data: CreateOrder): Promise<ApiResponse<CreateOrderResponseDatum>> => {
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

  addPaymentMethod: async (data: CreatePaymentMethod): Promise<ApiResponse<CreatePaymentMethodResponse>> => {
    const response = await api.post("/trading/p2p/payment_methods/bank", data);
    return response;
  },

  deletePaymentMethod: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await api.delete(`trading/p2p/payment_methods/${id}`);
    return response;
  },

  matchOrder: async (data: P2PMatchOrder): Promise<ApiResponse<CreatePaymentMethodResponse>> => {
    const response = await api.post("trading/p2p/match_order", data);
    return response;
  },

  releaseOrder: async (data: P2PReleaseOrder): Promise<ApiResponse<CreatePaymentMethodResponse>> => {
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

  fetchChatMessages: async (chatId: string): Promise<ApiResponse<P2PChatMessagesResponse>> => {
    const response = await api.get(`trading/p2p/chats/messages/${chatId}`);
    return response;
  },

  sendMessage: async (data: { chatId: string; content: string }): Promise<ApiResponse<unknown>> => {
    const response = await api.post(`trading/p2p/chats/send/${data.chatId}`, {
      content: data.content,
    });
    return response;
  },

  fetchChats: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<unknown>> => {
    const response = await api.get(`trading/p2p/chats`, { params });
    return response;
  },

  getOrderById: async (id: string): Promise<ApiResponse<unknown>> => {
    return getWithRootFallback(`trading/p2p/get_order_by_id/${id}`);
  },

  getMatchedOrder: async (id: string): Promise<ApiResponse<unknown>> => {
    return getWithRootFallback(`trading/p2p/matched_order/${id}`);
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
    const response = await api.get(`trading/p2p/all_matched_orders`, { params });
    return response;
  },

  updateMatchedOrder: async (data: {
    orderMatchId: string;
    status: string;
    [key: string]: unknown;
  }): Promise<ApiResponse<unknown>> => {
    // /api/v1 prefix is required — apiRoot (no prefix) returns 404 for this endpoint
    const response = await api.patch(`trading/p2p/update_matched_order`, data);
    return response;
  },


  getReleaseCode: async (id: string): Promise<ApiResponse<unknown>> => {
    // Must use `api` (with /api/v1 prefix) — apiRoot misses the prefix so OTP email was never sent
    const response = await api.get(`trading/p2p/get_release_order_code/${id}`);
    return response;
  },

  addReview: async (data: AddP2PReviewPayload): Promise<ApiResponse<unknown>> => {
    const response = await api.post(`trading/p2p/add_review`, data);
    return response;
  },

  deactivateAllOrders: async (): Promise<ApiResponse<unknown>> => {
    const response = await api.get(`trading/p2p/deactivate_orders`);
    return response;
  },

  reactivateAllOrders: async (): Promise<ApiResponse<unknown>> => {
    const response = await api.get(`trading/p2p/reactivate_orders`);
    return response;
  },

  deactivateSingleOrder: async (id: string): Promise<ApiResponse<unknown>> => {
    const response = await api.get(`trading/p2p/deactivate_single_order/${id}`);
    return response;
  },

  reactivateSingleOrder: async (id: string): Promise<ApiResponse<unknown>> => {
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
