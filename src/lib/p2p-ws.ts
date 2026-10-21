"use client";

import type { CreateOrder, P2POrderListings, UserAds } from "../types/p2p";
import { wsClient } from "./websocket-client";

const CONNECT_TIMEOUT_MS = 4_000;
const MUTATION_TIMEOUT_MS = 10_000;
const QUERY_TIMEOUT_MS = 8_000;

export class P2PWsError extends Error {
  readonly isTransport: boolean;

  constructor(message: string, isTransport = false) {
    super(message);
    this.name = "P2PWsError";
    this.isTransport = isTransport;
  }
}

function waitForConnection(timeoutMs = CONNECT_TIMEOUT_MS): Promise<void> {
  if (wsClient.getIsConnected()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let done = false;
    const onStatus = (connected: boolean) => {
      if (!connected || done) return;
      done = true;
      clearTimeout(timer);
      unsubscribe();
      resolve();
    };
    const unsubscribe = wsClient.onStatusChange(onStatus);
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      unsubscribe();
      reject(new P2PWsError("WebSocket is not connected", true));
    }, timeoutMs);
    wsClient.connect();
  });
}

function readMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  return null;
}

function describeFailure(data: any): string | null {
  if (!data || typeof data !== "object") return null;
  const message =
    readMessage(data.message) ?? readMessage(data.error) ?? readMessage(data.reason);
  if (data.success === false) return message ?? "P2P request failed";
  const statusCode = Number(data.statusCode);
  if (Number.isFinite(statusCode) && statusCode >= 400) {
    return message ?? `P2P request failed (status ${statusCode})`;
  }
  return null;
}

interface P2PRequestOptions {
  frameType: string;
  data?: Record<string, unknown>;
  responseType: string | string[];
  errorActions?: string[];
  timeoutMs?: number;
  match?: (payload: any, raw: any) => boolean;
}

function requestP2P<T = any>(options: P2PRequestOptions): Promise<T> {
  const responseTypes = new Set(
    Array.isArray(options.responseType) ? options.responseType : [options.responseType]
  );
  const errorActions = new Set(options.errorActions ?? [options.frameType]);
  const timeoutMs = options.timeoutMs ?? MUTATION_TIMEOUT_MS;

  return waitForConnection().then(
    () =>
      new Promise<T>((resolve, reject) => {
        let settled = false;

        const settle = (action: () => void) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          unsubscribe();
          action();
        };

        const unsubscribe = wsClient.onAnyMessage((payload, raw) => {
          const type = String(raw?.type ?? "");

          if (type === "p2p_error") {
            const data = payload && typeof payload === "object" ? payload : {};
            const action = String(data.action ?? raw?.action ?? "");
            if (action && !errorActions.has(action)) return;
            settle(() =>
              reject(
                new P2PWsError(
                  readMessage(data.error) ??
                    readMessage(data.message) ??
                    "P2P request failed"
                )
              )
            );
            return;
          }

          if (!responseTypes.has(type)) return;

          if (options.match && !options.match(payload, raw)) return;

          const failure = describeFailure(payload);
          settle(() =>
            failure ? reject(new P2PWsError(failure)) : resolve((payload ?? raw) as T)
          );
        });

        const timer = setTimeout(() => {
          settle(() =>
            reject(
              new P2PWsError(
                `No response to ${options.frameType} within ${timeoutMs / 1000}s`,
                true
              )
            )
          );
        }, timeoutMs);

        if (
          !wsClient.send({
            type: options.frameType,
            data: options.data ?? {},
          })
        ) {
          settle(() =>
            reject(
              new P2PWsError(`WebSocket send failed — ${options.frameType} not sent`, true)
            )
          );
        }
      })
  );
}

function toStringValue(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const parsed = parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readOrderId(payload: any): string {
  return toStringValue(
    payload?.orderId ??
      payload?.order_id ??
      payload?.orderMatch?.orderId ??
      payload?.order_match?.order_id ??
      payload?.id
  );
}

export function readMatchId(payload: any): string {
  return toStringValue(
    payload?.orderMatchId ??
      payload?.order_match_id ??
      payload?.matchId ??
      payload?.match_id ??
      payload?.orderMatch?.id ??
      payload?.order_match?.id ??
      payload?.id
  );
}

function toTitleCase(value: string): string {
  const upper = value.toUpperCase();
  if (upper === "BUY") return "Buy";
  if (upper === "SELL") return "Sell";
  return value;
}

function normalizePaymentMethods(
  raw: any
): P2POrderListings["data"][number]["paymentMethod"] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string" && raw.trim()
      ? raw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  return list.map((entry: any, index: number) => {
    if (entry && typeof entry === "object") {
      const method = toStringValue(
        entry.method ?? entry.name ?? entry.bankName ?? entry.bank_name,
        `Method ${index + 1}`
      );
      const details = entry.data && typeof entry.data === "object" ? entry.data : {};
      return {
        id: toStringValue(entry.id ?? entry._id, method),
        method,
        userId: toStringValue(entry.userId ?? entry.user_id),
        data: {
          accountName: toStringValue(
            details.accountName ??
              details.account_name ??
              entry.accountName ??
              entry.account_name
          ),
          accountNumber: toStringValue(
            details.accountNumber ??
              details.account_number ??
              entry.accountNumber ??
              entry.account_number
          ),
          bankName: toStringValue(
            details.bankName ??
              details.bank_name ??
              entry.bankName ??
              entry.bank_name ??
              method
          ),
        },
        createdAt: toStringValue(entry.createdAt ?? entry.created_at),
      };
    }

    const method = toStringValue(entry);
    return {
      id: method,
      method,
      userId: "",
      data: { accountName: "", accountNumber: "", bankName: method },
      createdAt: "",
    };
  });
}

function normalizeAdvertiser(
  raw: any
): P2POrderListings["data"][number]["advertiser"] {
  if (typeof raw === "string") {
    return {
      id: raw,
      firstName: raw,
      lastName: "",
      photo: "",
      active: true,
      verified: false,
      totalOrdersCompleted: "0",
      completionPercentage: "0",
      rating: "0",
    };
  }

  const source = raw && typeof raw === "object" ? raw : {};
  return {
    id: toStringValue(source.id ?? source.userId ?? source.user_id),
    firstName: toStringValue(
      source.firstName ??
        source.first_name ??
        source.fullName ??
        source.full_name ??
        source.name
    ),
    lastName: toStringValue(source.lastName ?? source.last_name),
    photo: toStringValue(source.photo ?? source.avatar),
    active: source.active !== false,
    verified: Boolean(source.verified ?? source.isVerified ?? source.is_verified),
    totalOrdersCompleted: toStringValue(
      source.totalOrdersCompleted ??
        source.total_orders_completed ??
        source.completedOrders ??
        source.completed_orders,
      "0"
    ),
    completionPercentage: toStringValue(
      source.completionPercentage ??
        source.completion_percentage ??
        source.completionRate ??
        source.completion_rate,
      "0"
    ),
    rating: toStringValue(source.rating, "0"),
  };
}

function normalizeWsAd(raw: any): P2POrderListings["data"][number] {
  const source = raw && typeof raw === "object" ? raw : {};
  const quantity = toNumberValue(source.quantity);

  return {
    id: toStringValue(source.id ?? source._id ?? source.orderId ?? source.order_id),
    type: toTitleCase(
      toStringValue(source.type ?? source.orderType ?? source.order_type, "SELL")
    ),
    asset: toStringValue(source.asset).toUpperCase(),
    fiat: toStringValue(source.fiat ?? source.currency).toUpperCase(),
    price: toNumberValue(source.fixedPrice ?? source.fixed_price ?? source.price),
    floatingPrice: Boolean(source.floatingPrice ?? source.floating_price),
    paymentDuration: toStringValue(
      source.paymentDuration ?? source.payment_duration,
      "15"
    ),
    minQuantity: toNumberValue(source.minQuantity ?? source.min_quantity),
    maxQuantity: toNumberValue(source.maxQuantity ?? source.max_quantity),
    numberLinked: Boolean(source.numberLinked ?? source.number_linked),
    availableQuantity: toStringValue(
      source.availableQuantity ?? source.available_quantity ?? quantity
    ),
    quantity,
    completedOrders: toNumberValue(
      source.completedOrders ?? source.completed_orders
    ),
    allCompletedOrders: toNumberValue(
      source.allCompletedOrders ?? source.all_completed_orders
    ),
    emailLinked: Boolean(source.emailLinked ?? source.email_linked),
    daysSinceAccountCreation: toNumberValue(
      source.daysSinceAccountCreation ?? source.days_since_account_creation
    ),
    selectedCountry: toStringValue(
      source.selectedCountry ?? source.selected_country ?? source.country
    ),
    remark: toStringValue(source.remark),
    paymentMethod: normalizePaymentMethods(
      source.paymentMethod ?? source.payment_methods ?? source.payment_method
    ),
    advertiser: normalizeAdvertiser(
      source.advertiser ?? source.creator ?? source.user
    ),
    createdAt: toStringValue(source.createdAt ?? source.created_at),
    active: Boolean(source.active ?? source.is_active ?? true),
    orderMatchCount: toNumberValue(
      source.orderMatchCount ?? source.order_match_count
    ),
    fulfilled: false,
    fulfilledAt: toStringValue(source.fulfilledAt ?? source.fulfilled_at),
  };
}

export function normalizeWsP2POrdersResponse(payload: any): P2POrderListings {
  const source = payload && typeof payload === "object" ? payload : {};
  const orders = Array.isArray(source.orders)
    ? source.orders
    : Array.isArray(source.data)
      ? source.data
      : Array.isArray(payload)
        ? payload
        : [];

  return {
    statusCode: toNumberValue(source.statusCode ?? source.status_code, 200),
    success: true,
    message: "",
    data: orders.map(normalizeWsAd),
    totalPages: toStringValue(source.totalPages ?? source.total_pages, "1"),
    currentPage: toStringValue(source.currentPage ?? source.current_page, "1"),
    totalRecords: toStringValue(
      source.totalRecords ?? source.total_records,
      orders.length
    ),
    error: "",
  };
}

export function normalizeWsP2PUserAdsResponse(payload: any): UserAds {
  return normalizeWsP2POrdersResponse(payload) as unknown as UserAds;
}

function normalizeWsMatch(raw: any) {
  const source = raw && typeof raw === "object" ? raw : {};
  const amount = toNumberValue(source.amount ?? source.fiatAmount ?? source.fiat_amount);

  return {
    ...source,
    id: toStringValue(
      source.id ?? source._id ?? source.orderMatchId ?? source.order_match_id
    ),
    orderId: toStringValue(source.orderId ?? source.order_id),
    quantity: toNumberValue(source.quantity),
    amount,
    fiatAmount: toNumberValue(source.fiatAmount ?? source.fiat_amount ?? amount),
    fiatCurrency: toStringValue(
      source.fiatCurrency ?? source.fiat_currency ?? source.fiat
    ).toUpperCase(),
    asset: toStringValue(source.asset).toUpperCase(),
    status: toStringValue(source.status, "PENDING").toUpperCase(),
    buyerId: toStringValue(source.buyerId ?? source.buyer_id) || undefined,
    sellerId: toStringValue(source.sellerId ?? source.seller_id) || undefined,
    advertiserId:
      toStringValue(source.advertiserId ?? source.advertiser_id) || undefined,
    matcherId: toStringValue(source.matcherId ?? source.matcher_id) || undefined,
    createdAt: toStringValue(source.createdAt ?? source.created_at),
    updatedAt: toStringValue(source.updatedAt ?? source.updated_at),
    expiryTime: toStringValue(source.expiryTime ?? source.expiry_time),
    chatId: toStringValue(source.chatId ?? source.chat_id) || undefined,
    paymentMethod:
      source.paymentMethod ?? source.payment_method ?? source.paymentMethodDetails,
  };
}

export function normalizeWsP2PMatchResponse(payload: any) {
  const source =
    payload?.orderMatch ?? payload?.order_match ?? payload?.data ?? payload ?? {};
  return {
    statusCode: toNumberValue(payload?.statusCode, 200),
    success: true,
    message: "",
    data: normalizeWsMatch(source),
  };
}

export function normalizeWsUserMatchesResponse(payload: any) {
  const source = payload && typeof payload === "object" ? payload : {};
  const matches = Array.isArray(source.matches)
    ? source.matches
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    statusCode: toNumberValue(source.statusCode, 200),
    success: true,
    message: "",
    data: matches.map((match: any) => ({
      ...normalizeWsMatch(match),
      type:
        toStringValue(
          match?.type ?? match?.orderType ?? match?.order_type
        ).toUpperCase() || undefined,
    })),
    totalPages: toStringValue(source.totalPages ?? source.total_pages, "1"),
    currentPage: toStringValue(source.currentPage ?? source.current_page, "1"),
    totalRecords: toStringValue(
      source.totalRecords ?? source.total_records,
      matches.length
    ),
    error: "",
  };
}

export function createP2POrderWs(
  data: CreateOrder,
  paymentMethodNames?: string[]
): Promise<any> {
  const payload: Record<string, unknown> = {
    type: String(data.type).toUpperCase() === "SELL" ? "SELL" : "BUY",
    asset: data.asset.toUpperCase(),
    fiat: (data.fiat || "USD").toUpperCase(),
    price: Number(data.fixedPrice),
    floating_price: Boolean(data.floatingPrice),
    quantity: Number(data.quantity),
    min_quantity: Number(data.minQuantity),
    max_quantity: Number(data.maxQuantity),
    payment_duration: String(data.paymentDuration || "15"),
    payment_methods:
      paymentMethodNames && paymentMethodNames.length > 0
        ? paymentMethodNames
        : data.paymentMethod,
  };
  if (data.selectedCountry) payload.selected_country = data.selectedCountry;
  if (data.remark) payload.remark = data.remark;
  if (data.assetLogo) payload.asset_logo = data.assetLogo;

  return requestP2P({
    frameType: "p2p_create_order",
    data: payload,
    responseType: "p2p_order_created",
  });
}

export interface EditP2POrderInput {
  price?: number;
  floatingPrice?: boolean;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  paymentDuration?: string;
  remark?: string;
  paymentMethods?: string[];
  selectedCountry?: string;
}

export function editP2POrderWs(
  orderId: string,
  input: EditP2POrderInput
): Promise<any> {
  const data: Record<string, unknown> = { order_id: orderId };
  if (input.price !== undefined) data.price = Number(input.price);
  if (input.floatingPrice !== undefined) {
    data.floating_price = Boolean(input.floatingPrice);
  }
  if (input.quantity !== undefined) data.quantity = Number(input.quantity);
  if (input.minQuantity !== undefined) {
    data.min_quantity = Number(input.minQuantity);
  }
  if (input.maxQuantity !== undefined) {
    data.max_quantity = Number(input.maxQuantity);
  }
  if (input.paymentDuration !== undefined) {
    data.payment_duration = String(input.paymentDuration);
  }
  if (input.remark !== undefined) data.remark = input.remark;
  if (input.paymentMethods !== undefined) {
    data.payment_methods = input.paymentMethods;
  }
  if (input.selectedCountry !== undefined) {
    data.selected_country = input.selectedCountry;
  }

  return requestP2P({
    frameType: "p2p_edit_order",
    data,
    responseType: "p2p_order_updated",
    match: (payload) => {
      const id = readOrderId(payload);
      return !id || id === orderId;
    },
  });
}

export type P2PToggleAction = "deactivate" | "reactivate";

const TOGGLE_ERROR_ACTIONS = [
  "p2p_toggle_order_status",
  "p2p_deactivate_order",
  "p2p_reactivate_order",
];

function requestToggle(
  frameType: string,
  data: Record<string, unknown>,
  orderId?: string
): Promise<any> {
  return requestP2P({
    frameType,
    data,
    responseType: "p2p_order_status_toggled",
    errorActions: TOGGLE_ERROR_ACTIONS,
    match: (payload) => {
      const id = readOrderId(payload);
      return !orderId || !id || id === orderId;
    },
  });
}

export function toggleP2POrderStatusWs(input: {
  orderId?: string;
  action?: P2PToggleAction;
  isActive?: boolean;
}): Promise<any> {
  const data: Record<string, unknown> = {};
  if (input.orderId) data.order_id = input.orderId;
  if (input.action) data.action = input.action;
  if (input.isActive !== undefined) data.is_active = input.isActive;
  return requestToggle("p2p_toggle_order_status", data, input.orderId);
}

export function deactivateP2POrderWs(orderId: string): Promise<any> {
  return requestToggle("p2p_deactivate_order", { order_id: orderId }, orderId);
}

export function reactivateP2POrderWs(orderId: string): Promise<any> {
  return requestToggle("p2p_reactivate_order", { order_id: orderId }, orderId);
}

export interface P2PAdsQueryParams {
  type?: string;
  currency?: string;
  fiat?: string;
  asset?: string;
  minimum_quantity?: string;
  available_quantity?: string;
  payment_method?: string;
  country?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number | string;
  limit?: number | string;
}

function buildAdsQuery(params?: P2PAdsQueryParams): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (!params) return data;
  if (params.asset) data.asset = params.asset;
  const fiat = params.fiat ?? params.currency;
  if (fiat) data.fiat = fiat;
  if (params.type) data.type = String(params.type).toUpperCase();
  if (params.minimum_quantity) data.min_quantity = params.minimum_quantity;
  if (params.available_quantity) data.available_quantity = params.available_quantity;
  if (params.payment_method) data.payment_method = params.payment_method;
  if (params.country) data.country = params.country;
  if (params.start_date) data.start_date = params.start_date;
  if (params.end_date) data.end_date = params.end_date;
  if (params.page !== undefined) data.page = String(params.page);
  if (params.limit !== undefined) data.limit = String(params.limit);
  return data;
}

export function getP2POrdersWs(params?: P2PAdsQueryParams): Promise<any> {
  return requestP2P({
    frameType: "get_p2p_orders",
    data: buildAdsQuery(params),
    responseType: "p2p_orders_data",
    timeoutMs: QUERY_TIMEOUT_MS,
  });
}

export function getUserP2POrdersWs(params?: P2PAdsQueryParams): Promise<any> {
  const data = buildAdsQuery(params);
  if (params?.status !== undefined) {
    const status = String(params.status).toLowerCase();
    data.status =
      status === "true" ? "active" : status === "false" ? "inactive" : params.status;
  }
  return requestP2P({
    frameType: "get_user_p2p_orders",
    data,
    responseType: "user_p2p_orders_data",
    timeoutMs: QUERY_TIMEOUT_MS,
  });
}

export function matchP2POrderWs(input: {
  orderId: string;
  quantity: number;
  paymentMethodId: string;
}): Promise<any> {
  return requestP2P({
    frameType: "p2p_match_order",
    data: {
      order_id: input.orderId,
      quantity: Number(input.quantity),
      payment_method_id: input.paymentMethodId,
    },
    responseType: "p2p_order_matched",
    match: (payload) => {
      if (!readMatchId(payload)) return false;
      const orderId = readOrderId(payload?.orderMatch ?? payload?.order_match ?? payload);
      return !orderId || orderId === input.orderId;
    },
  });
}

export function updateP2PMatchStatusWs(
  orderMatchId: string,
  status: string
): Promise<any> {
  const normalized = String(status).toUpperCase();

  return requestP2P({
    frameType: "p2p_update_match_status",
    data: { order_match_id: orderMatchId, status: normalized },
    responseType: ["p2p_match_status_updated", "p2p_match_status_changed"],
    match: (payload) => {
      const id = readMatchId(payload);
      return !id || id === orderMatchId;
    },
  });
}

export function requestP2PReleaseCodeWs(orderMatchId: string): Promise<any> {
  return requestP2P({
    frameType: "p2p_request_release_code",
    data: { order_match_id: orderMatchId },
    responseType: "p2p_release_code_sent",
    match: (payload) => {
      const id = readMatchId(payload);
      return !id || id === orderMatchId;
    },
  });
}

export function releaseP2POrderWs(input: {
  orderMatchId: string;
  releaseCode: string;
  totpCode?: string;
}): Promise<any> {
  const data: Record<string, unknown> = {
    order_match_id: input.orderMatchId,
    release_code: input.releaseCode,
  };
  if (input.totpCode) data.totp_code = input.totpCode;

  return requestP2P({
    frameType: "p2p_release_order",
    data,
    responseType: ["p2p_order_released", "p2p_order_completed"],
    match: (payload) => {
      const id = readMatchId(payload);
      return !id || id === input.orderMatchId;
    },
  });
}

export function getP2PMatchWs(orderMatchId: string): Promise<any> {
  return requestP2P({
    frameType: "get_p2p_match",
    data: { order_match_id: orderMatchId },
    responseType: "p2p_match_state",
    timeoutMs: QUERY_TIMEOUT_MS,
    match: (payload) => {
      const order = payload?.orderMatch ?? payload?.order_match ?? payload;
      const id = readMatchId(payload) || toStringValue(order?.id);
      return !id || id === orderMatchId;
    },
  });
}

export function getUserP2PMatchesWs(params?: {
  status?: string;
  type?: string;
  page?: number | string;
  limit?: number | string;
}): Promise<any> {
  const data: Record<string, unknown> = {};
  if (params?.status) data.status = String(params.status).toUpperCase();
  if (params?.type) data.type = String(params.type).toUpperCase();
  if (params?.page !== undefined) data.page = String(params.page);
  if (params?.limit !== undefined) data.limit = String(params.limit);

  return requestP2P({
    frameType: "get_user_p2p_matches",
    data,
    responseType: "user_p2p_matches_data",
    timeoutMs: QUERY_TIMEOUT_MS,
  });
}

export interface P2POrdersFeedHandlers {
  onUpdated?: (payload: any) => void;
}

export function subscribeP2POrdersFeed(
  handlers: P2POrdersFeedHandlers
): () => void {
  return wsClient.subscribe("p2p_orders_updated", null, (payload) => {
    handlers.onUpdated?.(payload);
  });
}

export interface P2PMatchStatusEvent {
  orderMatchId: string;
  status: string;
  updatedBy?: string;
  releasedBy?: string;
  timestamp?: string;
}

export interface P2PMatchRoomHandlers {
  onSubscribed?: (payload: any) => void;
  onState?: (order: any) => void;
  onStatusChanged?: (event: P2PMatchStatusEvent) => void;
  onCompleted?: (event: P2PMatchStatusEvent) => void;
}

export function subscribeP2PMatchRoom(
  orderMatchId: string,
  handlers: P2PMatchRoomHandlers
): () => void {
  const unsubscribeAck = wsClient.subscribe(
    "p2p_match_subscribed",
    null,
    (payload) => {
      const id = readMatchId(payload);
      if (id && id !== orderMatchId) return;
      handlers.onSubscribed?.(payload);
    }
  );

  const unsubscribeState = wsClient.subscribe(
    "p2p_match_state",
    { type: "subscribe_p2p_match", data: { order_match_id: orderMatchId } },
    (payload) => {
      const order = payload?.orderMatch ?? payload?.order_match ?? payload;
      const id = readMatchId(payload) || toStringValue(order?.id);
      if (id && id !== orderMatchId) return;
      if (order && typeof order === "object") handlers.onState?.(order);
    }
  );

  const unsubscribeStatus = wsClient.subscribe(
    "p2p_match_status_changed",
    null,
    (payload) => {
      const id = readMatchId(payload);
      if (id && id !== orderMatchId) return;
      handlers.onStatusChanged?.({
        orderMatchId: id || orderMatchId,
        status: toStringValue(payload?.status).toUpperCase(),
        updatedBy: payload?.updatedBy ?? payload?.updated_by,
        timestamp: payload?.timestamp,
      });
    }
  );

  const unsubscribeCompleted = wsClient.subscribe(
    "p2p_order_completed",
    null,
    (payload) => {
      const id = readMatchId(payload);
      if (id && id !== orderMatchId) return;
      handlers.onCompleted?.({
        orderMatchId: id || orderMatchId,
        status: toStringValue(payload?.status, "COMPLETED").toUpperCase(),
        releasedBy: payload?.releasedBy ?? payload?.released_by,
        timestamp: payload?.timestamp,
      });
    }
  );

  return () => {
    wsClient.send({
      type: "unsubscribe",
      data: { topic: "p2p_match", order_match_id: orderMatchId },
    });
    unsubscribeAck();
    unsubscribeState();
    unsubscribeStatus();
    unsubscribeCompleted();
  };
}

export interface P2PNewMatchEvent {
  orderMatchId: string;
  orderMatch: any;
}

export interface P2POrderEvent {
  orderId: string;
  payload: any;
}

export interface P2PGlobalEventHandlers {
  onNewMatch?: (event: P2PNewMatchEvent) => void;
  onOrdersUpdated?: (payload: any) => void;
  onOrderUpdated?: (event: P2POrderEvent) => void;
  onOrderStatusToggled?: (event: P2POrderEvent) => void;
}

export function subscribeP2PGlobalEvents(
  handlers: P2PGlobalEventHandlers
): () => void {
  const unsubscribeNewMatch = wsClient.subscribe(
    "p2p_new_match",
    null,
    (payload) => {
      const orderMatchId = readMatchId(payload);
      if (!orderMatchId) return;
      handlers.onNewMatch?.({
        orderMatchId,
        orderMatch: payload?.orderMatch ?? payload?.order_match ?? payload,
      });
    }
  );

  const unsubscribeOrdersUpdated = wsClient.subscribe(
    "p2p_orders_updated",
    null,
    (payload) => {
      handlers.onOrdersUpdated?.(payload);
    }
  );

  const unsubscribeOrderUpdated = wsClient.subscribe(
    "p2p_order_updated",
    null,
    (payload) => {
      handlers.onOrderUpdated?.({
        orderId: readOrderId(payload),
        payload,
      });
    }
  );

  const unsubscribeToggled = wsClient.subscribe(
    "p2p_order_status_toggled",
    null,
    (payload) => {
      handlers.onOrderStatusToggled?.({
        orderId: readOrderId(payload),
        payload,
      });
    }
  );

  return () => {
    unsubscribeNewMatch();
    unsubscribeOrdersUpdated();
    unsubscribeOrderUpdated();
    unsubscribeToggled();
  };
}
