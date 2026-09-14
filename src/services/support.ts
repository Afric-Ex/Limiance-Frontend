import { api } from "../lib/axios";
import {
  SupportTicket,
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

  /** POST /trading/support/tickets/:id/reply — Reply to a ticket */
  replyTicket: async (
    ticketId: string,
    data: ReplyTicketPayload
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(
      `trading/support/tickets/${ticketId}/reply`,
      data
    );
    return response;
  },
};

export const supportKeys = {
  all: ["support"] as const,
  tickets: () => [...supportKeys.all, "tickets"] as const,
  ticket: (id: string) => [...supportKeys.all, "ticket", id] as const,
};
