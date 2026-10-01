"use client";

import { useEffect } from "react";
import { modals } from "@mantine/modals";
import { wsClient } from "@/src/lib/websocket-client";
import { useUserStore } from "@/src/stores/user-store";
import { useDepositStore } from "@/src/stores/deposit-store";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { DepositSuccessModal } from "@/src/components/transactions/deposit-success-modal";

/**
 * DepositAlertProvider – zero-UI client component that watches the
 * `balance_update` stream and pops a "deposit confirmed" modal when a credit
 * lands for a deposit the user actually started.
 *
 * Mounted once in the root layout. A `balance_update` frame on its own is
 * ambiguous — trades, conversions and internal transfers produce the same
 * positive delta — so the frame is only celebrated when it matches a
 * pending deposit recorded by the deposit flows. See `deposit-store`.
 */
export function DepositAlertProvider() {
  const user = useUserStore((state) => state.user);
  const hasPendingDeposit = useDepositStore((state) => state.pending.length > 0);

  useEffect(() => {
    if (!user || !hasPendingDeposit) return;

    // No send payload: the server pushes balance changes to the authenticated
    // socket, so we only need the handler registered for this topic.
    //
    // Gated on there actually being a deposit in flight. `claimCredit` can only
    // ever match a symbol in the pending list, so with nothing pending this
    // subscription is a handler that discards every frame — while holding the
    // socket open on every page for the life of the tab.
    const unsubscribe = wsClient.subscribe("balance_update", null, (data) => {
      const store = useDepositStore.getState();
      const credit = store.claimCredit(data);
      if (!credit) return;

      modals.open({
        children: <DepositSuccessModal {...credit} />,
        ...DEFAULT_MODAL_SETTINGS,
      });
    });

    return unsubscribe;
  }, [user, hasPendingDeposit]);

  return null;
}
