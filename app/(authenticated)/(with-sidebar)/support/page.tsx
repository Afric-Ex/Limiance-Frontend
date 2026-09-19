"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "react-icons/ri";
import { MdOutlineSupportAgent } from "react-icons/md";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SupportPageSkeleton } from "@/src/components/skeletons/with-sidebar";

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

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold leading-4 whitespace-nowrap",
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
    mutationFn: () => supportService.createTicket({ subject, message }),
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
      title="New Support Ticket"
      centered
      classNames={{
        content: "bg-elevated border border-line text-[var(--color-text-primary)] shadow-[var(--shadow-card)]",
        header: "bg-elevated border-b border-line",
        title: "text-[var(--text-title)] font-semibold text-[var(--color-text-primary)]",
        close: "text-[var(--color-text-secondary)] hover:bg-muted hover:text-[var(--color-text-primary)]",
      }}
    >
      <div className="flex flex-col gap-4 pt-2">
        <TextInput
          label="Subject"
          placeholder="Briefly describe your issue…"
          maxLength={80}
          value={subject}
          onChange={(e) => setSubject(e.currentTarget.value)}
          classNames={inputClassNames}
        />

        <Textarea
          label="Description"
          placeholder="Please describe your issue in detail…"
          minRows={4}
          maxRows={7}
          autosize
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          classNames={inputClassNames}
        />

        {!valid && !isPending && (
          <p className="text-[11px] text-[var(--color-text-secondary)] -mt-1">
            Subject needs 4+ characters and description 10+ characters
          </p>
        )}

        <Button
          size="md"
          fullWidth
          disabled={!valid}
          loading={isPending}
          onClick={() => create()}
          classNames={{ root: "bg-primary-strong hover:bg-primary-strong/90" }}
        >
          {isPending ? "Submitting…" : "Submit Ticket"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Ticket Thread ────────────────────────────────────────────────────────────

function TicketThread({ ticket, onBack }: { ticket: SupportTicket; onBack: () => void }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: supportKeys.ticket(ticket.id),
    queryFn: () => supportService.getTicket(ticket.id),
    select: (r) => normalizeTicketDetail(r, ticket),
    refetchInterval: 15000,
  });

  const thread: SupportTicket = data ?? ticket;
  const messages: SupportMessage[] = thread.messages ?? [];

  const { mutate: sendReply, isPending: sending } = useMutation({
    mutationFn: () => supportService.replyTicket(ticket.id, { body: reply }),
    onSuccess: () => {
      setReply("");
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
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line flex-shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to tickets"
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-line transition-colors"
        >
          <RiArrowLeftLine size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {thread.subject}
          </div>
          <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 truncate">
            #{thread.id}
            {thread.category ? ` · ${thread.category}` : ""}
          </div>
        </div>
        <StatusBadge status={thread.status} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-muted animate-pulse"
              />
            ))
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
                      "max-w-[75%] px-4 py-2.5 rounded-2xl shadow-md",
                      isAdmin
                        ? "bg-white/[0.06] border border-white/5 text-[var(--color-neutral-off-white)] rounded-bl-sm"
                        : "bg-gradient-to-br from-[#0ECB81] to-emerald-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(14,203,129,0.25)]"
                    )}
                  >
                    <div
                      className={clsx(
                        "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1",
                        isAdmin ? "text-white/40" : "text-white/85"
                      )}
                    >
                      {isAdmin && <MdOutlineSupportAgent size={12} />}
                      {isAdmin ? "Support Team" : "You"}
                    </div>
                    <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                      {msg.message}
                    </p>
                    <div
                      className={clsx(
                        "text-[10px] mt-1.5",
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
        <div className="border-t border-line p-3 flex flex-col gap-2 flex-shrink-0 bg-black/20">
          <div className="flex items-end gap-2">
            <Textarea
              className="flex-1"
              placeholder="Type your reply…"
              minRows={1}
              maxRows={4}
              autosize
              value={reply}
              onChange={(e) => setReply(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (reply.trim()) sendReply();
                }
              }}
              classNames={{ input: "!bg-surface !border-line !text-[var(--color-text-primary)] placeholder:!text-[var(--color-text-disabled)] focus:!border-primary resize-none" }}
            />
            <ActionIcon
              size="lg"
              variant="filled"
              className={clsx(
                "mb-0.5 text-white transition-colors",
                reply.trim()
                  ? "bg-primary-strong hover:bg-primary-strong/90"
                  : "bg-muted text-[var(--color-text-disabled)]"
              )}
              disabled={sending || !reply.trim()}
              onClick={() => sendReply()}
              aria-label="Send reply"
            >
              <RiSendPlaneFill size={18} />
            </ActionIcon>
          </div>
        </div>
      ) : (
        <div className="border-t border-line px-4 py-3 text-center text-xs text-[var(--color-text-secondary)] flex-shrink-0">
          This ticket is {thread.status}
        </div>
      )}
    </div>
  );
}

// ─── Ticket List Item ─────────────────────────────────────────────────────────

function TicketItem({ ticket, isActive, onClick }: { ticket: SupportTicket; isActive: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex flex-col gap-1 px-4 py-3.5 border-b border-line bg-transparent border-l-2 cursor-pointer transition-colors",
        isActive
          ? "bg-primary/10 border-l-primary"
          : "border-l-transparent hover:bg-white/[0.04]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={clsx(
            "flex-1 text-[13px] font-semibold truncate",
            isActive
              ? "text-primary"
              : "text-[var(--color-neutral-off-white)]"
          )}
        >
          {ticket.subject}
        </span>
        <StatusBadge status={ticket.status} />
      </div>
      <span className="text-[11px] text-[var(--color-text-secondary)]">
        {ticket.category ?? "General"}
      </span>
      <span className="text-[10px] text-[var(--color-text-disabled)]">
        {timeAgo(ticket.updated_at || ticket.created_at)}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function SupportPageInner() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const { data, isLoading } = useQuery({
    queryKey: supportKeys.tickets(),
    queryFn: () => supportService.listTickets(),
    select: (r) => normalizeTicketList(r),
    refetchInterval: 30000,
  });

  const tickets: SupportTicket[] = data ?? [];
  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setMobileView("thread");
  }, []);

  const handleBack = useCallback(() => {
    setMobileView("list");
    setSelectedId(null);
  }, []);

  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="flex h-[calc(100dvh-150px)] min-h-[480px] flex-col gap-5 page-enter">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <RiCustomerService2Line size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight truncate">
              Support Center
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              {openCount > 0
                ? `${openCount} active ticket${openCount !== 1 ? "s" : ""} · We reply within 24h`
                : "No open tickets · We reply within 24h"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] bg-primary-strong px-4 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(77,119,240,0.3)] transition-all hover:bg-primary-strong/90 hover:shadow-[0_6px_20px_rgba(77,119,240,0.4)] active:scale-[0.98]"
        >
          <RiAddLine size={16} />
          New Ticket
        </button>
      </div>

      {/* Main panel */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[330px_1fr] gap-4">
        {/* Left — ticket list */}
        <div
          className={clsx(
            "flex flex-col min-h-0 overflow-hidden rounded-xl border border-line bg-elevated shadow-card",
            mobileView === "thread" && "max-lg:hidden"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-line flex-shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
              Your Tickets ({tickets.length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mx-3 my-3 h-[72px] rounded-lg bg-muted animate-pulse" />
              ))
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
            ) : (
              tickets.map((t) => (
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
            "flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-elevated shadow-card",
            mobileView !== "thread" && "max-lg:hidden"
          )}
        >
          {selected ? (
            <TicketThread ticket={selected} onBack={handleBack} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-primary/10 border border-primary/15 text-primary">
                <RiCustomerService2Line size={32} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white/60 m-0">
                  Select a ticket
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  or create a new one to get help
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { icon: <RiTimeLine size={14} />, label: "24h response time" },
                  { icon: <RiCheckDoubleLine size={14} />, label: "Real-time updates" },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]"
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
    </div>
  );
}

export default function SupportPage() {
  return (
    <PageSuspense fallback={<SupportPageSkeleton />}>
      <SupportPageInner />
    </PageSuspense>
  );
}