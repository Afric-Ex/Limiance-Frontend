import { useQuery } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";

export type TradeConfirmationKey =
  | "limitOrder"
  | "marketOrder"
  | "stopOrder"
  | "autoBorrowRepayMargin";

/**
 * Reads the "Order confirmations" preferences from the backend. When a flag is
 * on, the matching trade action must be confirmed by the user before it is sent.
 */
export function useTradeConfirmations() {
  const { data } = useQuery({
    queryKey: userKeys.settings,
    queryFn: userService.getSettings,
    select: (response) => response.data,
  });

  const reminders = data?.tradeOrdersNotificationReminder;

  return {
    isEnabled: (key: TradeConfirmationKey) => Boolean(reminders?.[key]),
  };
}
