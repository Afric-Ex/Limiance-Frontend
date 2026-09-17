import { useBalanceCloakStore } from "@/src/stores/balance-cloak-store";
import { useUserStore } from "@/src/stores/user-store";

export const BalanceCloak = ({
  balance,
}: {
  balance: string | undefined | number | null;
}) => {
  const enabled = useBalanceCloakStore((s) => s.enabled);
  const legacyHide = useUserStore((s) => s.hideBalance);
  const hidebalance = enabled || legacyHide;

  return hidebalance ? "****" : (+(balance || 0))?.toLocaleString("en-US");
};
