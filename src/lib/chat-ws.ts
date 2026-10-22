"use client";

import { wsClient } from "./websocket-client";

/**
 * Live Support & P2P order chat transport (WEBSOCKET_MESSAGES.md §8).
 *
 * Frames use the documented `type` + `data` shape. Responses are correlated by
 * `chatId` (history, typing) or by the echoed message content (delivery), since
 * the server does not include a request id in chat events. These calls are
 * WebSocket-only: no REST fallback is attempted.
 */

const CONNECT_TIMEOUT_MS = 4_000;
const RESPONSE_TIMEOUT_MS = 8_000;

export interface ChatWsMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
}

export interface ChatDeliveredEvent {
  chatId: string;
  createdAt: string;
  deliveredTo: number;
}

export interface ChatTypingEvent {
  chatId: string;
  senderId: string;
  isTyping: boolean;
}

export function normalizeChatMessage(raw: any): ChatWsMessage | null {
  if (!raw || typeof raw !== "object") return null;
  
  // Handle both `new_chat_message` (flat) and `new_message` (nested under `data`)
  const payload = raw.data ?? raw;
  
  const chatId = String(payload.chatId ?? payload.chat_id ?? "");
  if (!chatId) return null;

  const senderId = String(payload.senderId ?? payload.sender_id ?? "");
  const content = String(payload.content ?? payload.message ?? "");
  const createdAt = String(
    payload.createdAt ?? payload.created_at ?? new Date().toISOString()
  );
  const id = String(
    payload.id ??
      payload._id ??
      payload.messageId ??
      payload.message_id ??
      `${chatId}:${senderId}:${createdAt}:${content}`
  );

  const senderName = payload.senderName ?? payload.sender_name;
  return {
    id,
    chatId,
    senderId,
    senderName:
      typeof senderName === "string" && senderName.trim()
        ? senderName.trim()
        : undefined,
    content,
    createdAt,
  };
}

export function normalizeDeliveredEvent(raw: any): ChatDeliveredEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw.data ?? raw;
  const chatId = String(payload.chatId ?? payload.chat_id ?? "");
  if (!chatId) return null;
  return {
    chatId,
    createdAt: String(payload.createdAt ?? payload.created_at ?? new Date().toISOString()),
    deliveredTo: Number(payload.deliveredTo ?? payload.delivered_to ?? 0),
  };
}

export function normalizeTypingEvent(raw: any): ChatTypingEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw.data && typeof raw.data === "object" ? raw.data : raw;
  const chatId = String(payload.chatId ?? payload.chat_id ?? "");
  if (!chatId) return null;
  const rawTyping = payload.isTyping ?? payload.is_typing;
  return {
    chatId,
    senderId: String(
      payload.senderId ?? payload.sender_id ?? payload.userId ?? payload.user_id ?? ""
    ),
    isTyping:
      typeof rawTyping === "string"
        ? rawTyping.toLowerCase() === "true"
        : Boolean(rawTyping),
  };
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
      reject(new Error("WebSocket is not connected"));
    }, timeoutMs);
    wsClient.connect();
  });
}

function readFailure(raw: any): string | null {
  const type = String(raw?.type ?? "");
  const data = raw?.data && typeof raw.data === "object" ? raw.data : raw;
  const message =
    (typeof data?.message === "string" && data.message.trim()) ||
    (typeof data?.error === "string" && data.error.trim()) ||
    null;
  if (/(error|failed|rejected)/i.test(type)) {
    return message ?? `Chat request failed (${type})`;
  }
  if (data?.success === false) return message ?? "Chat request failed";
  const statusCode = Number(data?.statusCode);
  if (Number.isFinite(statusCode) && statusCode >= 400) {
    return message ?? `Chat request failed (status ${statusCode})`;
  }
  return null;
}

interface ChatRequestOptions {
  frameType: string;
  data: Record<string, unknown>;
  responseTypes: string[];
  errorTypes?: string[];
  match?: (payload: any, raw: any) => boolean;
  timeoutMs?: number;
}

function requestChat<T = any>(options: ChatRequestOptions): Promise<T> {
  const errorTypes = new Set(options.errorTypes ?? []);
  const responseTypes = new Set(options.responseTypes);

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
          const isError = errorTypes.has(type);
          if (!responseTypes.has(type) && !isError) return;
          if (!isError && options.match && !options.match(payload, raw)) return;
          const failure = readFailure(raw);
          settle(() =>
            failure ? reject(new Error(failure)) : resolve((payload ?? raw) as T)
          );
        });

        const timer = setTimeout(() => {
          settle(() =>
            reject(
              new Error(
                `No response to ${options.frameType} within ${(options.timeoutMs ?? RESPONSE_TIMEOUT_MS) / 1000}s`
              )
            )
          );
        }, options.timeoutMs ?? RESPONSE_TIMEOUT_MS);

        if (
          !wsClient.send({
            type: options.frameType,
            data: options.data,
          })
        ) {
          settle(() =>
            reject(new Error(`WebSocket send failed — ${options.frameType} not sent`))
          );
        }
      })
  );
}

/**
 * chat_message (§8.1). Resolves with the delivered message payload.
 *
 * The deployed backend emits `new_message` (payload nested under `data`) while
 * the documented frame is `new_chat_message`; accept both so the send promise
 * settles on the real acknowledgement instead of timing out.
 */
export function sendChatMessageWs(
  chatId: string,
  message: string
): Promise<ChatWsMessage> {
  return requestChat<ChatWsMessage>({
    frameType: "chat_message",
    data: { chat_id: chatId, message },
    responseTypes: ["new_chat_message", "new_message"],
    errorTypes: ["message_delivery_failed"],
    match: (payload) => {
      const delivered = normalizeChatMessage(payload);
      if (!delivered || delivered.chatId !== chatId) return false;
      // The delivery frame is broadcast to the whole conversation; only settle
      // on the message this caller just sent.
      return delivered.content === message;
    },
  }).then((payload) => normalizeChatMessage(payload)!);
}

/** get_chats (§8.2). Resolves with the `user_chats` payload. */
export function getChatsWs(): Promise<any> {
  return requestChat({
    frameType: "get_chats",
    data: {},
    responseTypes: ["user_chats"],
    timeoutMs: 5_000,
  });
}

/** get_chat_messages (§8.3–8.4). Resolves with the `chat_messages` payload. */
export function getChatMessagesWs(
  chatId: string,
  params?: { page?: number | string; limit?: number | string }
): Promise<any> {
  const data: Record<string, unknown> = { chat_id: chatId };
  if (params?.page !== undefined) data.page = String(params.page);
  if (params?.limit !== undefined) data.limit = String(params.limit);

  return requestChat({
    frameType: "get_chat_messages",
    data,
    responseTypes: ["chat_messages"],
    timeoutMs: 5_000,
    match: (payload) => {
      const replyChatId = payload?.chatId ?? payload?.chat_id;
      return replyChatId == null || String(replyChatId) === chatId;
    },
  });
}

/** typing_response (§8.5–8.6). Ephemeral: no acknowledgement or REST fallback. */
export function sendTypingWs(chatId: string, isTyping: boolean): boolean {
  return wsClient.send({
    type: "typing_response",
    data: { chat_id: chatId, is_typing: isTyping },
  });
}

/**
 * Subscribe to the server-pushed chat events (`new_chat_message`, `new_message`,
 * `message_delivered`, `typing`, `user_typing`). Registering these topics also
 * keeps the shared socket open on chat screens.
 */
export function subscribeChatEvents(handlers: {
  onMessage?: (message: ChatWsMessage) => void;
  onDelivered?: (event: ChatDeliveredEvent) => void;
  onTyping?: (event: ChatTypingEvent) => void;
}): () => void {
  const unsubscribeMessage = wsClient.subscribe(
    "new_chat_message",
    null,
    (payload) => {
      const message = normalizeChatMessage(payload);
      if (message) handlers.onMessage?.(message);
    }
  );
  
  const unsubscribeNewMessage = wsClient.subscribe(
    "new_message",
    null,
    (payload) => {
      const message = normalizeChatMessage(payload);
      if (message) handlers.onMessage?.(message);
    }
  );
  
  const unsubscribeDelivered = wsClient.subscribe(
    "message_delivered",
    null,
    (payload) => {
      const event = normalizeDeliveredEvent(payload);
      if (event) handlers.onDelivered?.(event);
    }
  );

  const handleTyping = (payload: any) => {
    const event = normalizeTypingEvent(payload);
    if (event) handlers.onTyping?.(event);
  };

  const unsubscribeTyping = wsClient.subscribe("typing", null, handleTyping);
  // The deployed backend answers `typing_response` with `user_typing` and puts
  // the acting user under `userId`; keep the documented `typing` topic too.
  const unsubscribeUserTyping = wsClient.subscribe(
    "user_typing",
    null,
    handleTyping
  );

  return () => {
    unsubscribeMessage();
    unsubscribeNewMessage();
    unsubscribeDelivered();
    unsubscribeTyping();
    unsubscribeUserTyping();
  };
}
