export interface OrderDetails {
  id: string;
  userId: string;
  side: string;
  base: string;
  quote: string;
  type: string;
  price: number;
  quantity: number;
  leverage: number;
  marginUsed: number;
  liquidated: false;
  status: string;
  createdAt: string;
}

export interface OrderBooksResponse {
  statusCode: number;
  success: boolean;
  message: string;
  error: string;
  data: {
    buyOrders: OrderDetails[];
    sellOrders: OrderDetails[];
  };
}

export interface SpotOrder {
  id: string;
  userId: string;
  side: "buy" | "sell";
  base: string;
  quote: string;
  type: string;
  price: number;
  quantity: number;
  leverage?: number;
  marginUsed?: number;
  liquidated?: boolean;
  status: string;
  createdAt: string;
}

export interface KlineCandle {
  time: number;    // unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
