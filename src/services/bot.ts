import { api } from "../lib/axios";
import { MOCK_MODE } from "../mocks";

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

const MOCK_BOTS: Bot[] = [
  { id: "bot_1", type: "spot", pair: "BTC/USDT", strategy: "DCA", investmentAmount: 100, asset: "BTC", status: "active", roi: 4.2, pnl: 4.2, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "bot_2", type: "spot", pair: "ETH/USDT", strategy: "Grid", investmentAmount: 200, asset: "ETH", status: "active", roi: -1.1, pnl: -2.2, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
];

const MOCK_BOT_HISTORY: BotTradeHistory[] = [
  { id: "bh_1", botId: "bot_1", pair: "BTC/USDT", side: "buy", quantity: 0.001, price: 67000, total: 67, roi: 2.1, pnl: 1.4, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "bh_2", botId: "bot_1", pair: "BTC/USDT", side: "sell", quantity: 0.001, price: 67500, total: 67.5, roi: 4.2, pnl: 0.5, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "bh_3", botId: "bot_2", pair: "ETH/USDT", side: "buy", quantity: 0.05, price: 3200, total: 160, roi: -1.1, pnl: -1.76, createdAt: new Date(Date.now() - 7200000).toISOString() },
];

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

export const botService = {
  createBot: async (data: {
    type: BotType;
    pair: string;
    strategy: string;
    investmentAmount: number;
    asset: string;
  }) => {
    if (MOCK_MODE.tradingBot) {
      await delay(800);
      return { statusCode: 200, success: true, message: "Bot created successfully", data: { id: "bot_mock_" + Date.now(), ...data, status: "active", roi: 0, pnl: 0 } };
    }
    const response = await api.post("trading/bot/create", data);
    return response.data;
  },

  tradingHistory: async (data: { type: BotType; page?: number; limit?: number }) => {
    if (MOCK_MODE.tradingBot) {
      await delay(500);
      const filtered = MOCK_BOT_HISTORY.filter(h =>
        MOCK_BOTS.find(b => b.id === h.botId && b.type === data.type)
      );
      return { statusCode: 200, success: true, data: filtered };
    }
    const response = await api.post("trading/bot/trading_history", data);
    return response.data;
  },

  getActiveBots: async (type: BotType) => {
    if (MOCK_MODE.tradingBot) {
      await delay(400);
      return { statusCode: 200, success: true, data: MOCK_BOTS.filter(b => b.type === type) };
    }
    const response = await api.get("trading/bot/list", { params: { type } });
    return response.data;
  },

  stopBot: async (botId: string) => {
    if (MOCK_MODE.tradingBot) {
      await delay(600);
      return { statusCode: 200, success: true, message: "Bot stopped" };
    }
    const response = await api.post(`trading/bot/stop`, { botId });
    return response.data;
  },
};
