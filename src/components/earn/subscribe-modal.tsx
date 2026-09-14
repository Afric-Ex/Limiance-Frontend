import { useState } from "react";
import { NumberInput, Loader } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MOCK_MODE } from "@/src/mocks";
import { mockEarn } from "@/src/mocks/mock-earn";
import { earnService, earnKeys } from "@/src/services/earn";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { modals } from "@mantine/modals";

interface Product {
  id: string;
  asset: string;
  image: string;
  apy: number;
  minAmount: string;
  lockDays: number;
  type: "fixed" | "flexible";
  totalStaked: string;
  available: boolean;
}

export const SubscribeModal = ({ product }: { product: Product }) => {
  const [amount, setAmount] = useState<number | string>("");
  const queryClient = useQueryClient();

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: async () => {
      if (!amount || +amount <= 0) throw new Error("Enter a valid amount");
      const payload = { productId: product.id, amount: amount.toString() };
      return MOCK_MODE.earnInfo 
        ? mockEarn.subscribe(payload)
        : earnService.subscribe(payload);
    },
    onSuccess: () => {
      successNotification(`Successfully staked ${amount} ${product.asset}`);
      queryClient.invalidateQueries({ queryKey: earnKeys.myPositions });
      modals.closeAll();
    },
    onError: errorMessageHandler,
  });

  return (
    <div className="flex flex-col gap-6 text-white p-2">
      <div className="flex flex-col gap-4">
        {/* Header Info */}
        <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src={product.image} alt={product.asset} className="w-8 h-8 rounded-full" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white/90">{product.asset}</span>
              <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded w-fit mt-1">
                {product.type === "fixed" ? `${product.lockDays} Days Lock` : "Flexible"}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-white/40 font-medium">Est. APY</span>
            <span className="text-lg font-mono font-bold text-success-5">
              {product.apy.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2 relative z-50">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/40">Amount to Stake</span>
            <span className="text-white/60">
              Min: <span className="font-mono text-white/90">{product.minAmount}</span> {product.asset}
            </span>
          </div>

          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] focus-within:border-primary transition-colors rounded-lg px-4 py-2 h-[52px]">
            <NumberInput
              hideControls
              value={amount}
              onChange={setAmount}
              min={+product.minAmount}
              classNames={{
                root: "!flex-1",
                input: "!bg-transparent !h-full !text-base font-semibold font-mono tabular-nums !text-white !border-0 focus:!ring-0 placeholder:!text-white/20",
              }}
              placeholder="0.00"
            />
            <button 
              onClick={() => setAmount(Number(product.minAmount) * 10)} 
              className="text-xs font-bold text-primary hover:text-white transition-colors cursor-pointer px-2"
            >
              MAX
            </button>
            <span className="text-sm font-semibold text-white/40 ml-2 border-l border-white/[0.06] pl-4">{product.asset}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <div className="flex justify-between text-xs text-white/40">
          <span>Staking Date</span>
          <span className="font-mono">{new Date().toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-xs text-white/40">
          <span>Value Date</span>
          <span className="font-mono">{new Date(Date.now() + 86400000).toLocaleDateString()}</span>
        </div>
        {product.lockDays > 0 && (
          <div className="flex justify-between text-xs text-white/40">
            <span>Redemption Date</span>
            <span className="font-mono text-white/90">{new Date(Date.now() + product.lockDays * 86400000).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => subscribe()}
        disabled={isPending || !amount}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] active:scale-95 mt-4"
      >
        {isPending && <Loader size={16} color="white" />}
        Confirm Stake
      </button>
    </div>
  );
};
