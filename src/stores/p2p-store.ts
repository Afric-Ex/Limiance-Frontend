import { create } from "zustand";

export interface Ad {
  id: string;
  type: "BUY" | "SELL";
  asset: string;
  fiat: string;
  price: number;
  availableQuantity: number;
  minQuantity: number;
  maxQuantity: number;
  paymentMethods: string[];
  advertiser: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    verified: boolean;
    trades: number;
    completionRate: number;
    responseTime: string;
    totalOrdersCompleted?: number;
    completionPercentage?: string;
  };
}

export interface AdFilters {
  type: "BUY" | "SELL";
  asset: string;
  fiat: string;
  amount: string;
  paymentMethod: string;
}

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "RELEASED" | "COMPLETED" | "CANCELLED" | "DISPUTED";

export interface P2POrder {
  id: string;
  type: "BUY" | "SELL";
  asset: string;
  fiat: string;
  price: number;
  cryptoAmount: number;
  fiatAmount: number;
  status: OrderStatus;
  paymentWindowMinutes: number;
  createdAt: string;
  counterparty: {
    id: string;
    name: string;
  };
  paymentMethod: {
    method: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "system";
  imageUrl?: string;
  createdAt: string;
}

export interface AdvertiserStatus {
  isAdvertiser: boolean;
  requirements: {
    kycLevel2: boolean;
    accountAgeDays: number;
    fundingAccountActive: boolean;
  };
}

interface P2PStore {
  // Marketplace
  ads: Ad[];
  adsLoading: boolean;
  adFilters: AdFilters;
  setAdFilters: (filters: Partial<AdFilters>) => void;
  fetchAds: () => Promise<void>;

  // Active Order (order room)
  activeOrder: P2POrder | null;
  orderLoading: boolean;
  fetchOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (status: OrderStatus) => void;

  // Chat
  messages: ChatMessage[];
  isConnected: boolean;
  isChatLoading: boolean;
  counterpartyTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (content: string) => Promise<void>;
  sendImage: (file: File) => Promise<void>;
  setIsConnected: (connected: boolean) => void;

  // Advertiser
  isAdvertiser: boolean;
  advertiserStatus: AdvertiserStatus | null;
  fetchAdvertiserStatus: () => Promise<void>;

  // My Ads
  myAds: Ad[];
  myAdsLoading: boolean;
  fetchMyAds: () => Promise<void>;
}

export const useP2PStore = create<P2PStore>((set, get) => ({
  // Marketplace
  ads: [],
  adsLoading: false,
  adFilters: {
    type: "BUY",
    asset: "USDT",
    fiat: "USD",
    amount: "",
    paymentMethod: "All",
  },
  setAdFilters: (filters) => set((state) => ({ adFilters: { ...state.adFilters, ...filters } })),
  fetchAds: async () => {
    set({ adsLoading: true });
    // TODO: implement API call
    set({ adsLoading: false });
  },

  // Active Order
  activeOrder: null,
  orderLoading: false,
  fetchOrder: async (orderId) => {
    set({ orderLoading: true });
    // TODO: implement API call
    set({ orderLoading: false });
  },
  updateOrderStatus: (status) => set((state) => ({
    activeOrder: state.activeOrder ? { ...state.activeOrder, status } : null
  })),

  // Chat
  messages: [],
  isConnected: false,
  isChatLoading: false,
  counterpartyTyping: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  sendMessage: async (content) => {
    // TODO: implement WebSocket / API
  },
  sendImage: async (file) => {
    // TODO: implement API upload & WS message
  },
  setIsConnected: (connected) => set({ isConnected: connected }),

  // Advertiser
  isAdvertiser: false,
  advertiserStatus: null,
  fetchAdvertiserStatus: async () => {
    // TODO: implement API
  },

  // My Ads
  myAds: [],
  myAdsLoading: false,
  fetchMyAds: async () => {
    set({ myAdsLoading: true });
    // TODO: implement API
    set({ myAdsLoading: false });
  },
}));
