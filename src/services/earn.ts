import { api } from "../lib/axios";

export const earnKeys = {
  products: ["earn-products"] as const,
  myPositions: ["earn-my-positions"] as const,
} as const;

export const earnService = {
  fetchProducts: async () => {
    const response = await api.get("earn/products");
    return response.data;
  },

  subscribe: async (data: { productId: string; amount: string }) => {
    const response = await api.post("earn/subscribe", data);
    return response.data;
  },

  unstake: async (data: { subscriptionId: string }) => {
    const response = await api.post("earn/unstake", data);
    return response.data;
  },

  myPositions: async () => {
    const response = await api.get("earn/positions");
    return response.data;
  },
};
