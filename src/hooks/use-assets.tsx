import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "../utils/constants";
import { SelectDepositMethod } from "../components/assets/select-deposit-method";
import { InternalTransfer } from "../components/transactions/internal-transfer";
import { ExternalTransfer } from "../components/transactions/external-transfer";
import { useUserStore } from "../stores/user-store";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

export const useAssets = () => {
  const handleOpenDepositModal = () => {
    modals.open({
      children: <SelectDepositMethod />,
      ...DEFAULT_MODAL_SETTINGS,
    });
  };

  const handleOpenInternalTransferModal = (defaultFrom?: string, defaultTo?: string) => {
    modals.open({
      children: <InternalTransfer defaultFrom={defaultFrom} defaultTo={defaultTo} />,
      ...DEFAULT_MODAL_SETTINGS,
    });
  };

  const handleOpenExternalTransferModal = () => {
    modals.open({
      children: <ExternalTransfer />,
      ...DEFAULT_MODAL_SETTINGS,
    });
  };

  useUserStore((state) => state.user);

  const { coins: portfolio, isLoading: portfolioLoading } = usePortfolioWs();

  return {
    handleOpenDepositModal,
    handleOpenInternalTransferModal,
    handleOpenExternalTransferModal,
    portfolio,
    portfolioLoading,
  };
};
