import { useUserStore } from "@/src/stores/user-store";

export const BalanceCloak = ({
  balance,
}: {
  balance: string | undefined | number | null;
}) => {
  const hidebalance = useUserStore((state) => state.hideBalance);

  return hidebalance ? "****" : (+(balance || 0))?.toLocaleString("en-US");
};
