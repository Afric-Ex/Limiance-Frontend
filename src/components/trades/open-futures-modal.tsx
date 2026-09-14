import React, { useState } from "react";
import { ModalClose } from "../icons/modal-close";
import Image from "next/image";
import { icons } from "../assets/icons";
import { Radio, Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { tradingService } from "@/src/services/trading";
import toast from "react-hot-toast";

import { useUserStore } from "@/src/stores/user-store";

interface OpenFuturesModalProps {
  onConfirm: () => void;
}

export const OpenFuturesModal = ({ onConfirm }: OpenFuturesModalProps) => {
  const { setUser, user } = useUserStore();
  const [checked, setChecked] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const canCreate = checked && checked2 && !isLoading;

  const handleCreate = async () => {
    if (!canCreate) return;
    setIsLoading(true);
    
    try {
      await tradingService.acceptFutures();
      toast.success("Futures Account activated successfully!");
      if (user) {
        setUser({ ...user, isFuturesAccepted: true });
      }
      onConfirm();
      modals.closeAll();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to activate Futures Account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[823px] flex flex-col bg-gray-10 border-gray-9/70 rounded-32px p-6">
      <ModalClose
        className="self-end cursor-pointer"
        onClick={() => modals.closeAll()}
      />
      <div className="w-full flex flex-col gap-10 max-w-[684px] mx-auto">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center flex-col gap-3">
              <Image src={icons.trello} alt="trello" />
              <h3 className="text-4xl">Open Futures Account</h3>
            </div>
            <p className="text-center text-white/55 text-18px">
              Futures trading is a type of financial trading where participants
              buy or sell contracts that obligate them to purchase or deliver an
              asset at a predetermined price on a future date. These contracts
              are standardized and traded on futures exchanges.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-2xl pl-10">Regulations</h4>
            <Radio
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              label={
                <span>
                  I have read and agree to{" "}
                  <span className="text-primary cursor-pointer">
                    Lumiance Futures regulations
                  </span>
                </span>
              }
              classNames={{
                radio: "!bg-transparent !border-gray-35",
                icon: "!text-primary",
                label: "!text-white/55",
              }}
            />
            <Radio
              checked={checked2}
              onChange={(e) => setChecked2(e.target.checked)}
              label="I understood the rules and risks of futures trading, and I agree that any loss incurred during Futures trading is my own responsibility, regardless of the platform"
              classNames={{
                radio: "!bg-transparent !border-gray-35",
                icon: "!text-primary",
                label: "!text-white/55",
              }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="bg-primary rounded-3xl text-white py-23px text-base w-full max-w-[460px] self-center font-bold disabled:bg-gray-9 disabled:text-white/45 transition-colors flex items-center justify-center gap-2"
          disabled={!canCreate}
        >
          {isLoading && <Loader size={16} color="white" />}
          Create Account
        </button>
      </div>
    </div>
  );
};
