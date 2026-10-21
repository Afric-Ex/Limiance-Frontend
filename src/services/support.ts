import { api } from "../lib/axios";
import {
  SupportTicket,
  SupportMessage,
  CreateTicketPayload,
  ReplyTicketPayload,
} from "../types/support";
import { ApiResponse } from "../types/api";

export const supportService = {
  /** POST /trading/support/tickets — Open a new ticket */
  createTicket: async (
    data: CreateTicketPayload
  ): Promise<ApiResponse<{ ticket: SupportTicket }>> => {
    const response = await api.post("trading/support/tickets", data);
    return response;
  },

  /** GET /trading/support/tickets — List user's tickets */
  listTickets: async (): Promise<
    ApiResponse<{ tickets: SupportTicket[] }>
  > => {
    const response = await api.get("trading/support/tickets");
    return response;
  },

  /** GET /trading/support/tickets/:id — Get ticket detail + thread */
  getTicket: async (
    ticketId: string
  ): Promise<ApiResponse<{ ticket: SupportTicket }>> => {
    const response = await api.get(`trading/support/tickets/${ticketId}`);
    return response;
  },

  /** POST /trading/support/tickets/:id/messages — Reply to a ticket */
  replyTicket: async (
    ticketId: string,
    data: ReplyTicketPayload,
    chatId?: string
  ): Promise<any> => {
    // Primary: chat_message over the trading socket (§8.1) when the ticket
    // exposes its conversation id; REST is the fallback.
    if (typeof window !== "undefined" && chatId) {
      try {
        const { sendChatMessageWs } = await import("../lib/chat-ws");
        return await sendChatMessageWs(chatId, data.body);
      } catch {
        // Fall back to REST below.
      }
    }

    const response = await api.post(
      `trading/support/tickets/${ticketId}/messages`,
      data
    );
    return response;
  },

  /**
   * Chat history for a support conversation (§8.3–8.4). Returns `null` when the
   * socket cannot answer, so the caller keeps using the REST ticket thread.
   */
  getChatMessages: async (chatId: string): Promise<any | null> => {
    if (typeof window === "undefined") return null;
    try {
      const { getChatMessagesWs } = await import("../lib/chat-ws");
      return await getChatMessagesWs(chatId);
    } catch {
      return null;
    }
  },
};

/**
 * The backend returns Go-style fields (camelCase, UPPER_SNAKE statuses,
 * "2026-09-19 11:34:31.898292 +0000 UTC" timestamps). Normalize into the
 * UI model so status chips, dates and messages render correctly.
 */

const toIso = (value?: string): string | undefined => {
  if (!value) return undefined;
  const src = value.trim();
  const iso = src
    .replace(/ \+0000 UTC$/, "Z")
    .replace(/ UTC$/, "Z")
    .replace(" ", "T");
  return Number.isFinite(new Date(iso).getTime()) ? iso : undefined;
};

const normalizeMessages = (list: any[] | undefined): SupportMessage[] | undefined => {
  if (!Array.isArray(list)) return undefined;
  return list.map((m) => ({
    id: String(m.id ?? m._id ?? ""),
    sender: ["admin", "support", "agent", "staff"].includes(
      String(m.senderType ?? m.sender_class ?? m.sender ?? "").toLowerCase()
    )
      ? "admin"
      : "user",
    message: String(m.message ?? m.body ?? ""),
    created_at: toIso(m.createdAt ?? m.created_at) ?? new Date().toISOString(),
  }));
};

export const normalizeTicket = (raw: any): SupportTicket => ({
  id: String(raw.id ?? raw._id ?? ""),
  chatId: raw.chatId ?? raw.chat_id ?? raw.chatID ?? raw.conversationId ?? undefined,
  subject: String(raw.subject ?? raw.title ?? ""),
  category: raw.category ?? raw.category_name ?? undefined,
  status: String(raw.status ?? "open").toLowerCase() as SupportTicket["status"],
  priority: String(raw.priority ?? "low").toLowerCase(),
  created_at: toIso(raw.createdAt ?? raw.created_at) ?? new Date().toISOString(),
  updated_at: toIso(raw.updatedAt ?? raw.updated_at),
  messages: normalizeMessages(raw.messages ?? raw.thread),
});

/** Unwrap the list envelope: response.data.tickets | .tickets | []. */
export const normalizeTicketList = (res: any): SupportTicket[] => {
  const list =
    Array.isArray(res?.data?.tickets)
      ? res.data.tickets
      : Array.isArray(res?.tickets)
        ? res.tickets
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
  return list.map(normalizeTicket);
};

/** Unwrap the detail envelope: response.data.ticket | .ticket | flat object. */
export const normalizeTicketDetail = (res: any, fallback: SupportTicket): SupportTicket => {
  const raw =
    res?.data?.ticket ??
    res?.ticket ??
    (res?.messages && typeof res === "object" && res.id ? res : null) ??
    fallback;

  const normalized = normalizeTicket(raw);

  // Messages come at the envelope top level, not nested in the ticket
  const rawMessages = res?.data?.messages ?? res?.messages ?? raw?.messages;
  const messages = normalizeMessages(rawMessages);
  if (messages) {
    normalized.messages = messages;
  }

  return normalized;
};

export const supportKeys = {
  all: ["support"] as const,
  tickets: () => [...supportKeys.all, "tickets"] as const,
  ticket: (id: string) => [...supportKeys.all, "ticket", id] as const,
};
