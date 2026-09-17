"use client";

import React from "react";
import { MdOutlineQrCode } from "react-icons/md";
import { PiBellFill } from "react-icons/pi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import { useNotificationStore } from "@/src/stores/notification-store";

export const useNotificationCount = () => {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  return unreadCount;
};

export const NotificationsDropdown = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const clearAll = useNotificationStore((state) => state.clearAll);

  const hasItems = notifications && notifications.length > 0;

  return (
    <div className="bg-elevated border border-white/[0.06] w-[360px] rounded-2xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <span className="text-sm font-bold text-white">Notifications</span>
        {hasItems && (
          <div className="flex items-center gap-3">
            <button onClick={markAllAsRead} className="text-[11px] font-medium text-white/50 hover:text-white transition-colors">
              Mark all read
            </button>
            <button onClick={clearAll} className="text-xs font-semibold text-primary hover:text-primary/70 flex items-center gap-1 transition-colors">
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col max-h-[380px] overflow-y-auto custom-scrollbar">
        {!hasItems ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/25">
            <MdOutlineQrCode size={28} />
            <span className="text-xs font-medium">No recent notifications</span>
          </div>
        ) : (
          notifications.map((notif) => {
            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
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
