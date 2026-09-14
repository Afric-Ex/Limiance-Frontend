"use client";

import { useState, useEffect } from "react";
import { modals } from "@mantine/modals";
import { useMutation } from "@tanstack/react-query";
import { tradingService } from "@/src/services/trading";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import { MarginTermsInfo } from "@/src/components/assets/margin-terms-info";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { MarginAccountPanel } from "@/src/components/trades/margin-account-panel";

function Margin() {
  const [tradeMode, setTradeMode] = useState<"cross" | "isolated">("cross");

  const { mutate: handleSetMarginMode } = useMutation({
    mutationFn: (mode: "cross" | "isolated") => tradingService.setMarginMode(mode),
    onSuccess: (data, mode) => {
      setTradeMode(mode);
      successNotification(`Margin mode set to ${mode === 'cross' ? 'Cross' : 'Isolated'}`);
    },
    onError: (e) => errorMessageHandler(e),
  });

  useEffect(() => {
    modals.open({
      children: <MarginTermsInfo />,
      ...DEFAULT_MODAL_SETTINGS,
      closeOnClickOutside: false,
    });
  }, []);

  return (
    <main className="flex flex-col gap-6 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4 mt-2">
      <MarginAccountPanel
        tradeMode={tradeMode}
        onTradeModeChange={handleSetMarginMode}
      />
    </main>
  );
}

export default Margin;
