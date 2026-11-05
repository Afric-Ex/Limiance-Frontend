"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { ActionIcon, Button, Modal, TextInput, Textarea } from "@mantine/core";
import {
  supportService,
  supportKeys,
  normalizeTicketList,
  normalizeTicketDetail,
} from "@/src/services/support";
import { SupportTicket, SupportMessage } from "@/src/types/support";
import { errorNotification, successNotification } from "@/src/lib/notification-handler";
import {
  RiCustomerService2Line,
  RiSendPlaneFill,
  RiAddLine,
  RiArrowLeftLine,
  RiTimeLine,
  RiCheckDoubleLine,
  RiSearchLine,
  RiRefreshLine,
} from "react-icons/ri";
import {
  MdOutlineSecurity,
  MdOutlineSupportAgent,
} from "react-icons/md";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SupportPageSkeleton } from "@/src/components/skeletons/with-sidebar";
import { useChatWs, useTypingIndicator } from "@/src/hooks/use-chat-ws";
import { useUserStore } from "@/src/stores/user-store";
import type { ChatWsMessage } from "@/src/lib/chat-ws";
import { AccountPageHeader } from "@/src/components/settings/account-page-header";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-error-1/10 text-error-1" },
  in_progress: { label: "In Progress", className: "bg-warning-1/10 text-warning-1" },
  pending_user: { label: "Pending You", className: "bg-primary/10 text-primary" },
  resolved: { label: "Resolved", className: "bg-success-6/10 text-success-6" },
  closed: { label: "Closed", className: "bg-white/10 text-white/50" },
};

const inputClassNames = {
  label: "!text-white/70 !mb-1.5 !text-sm",
  input:
    "!bg-surface !border-line !text-[var(--color-text-primary)] placeholder:!text-[var(--color-text-disabled)] focus:!border-primary",
  description: "!text-white/50 !text-xs",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const toSupportMessages = (
  payload: any,
  currentUserId?: string
): SupportMessage[] => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.messages)
      ? payload.messages
      : [];

  return list.map((message: any, index: number) => {
    const rawSender = String(message.sender ?? "").toLowerCase();
    const senderId = String(message.senderId ?? message.sender_id ?? "");
    const sender: SupportMessage["sender"] =
      rawSender === "admin" || rawSender === "user"
        ? rawSender
        : currentUserId && senderId === currentUserId
          ? "user"
          : "admin";

    return {
      id: String(
        message.id ??
          message._id ??
          `ws-${index}-${message.createdAt ?? message.created_at ?? ""}`
      ),
      sender,
      message: String(message.message ?? message.content ?? ""),
      created_at: String(
        message.createdAt ?? message.created_at ?? new Date().toISOString()
      ),
    };
  });
};

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold leading-4 whitespace-nowrap",
        st.className
      )}
    >
      {st.label}
    </span>
  );
}

// ─── Create Ticket Modal ──────────────────────────────────────────────────────

function CreateTicketModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { mutate: create, isPending } = useMutation({
    mutationFn: () =>
      supportService.createTicket({
        subject: subject.trim(),
        message: message.trim(),
      }),
    onSuccess: () => {
      successNotification("Support ticket created!");
      qc.invalidateQueries({ queryKey: supportKeys.tickets() });
      onClose();
    },
    onError: () => errorNotification("Failed to create ticket. Please try again."),
  });

  const valid = subject.trim().length > 3 && message.trim().length > 10;

  return (
    <Modal
      opened
      onClose={onClose}
      title={
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.12] text-primary">
            <RiCustomerService2Line size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Support center
            </p>
            <h2 className="mt-0.5 text-base font-semibold leading-tight text-white sm:text-lg">
              Create a support ticket
            </h2>
          </div>
        </div>
      }
      centered
      size="md"
      overlayProps={{ backgroundOpacity: 0.72, blur: 4 }}
      classNames={{
        content: "!overflow-hidden !rounded-2xl !border !border-white/[0.08] !bg-elevated !text-white shadow-2xl",
        header: "!border-b !border-white/[0.07] !bg-elevated !px-5 !py-4 sm:!px-6",
        title: "!w-full",
        close: "!text-white/50 hover:!bg-white/[0.06] hover:!text-white",
        body: "!p-0",
      }}
    >
      <div className="flex max-h-[min(78vh,700px)] flex-col">
        <div className="flex flex-col gap-5 overflow-y-auto p-5 sm:gap-6 sm:p-6">
          <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/[0.06] p-3.5">
            <MdOutlineSecurity className="mt-0.5 shrink-0 text-primary" size={18} />
            <p className="text-xs leading-5 text-white/55">
              Tell us what happened and include any relevant details. Never share your password, verification codes, or API secrets.
            </p>
          </div>

          <TextInput
            label="Subject"
            description="A short summary helps our team route your request."
            placeholder="e.g. I need help with a deposit"
            maxLength={80}
            value={subject}
            onChange={(e) => setSubject(e.currentTarget.value)}
            classNames={{
              ...inputClassNames,
              input: "!min-h-12 !rounded-xl !bg-black/20 !border-white/[0.09] !text-white placeholder:!text-white/25 focus:!border-primary/60",
              description: "!mt-1 !text-xs !text-white/40",
            }}
          />

          <Textarea
            label="How can we help?"
            description="Include steps you have already tried, if applicable."
            placeholder="Describe the issue in detail…"
            minRows={5}
            maxRows={8}
            autosize
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            classNames={{
              ...inputClassNames,
              input: "!rounded-xl !bg-black/20 !border-white/[0.09] !text-white placeholder:!text-white/25 focus:!border-primary/60",
              description: "!mt-1 !text-xs !text-white/40",
            }}
          />

          <p className="text-xs leading-5 text-white/40">
            Please provide at least 4 characters in the subject and 11 characters in the description.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/[0.07] bg-black/[0.08] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="min-h-11 rounded-xl border border-white/[0.09] bg-white/[0.025] text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            size="md"
            disabled={!valid}
            loading={isPending}
            onClick={() => create()}
            classNames={{
              root: "!min-h-11 !rounded-xl !bg-primary !text-sm !font-semibold hover:!bg-primary/90",
            }}
          >
            {isPending ? "Submitting…" : "Submit ticket"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Ticket Thread ────────────────────────────────────────────────────────────

function TicketThread({ ticket, onBack }: { ticket: SupportTicket; onBack: () => void }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserId = useUserStore((state) => state.user?.id);
  const chatId = ticket.chatId ?? null;

  const { peerTyping, onTyping, notifyTyping } = useTypingIndicator(
    chatId,
    currentUserId
  );

  const handleIncomingMessage = useCallback(
    (message: ChatWsMessage) => {
      qc.setQueryData<SupportTicket>(supportKeys.ticket(ticket.id), (current) => {
        if (!current) return current;
        const incoming: SupportMessage = {
          id: message.id,
          sender:
            currentUserId && message.senderId === currentUserId ? "user" : "admin",
          message: message.content,
          created_at: message.createdAt,
        };
        const threadMessages = current.messages ?? [];
        if (threadMessages.some((entry) => entry.id === incoming.id)) return current;
        return { ...current, messages: [...threadMessages, incoming] };
      });
    },
    [currentUserId, qc, ticket.id]
  );

  const { connected } = useChatWs(chatId, {
    onMessage: handleIncomingMessage,
    onTyping,
  });

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: supportKeys.ticket(ticket.id),
    queryFn: async () => {
      // Primary: chat history over the socket. The ticket REST call still
      // supplies subject/status metadata and is the message fallback.
      const [restResponse, wsPayload] = await Promise.all([
        supportService.getTicket(ticket.id),
        chatId ? supportService.getChatMessages(chatId) : Promise.resolve(null),
      ]);
      const normalized = normalizeTicketDetail(restResponse, ticket);
      if (!normalized.chatId && ticket.chatId) normalized.chatId = ticket.chatId;
      const wsMessages = toSupportMessages(wsPayload, currentUserId);
      if (wsMessages.length > 0) normalized.messages = wsMessages;
      return normalized;
    },
    // WS pushes are primary; polling is the fallback for ticket metadata and
    // for servers that do not stream support conversations.
    refetchInterval: chatId && connected ? 30000 : 15000,
  });

  const thread: SupportTicket = data ?? ticket;
  const messages: SupportMessage[] = thread.messages ?? [];

  const { mutate: sendReply, isPending: sending } = useMutation({
    mutationFn: () =>
      supportService.replyTicket(ticket.id, { body: reply }, chatId ?? undefined),
    onSuccess: () => {
      setReply("");
      notifyTyping(false);
      qc.invalidateQueries({ queryKey: supportKeys.ticket(ticket.id) });
    },
    onError: () => errorNotification("Failed to send reply"),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const open = thread.status !== "closed" && thread.status !== "resolved";

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* Thread header */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/[0.06] bg-white/[0.015] px-4 py-3.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to tickets"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white lg:hidden"
        >
          <RiArrowLeftLine size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">
            {thread.subject}
          </div>
          <div className="mt-1 truncate text-xs text-white/40">
            #{thread.id}
            {thread.category ? ` · ${thread.category}` : ""}
          </div>
        </div>
        <span className="hidden items-center gap-1.5 text-[10px] font-medium text-white/40 sm:inline-flex">
          <span className={clsx("h-1.5 w-1.5 rounded-full", connected ? "bg-success-6" : "bg-white/25")} />
          {connected ? "Live" : "Connecting"}
        </span>
        <StatusBadge status={thread.status} />
      </div>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-black/[0.08] px-4 py-4 sm:px-5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-muted"
              />
            ))
          : isError
            ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                <p className="text-sm text-white/60">Unable to load this conversation.</p>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => void refetch()}
                  className="!text-primary"
                >
                  Try again
                </Button>
              </div>
            )
          : messages.length === 0
            ? (
              <EmptyState
                icon={<RiCustomerService2Line size={36} />}
                caption="No messages yet"
              />
            )
            : messages.map((msg, i) => {
              const isAdmin = msg.sender === "admin";
              return (
                <div
                  key={msg.id || i}
                  className={clsx("flex w-full", isAdmin ? "justify-start" : "justify-end")}
                >
                  <div
                    className={clsx(
                      "max-w-[min(85%,560px)] rounded-2xl border px-4 py-3 shadow-sm",
                      isAdmin
                        ? "rounded-bl-sm border-white/[0.06] bg-white/[0.045] text-white/90"
                        : "rounded-br-sm border-primary/20 bg-primary/[0.14] text-white"
                    )}
                  >
                    <div
                      className={clsx(
                        "mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider",
                        isAdmin ? "text-white/40" : "text-primary"
                      )}
                    >
                      {isAdmin && <MdOutlineSupportAgent size={12} />}
                      {isAdmin ? "Support Team" : "You"}
                    </div>
                    <p className="break-words whitespace-pre-wrap text-sm leading-6">
                      {msg.message}
                    </p>
                    <div
                      className={clsx(
                        "mt-2 text-[10px]",
                        isAdmin ? "text-white/35" : "text-white/75"
                      )}
                    >
                      {timeAgo(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {open ? (
        <div className="flex flex-shrink-0 flex-col gap-2 border-t border-white/[0.06] bg-elevated p-3 sm:p-4">
          {peerTyping && (
            <div className="px-1 text-micro text-[var(--color-text-secondary)]">
              Support is typing…
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              className="flex-1"
              placeholder="Type your reply…"
              minRows={1}
              maxRows={4}
              autosize
              value={reply}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setReply(value);
                notifyTyping(value.length > 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (reply.trim()) {
                    notifyTyping(false);
                    sendReply();
                  }
                }
              }}
              classNames={{
                input: "!rounded-xl !bg-black/20 !border-white/[0.08] !text-white placeholder:!text-white/30 focus:!border-primary/60 resize-none",
              }}
            />
            <ActionIcon
              size="lg"
              variant="filled"
              className={clsx(
                "mb-0.5 !h-11 !w-11 !rounded-xl text-white transition-colors",
                reply.trim()
                  ? "bg-primary-strong hover:bg-primary-strong/90"
                  : "bg-muted text-[var(--color-text-disabled)]"
              )}
              disabled={sending || !reply.trim()}
              onClick={() => {
                notifyTyping(false);
                sendReply();
              }}
              aria-label="Send reply"
            >
              <RiSendPlaneFill size={18} />
            </ActionIcon>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-white/[0.06] px-4 py-4 text-center text-xs text-white/40">
          This ticket is {thread.status}
        </div>
      )}
    </div>
  );
}

// ─── Ticket List Item ─────────────────────────────────────────────────────────

function TicketItem({
  ticket,
  isActive,
  onClick,
}: {
  ticket: SupportTicket;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={clsx(
        "flex w-full flex-col gap-2 border-b border-white/[0.05] border-l-2 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60",
        isActive
          ? "border-l-primary bg-primary/[0.07]"
          : "border-l-transparent hover:bg-white/[0.035]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={clsx(
            "min-w-0 flex-1 truncate text-sm font-semibold",
            isActive
              ? "text-primary"
              : "text-white/85"
          )}
        >
          {ticket.subject}
        </span>
        <StatusBadge status={ticket.status} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-xs text-white/40">
          {ticket.category ?? "General"} <span className="px-1 text-white/20">·</span> #{ticket.id}
        </span>
        <span className="shrink-0 text-2xs text-white/35">
          {timeAgo(ticket.updated_at || ticket.created_at)}
        </span>
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function SupportPageInner() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [ticketSearch, setTicketSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: supportKeys.tickets(),
    queryFn: () => supportService.listTickets(),
    select: (r) => normalizeTicketList(r),
    refetchInterval: 30000,
  });

  const tickets = useMemo<SupportTicket[]>(() => data ?? [], [data]);
  const selected = tickets.find((t) => t.id === selectedId) ?? null;
  const filteredTickets = useMemo(() => {
    const query = ticketSearch.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter((ticket) =>
      [ticket.subject, ticket.category, ticket.id, ticket.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [ticketSearch, tickets]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setMobileView("thread");
  }, []);

  const handleBack = useCallback(() => {
    setMobileView("list");
    setSelectedId(null);
  }, []);

  const openCount = tickets.filter((ticket) =>
    ["open", "in_progress", "pending_user"].includes(ticket.status)
  ).length;

  return (
    <main className="mx-auto flex h-[calc(100dvh-160px)] min-h-[500px] w-full max-w-[1180px] flex-col gap-5 pb-2 page-enter max-[1150px]:h-[calc(100dvh-205px)] max-[1150px]:min-h-[460px]">
      <AccountPageHeader
        title="Support center"
        description="Get help from our team, follow your requests, and continue conversations in one place."
        icon={<RiCustomerService2Line size={23} />}
        eyebrow="We're here to help"
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(77,119,240,0.2)] transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <RiAddLine size={17} />
            New ticket
          </button>
        }
      />

      {/* Main panel */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        {/* Left — ticket list */}
        <div
          className={clsx(
            "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-elevated shadow-card",
            mobileView === "thread" && "max-lg:hidden"
          )}
        >
          <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Your tickets</h2>
                <p className="mt-1 text-xs text-white/40">
                  {openCount} active <span className="px-1 text-white/20">·</span> {tickets.length} total
                </p>
              </div>
              <ActionIcon
                variant="subtle"
                aria-label="Refresh tickets"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="!text-white/45 hover:!text-white"
              >
                <RiRefreshLine className={isFetching ? "animate-spin" : ""} size={18} />
              </ActionIcon>
            </div>
            <TextInput
              value={ticketSearch}
              onChange={(event) => setTicketSearch(event.currentTarget.value)}
              placeholder="Search tickets"
              aria-label="Search support tickets"
              leftSection={<RiSearchLine size={15} />}
              classNames={{
                input: "!min-h-10 !rounded-xl !border-white/[0.07] !bg-black/15 !pl-10 !text-sm !text-white placeholder:!text-white/30 focus:!border-primary/50",
                section: "!text-white/35",
              }}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mx-3 my-3 h-[76px] animate-pulse rounded-xl bg-muted" />
              ))
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-1/[0.08] text-error-1">
                  <RiRefreshLine size={19} />
                </span>
                <p className="text-sm font-medium text-white/75">Unable to load your tickets</p>
                <p className="text-xs text-white/40">Check your connection and try again.</p>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => void refetch()}
                  className="!text-primary"
                >
                  Try again
                </Button>
              </div>
            ) : tickets.length === 0 ? (
              <EmptyState
                icon={<RiCustomerService2Line size={36} />}
                caption={
                  <>
                    No tickets yet
                    <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">
                      Open one if you need help
                    </span>
                  </>
                }
              />
            ) : filteredTickets.length === 0 ? (
              <EmptyState
                icon={<RiSearchLine size={30} />}
                caption={
                  <>
                    No matching tickets
                    <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">
                      Try a different subject or ticket ID.
                    </span>
                  </>
                }
              />
            ) : (
              filteredTickets.map((t) => (
                <TicketItem
                  key={t.id}
                  ticket={t}
                  isActive={t.id === selectedId}
                  onClick={() => handleSelect(t.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right — thread or empty state */}
        <div
          className={clsx(
            "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-elevated shadow-card",
            mobileView !== "thread" && "max-lg:hidden"
          )}
        >
          {selected ? (
            <TicketThread ticket={selected} onBack={handleBack} />
          ) : (
            <div className="relative flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden px-6 text-center">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/[0.035]" />
              <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full border border-white/[0.035]" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.1] text-primary">
                <RiCustomerService2Line size={32} />
              </div>
              <div className="relative">
                <h2 className="text-lg font-semibold text-white">
                  Your conversations
                </h2>
                <p className="mt-1 max-w-xs text-sm leading-6 text-white/45">
                  Select a ticket to read and reply, or open a new request to get help from our team.
                </p>
              </div>
              <div className="relative flex flex-wrap justify-center gap-2">
                {[
                  { icon: <RiTimeLine size={14} />, label: "24h response time" },
                  { icon: <RiCheckDoubleLine size={14} />, label: "Real-time updates" },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/45"
                  >
                    {icon} {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} />}
    </main>
  );
}

export default function SupportPage() {
  return (
    <PageSuspense fallback={<SupportPageSkeleton />}>
      <SupportPageInner />
    </PageSuspense>
  );
}