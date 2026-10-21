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

export interface ChatTypingEvent {
  chatId: string;
  senderId: string;
  isTyping: boolean;
}

export function normalizeChatMessage(raw: any): ChatWsMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const chatId = String(raw.chatId ?? raw.chat_id ?? "");
  if (!chatId) return null;

  const senderId = String(raw.senderId ?? raw.sender_id ?? "");
  const content = String(raw.content ?? raw.message ?? "");
  const createdAt = String(
    raw.createdAt ?? raw.created_at ?? new Date().toISOString()
  );
  // The delivery frame has no id, so derive a stable one: the same message
  // replayed by a refetch must not duplicate in the list.
  const id = String(
    raw.id ??
      raw._id ??
      raw.messageId ??
      raw.message_id ??
      `${chatId}:${senderId}:${createdAt}:${content}`
  );

  return {
    id,
    chatId,
    senderId,
    senderName: raw.senderName ?? raw.sender_name ?? raw.sender ?? undefined,
    content,
    createdAt,
  };
}

export function normalizeTypingEvent(raw: any): ChatTypingEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const chatId = String(raw.chatId ?? raw.chat_id ?? "");
  if (!chatId) return null;
  return {
    chatId,
    senderId: String(raw.senderId ?? raw.sender_id ?? ""),
    isTyping: Boolean(raw.isTyping ?? raw.is_typing),
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
  responseType: string;
  errorTypes?: string[];
  match?: (payload: any, raw: any) => boolean;
  timeoutMs?: number;
}

function requestChat<T = any>(options: ChatRequestOptions): Promise<T> {
  const errorTypes = new Set(options.errorTypes ?? []);

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
          if (type !== options.responseType && !isError) return;
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

/** chat_message (§8.1). Resolves with the delivered `new_chat_message` payload. */
export function sendChatMessageWs(
  chatId: string,
  message: string
): Promise<ChatWsMessage> {
  return requestChat<ChatWsMessage>({
    frameType: "chat_message",
    data: { chat_id: chatId, message },
    responseType: "new_chat_message",
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
    responseType: "user_chats",
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
    responseType: "chat_messages",
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
 * Subscribe to the server-pushed chat events (`new_chat_message`, `typing`).
 * Registering these topics also keeps the shared socket open on chat screens.
 */
export function subscribeChatEvents(handlers: {
  onMessage?: (message: ChatWsMessage) => void;
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
  const unsubscribeTyping = wsClient.subscribe("typing", null, (payload) => {
    const event = normalizeTypingEvent(payload);
    if (event) handlers.onTyping?.(event);
  });

  return () => {
    unsubscribeMessage();
    unsubscribeTyping();
  };
}
