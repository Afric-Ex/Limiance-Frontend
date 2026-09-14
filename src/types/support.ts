export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "pending_user" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  sender: "user" | "admin";
  message: string;
  created_at: string;
}

export interface CreateTicketPayload {
  subject: string;
  category: string;
  message: string;
}

export interface ReplyTicketPayload {
  message: string;
}
