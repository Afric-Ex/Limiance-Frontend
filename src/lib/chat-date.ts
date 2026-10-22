import { parseDate } from "./parse-date";

export const formatChatTime = (value: unknown): string => {
  const date = parseDate(value);
  return date
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
};

export const chatDayKey = (value: unknown): string => {
  const date = parseDate(value);
  if (!date) return "unknown";
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

export const formatChatDayLabel = (value: unknown): string => {
  const date = parseDate(value);
  if (!date) return "Earlier";

  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return day.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const getChatTimestamp = (value: unknown): number =>
  parseDate(value)?.getTime() ?? Number.POSITIVE_INFINITY;
