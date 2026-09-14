import { WalletCard } from "@/src/components/assets/wallet-card";
import { FundingTable } from "@/src/components/assets/funding-table";

function Spot() {
  return (
    <main className="flex flex-col gap-8 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4">
      <WalletCard title="Funding Account" />

      <FundingTable />
    </main>
  );
}

export default Spot;
