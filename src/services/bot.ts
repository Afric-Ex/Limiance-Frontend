import { api } from "../lib/axios";

export const botKeys = {
  tradingHistory: (type: "spot" | "futures") => ["bot-history", type],
  activeBots: (type: "spot" | "futures") => ["active-bots", type],
};

export type BotType = "spot" | "futures";

export interface Bot {
  id: string;
  type: BotType;
  pair: string;
  strategy: string;
  investmentAmount: number;
  asset: string;
  status: "active" | "paused" | "stopped";
  roi: number;
  pnl: number;
  createdAt: string;
}

export interface BotTradeHistory {
  id: string;
  botId: string;
  pair: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  roi: number;
  pnl: number;
  createdAt: string;
}

export const botService = {
  createBot: async (data: {
    type: BotType;
    pair: string;
    strategy: string;
    investmentAmount: number;
    asset: string;
  }) => {
    const response = await api.post("trading/bot/create", data);
    return response.data;
  },

  tradingHistory: async (data: { type: BotType; page?: number; limit?: number }) => {
    const response = await api.post("trading/bot/trading_history", data);
    return response.data;
  },

  getActiveBots: async (type: BotType) => {
    const response = await api.get("trading/bot/list", { params: { type } });
    return response.data;
  },

  stopBot: async (botId: string) => {
    const response = await api.post(`trading/bot/stop`, { botId });
    return response.data;
  },
};
