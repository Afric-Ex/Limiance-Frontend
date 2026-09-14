"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supportService, supportKeys } from "@/src/services/support";
import { SupportTicket, SupportMessage } from "@/src/types/support";
import { errorNotification, successNotification } from "@/src/lib/notification-handler";
import {
  RiCustomerService2Line,
  RiSendPlaneFill,
  RiAddLine,
  RiCloseLine,
  RiArrowLeftLine,
  RiTimeLine,
  RiCheckDoubleLine,
  RiFileTextLine,
} from "react-icons/ri";
import { MdOutlineSupportAgent } from "react-icons/md";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Account Issue",
  "Deposit / Withdrawal",
  "Trade Problem",
  "KYC / Verification",
  "Security",
  "Other",
];

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  open:         { label: "Open",         bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  in_progress:  { label: "In Progress",  bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  pending_user: { label: "Pending You",  bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  resolved:     { label: "Resolved",     bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  closed:       { label: "Closed",       bg: "rgba(107,114,128,0.12)", color: "#6b7280" },
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

// ─── Create Ticket Modal ──────────────────────────────────────────────────────

function CreateTicketModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");

  const { mutate: create, isPending } = useMutation({
    mutationFn: () => supportService.createTicket({ subject, category, message }),
    onSuccess: () => {
      successNotification("Support ticket created!");
      qc.invalidateQueries({ queryKey: supportKeys.tickets() });
      onClose();
    },
    onError: () => errorNotification("Failed to create ticket. Please try again."),
  });

  const valid = subject.trim().length > 3 && message.trim().length > 10;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: "linear-gradient(145deg, #131621, #0e1018)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "28px 28px 24px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          animation: "slideUp 0.25s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))",
              border: "1px solid rgba(59,130,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#60a5fa",
            }}>
              <RiFileTextLine size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>New Support Ticket</h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>We typically reply within 24 hours</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}>
            <RiCloseLine size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Subject */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly describe your issue…"
              style={{
                width: "100%", padding: "10px 14px", boxSizing: "border-box",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none",
              }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Message */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Please describe your issue in detail…"
              style={{
                width: "100%", padding: "10px 14px", boxSizing: "border-box",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none",
                resize: "vertical", fontFamily: "inherit",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => create()}
            disabled={!valid || isPending}
            style={{
              width: "100%", padding: "12px 0",
              background: valid && !isPending
                ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                : "rgba(255,255,255,0.06)",
              border: "none", borderRadius: 10,
              color: valid && !isPending ? "#fff" : "rgba(255,255,255,0.3)",
              fontSize: 14, fontWeight: 600, cursor: valid && !isPending ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {isPending ? "Submitting…" : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
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
    select: (r) => (r as any)?.data?.ticket ?? (r as any)?.ticket ?? ticket,
    refetchInterval: 15000,
  });

  const thread: SupportTicket = data ?? ticket;
  const messages: SupportMessage[] = thread.messages ?? [];

  const { mutate: sendReply, isPending: sending } = useMutation({
    mutationFn: () => supportService.replyTicket(ticket.id, { message: reply }),
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: supportKeys.ticket(ticket.id) });
    },
    onError: () => errorNotification("Failed to send reply"),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const st = STATUS_STYLES[thread.status] ?? STATUS_STYLES.open;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Thread header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4, display: "flex" }}
        >
          <RiArrowLeftLine size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {thread.subject}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
            #{thread.id} · {thread.category}
          </div>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: st.bg, color: st.color, flexShrink: 0,
        }}>
          {st.label}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              height: 64, borderRadius: 12, background: "rgba(255,255,255,0.04)",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", paddingTop: 40, fontSize: 13 }}>
            No messages yet
          </div>
        ) : (
          messages.map((msg, i) => {
            const isAdmin = msg.sender === "admin";
            return (
              <div key={i} style={{ display: "flex", justifyContent: isAdmin ? "flex-start" : "flex-end" }}>
                {isAdmin && (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginRight: 8, marginTop: 2,
                    background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))",
                    border: "1px solid rgba(59,130,246,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa",
                  }}>
                    <MdOutlineSupportAgent size={14} />
                  </div>
                )}
                <div style={{ maxWidth: "72%" }}>
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: isAdmin ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                    background: isAdmin
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))",
                    border: `1px solid ${isAdmin ? "rgba(255,255,255,0.07)" : "rgba(59,130,246,0.2)"}`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: isAdmin ? "rgba(255,255,255,0.3)" : "#60a5fa", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      {isAdmin ? "Support Team" : "You"}
                    </div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.55 }}>{msg.message}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 5, textAlign: isAdmin ? "left" : "right" }}>
                      {timeAgo(msg.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {thread.status !== "closed" && thread.status !== "resolved" ? (
        <div style={{
          padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0,
        }}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendReply(); }}
            placeholder="Type your reply… (Ctrl+Enter to send)"
            rows={2}
            style={{
              flex: 1, padding: "10px 12px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, color: "#f1f5f9", fontSize: 13, outline: "none",
              resize: "none", fontFamily: "inherit", transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
          <button
            onClick={() => sendReply()}
            disabled={sending || !reply.trim()}
            style={{
              height: 40, width: 40, flexShrink: 0,
              background: reply.trim()
                ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                : "rgba(255,255,255,0.06)",
              border: "none", borderRadius: 10,
              color: reply.trim() ? "#fff" : "rgba(255,255,255,0.25)",
              cursor: reply.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            <RiSendPlaneFill size={16} />
          </button>
        </div>
      ) : (
        <div style={{
          padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", flexShrink: 0,
        }}>
          This ticket is {thread.status}
        </div>
      )}
    </div>
  );
}

// ─── Ticket List Item ─────────────────────────────────────────────────────────

function TicketItem({ ticket, isActive, onClick }: { ticket: SupportTicket; isActive: boolean; onClick: () => void }) {
  const st = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.open;
  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        cursor: "pointer",
        background: isActive ? "rgba(59,130,246,0.07)" : "transparent",
        borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#93c5fd" : "#e2e8f0", flex: 1, paddingRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ticket.subject}
        </div>
        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: st.bg, color: st.color, flexShrink: 0, whiteSpace: "nowrap" }}>
          {st.label}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{ticket.category}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{timeAgo(ticket.updated_at || ticket.created_at)}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const { data, isLoading } = useQuery({
    queryKey: supportKeys.tickets(),
    queryFn: () => supportService.listTickets(),
    select: (r) => (r as any)?.data?.tickets ?? (r as any)?.tickets ?? [],
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
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)", minHeight: 0 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))",
            border: "1px solid rgba(59,130,246,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa",
          }}>
            <RiCustomerService2Line size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Support Center</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              {openCount > 0 ? `${openCount} active ticket${openCount !== 1 ? "s" : ""}` : "No open tickets"} · We reply within 24h
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            border: "none", borderRadius: 10, color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.3)"; }}
        >
          <RiAddLine size={16} />
          New Ticket
        </button>
      </div>

      {/* Main panel */}
      <div style={{
        flex: 1, minHeight: 0,
        display: "grid", gridTemplateColumns: "320px 1fr", gap: 16,
        overflow: "hidden",
      }}
      className="support-grid"
      >
        {/* Left — ticket list */}
        <div style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Your Tickets ({tickets.length})
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ margin: 12, height: 72, borderRadius: 10, background: "rgba(255,255,255,0.04)" }} />
              ))
            ) : tickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <RiCustomerService2Line size={36} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 12 }} />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: 0 }}>No tickets yet</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", margin: "4px 0 0" }}>Open one if you need help</p>
              </div>
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
        <div style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {selected ? (
            <TicketThread ticket={selected} onBack={handleBack} />
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 22,
                background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.07))",
                border: "1px solid rgba(59,130,246,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa",
              }}>
                <RiCustomerService2Line size={32} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0 }}>Select a ticket</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: "4px 0 0" }}>
                  or create a new one to get help
                </p>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                {[
                  { icon: <RiTimeLine size={14} />, label: "24h response time" },
                  { icon: <RiCheckDoubleLine size={14} />, label: "Real-time updates" },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                    {icon} {label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} />}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 768px) {
          .support-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
