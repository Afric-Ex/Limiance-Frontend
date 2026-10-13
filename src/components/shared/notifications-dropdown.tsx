"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@mantine/core";
import { MdOutlineQrCode } from "react-icons/md";
import { PiBellFill } from "react-icons/pi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import { useNotificationStore, AppNotification } from "@/src/stores/notification-store";
import { notificationService } from "@/src/services/notification";
import { useNotifications } from "@/src/hooks/use-notifications";

export const useNotificationCount = () => {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  return unreadCount;
};

export const NotificationsDropdown = () => {
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const storeNotifications = useNotificationStore((state) => state.notifications);
  const { notifications: serverNotifications, error, isLoading } = useNotifications();
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const openNotification = useNotificationStore((state) => state.openNotification);

  // Store is the source of truth (seeded from the API); fall back to the raw
  // query result if the store hasn't been seeded yet.
  const notifications =
    storeNotifications.length > 0 ? storeNotifications : serverNotifications;
  const hasItems = notifications && notifications.length > 0;
  const filteredNotifications = notifications.filter((notif) => {
    if (readFilter === "unread") return !notif.read;
    if (readFilter === "read") return notif.read;
    return true;
  });

  const handleMarkAllRead = () => {
    markAllAsRead();
    // Best-effort server sync — never block the UI on it
    notificationService.markAllRead().catch(() => {});
  };

  const handleClear = () => {
    clearAll();
    // No delete-all endpoint; mark all as read server-side so refetches come back read
    notificationService.markAllRead().catch(() => {});
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      markAsRead(notif.id);
      notificationService.markRead(notif.id).catch(() => {});
    }
    // The detail modal lives outside the popover (mounted in <Header>), so the
    // popover unmounting on close doesn't kill it.
    openNotification(notif);
  };

  return (
    <div className="bg-elevated border border-white/[0.06] w-[360px] max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <span className="text-sm font-bold text-white">Notifications</span>
        {hasItems && (
          <div className="flex items-center gap-3">
            <button onClick={handleMarkAllRead} className="text-[11px] font-medium text-white/50 hover:text-white transition-colors">
              Mark all read
            </button>
            <button onClick={handleClear} className="text-xs font-semibold text-primary hover:text-primary/70 flex items-center gap-1 transition-colors">
              Clear
            </button>
          </div>
        )}
      </div>

      {hasItems && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]" role="group" aria-label="Filter notifications by read status">
          {([
            ["all", "All"],
            ["unread", "Unread"],
            ["read", "Read"],
          ] as const).map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              aria-pressed={readFilter === filter}
              onClick={(e) => {
                e.stopPropagation();
                setReadFilter(filter);
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                readFilter === filter
                  ? "bg-primary/20 text-primary"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {label}
              {filter === "unread" && (
                <span className="ml-1">({notifications.filter((notif) => !notif.read).length})</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col max-h-[380px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/25">
            <PiBellFill size={28} />
            <span className="text-xs font-medium">Loading notifications…</span>
          </div>
        ) : !hasItems ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/25">
            <MdOutlineQrCode size={28} />
            {error ? (
              <span className="text-xs font-medium">Failed to load notifications</span>
            ) : (
              <span className="text-xs font-medium">No recent notifications</span>
            )}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/25">
            <MdOutlineQrCode size={24} />
            <span className="text-xs font-medium">
              No {readFilter === "unread" ? "unread" : "read"} notifications
            </span>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNotificationClick(notif);
                  }
                }}
                className={`flex items-start gap-3 px-5 py-4 border-b border-white/[0.04] transition-colors last:border-0 cursor-pointer ${notif.read ? "hover:bg-white/[0.02]" : "bg-primary/5 hover:bg-primary/10"}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-primary/20"
                >
                  <PiBellFill size={16} className="text-primary" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className={`text-xs font-semibold ${notif.read ? 'text-white/80' : 'text-white'} truncate`}>
                    {notif.title}
                  </span>
                  <span className={`text-[11px] line-clamp-2 ${notif.read ? 'text-white/40' : 'text-white/60'}`}>
                    {notif.body}
                  </span>
                  <span className="text-[10px] text-white/25 mt-1">
                    {dayjs(notif.createdAt).fromNow()}
                  </span>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const NotificationDetailModal = () => {
  const router = useRouter();
  const viewing = useNotificationStore((state) => state.viewing);
  const closeNotification = useNotificationStore((state) => state.closeNotification);

  return (
    <Modal
      opened={Boolean(viewing)}
      onClose={closeNotification}
      centered
      classNames={{
        content: "bg-elevated border border-white/10",
        header: "bg-elevated border-b border-white/5",
        title: "text-white font-bold",
        close: "text-white/50 hover:text-white",
      }}
    >
      {viewing ? (
        <div className="flex flex-col pt-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/20">
              <PiBellFill size={20} className="text-primary" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-base font-bold text-white leading-tight">
                {viewing.title}
              </span>
              {viewing.type && (
                <span className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">
                  {viewing.type.replaceAll("_", " ")}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
            {viewing.body}
          </p>

          <div className="flex items-center justify-between mt-6">
            <span className="text-[11px] text-white/30">
              {dayjs(viewing.createdAt).format("MMM D, YYYY h:mm A")}
            </span>
            {viewing.link ? (
              <button
                onClick={() => {
                  const link = viewing.link;
                  closeNotification();
                  if (link) {
                    router.push(link);
                  }
                }}
                className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
              >
                View details →
              </button>
            ) : (
              <span className="text-[11px] text-white/30">
                {viewing.read ? "Read" : "Unread"}
              </span>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};