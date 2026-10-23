"use client";

import React, { useState } from "react";
import { Drawer, Button, Select, TextInput, Skeleton } from "@mantine/core";
import { usePaymentMethods, useAddPaymentMethod } from "@/src/hooks/p2p/use-p2p";
import { MdCheck } from "react-icons/md";

interface PaymentMethodManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethodIds: string[];
  onChangeSelected: (methods: string[]) => void;
  fiat?: string;
  adMode?: "BUY" | "SELL";
}

export const PaymentMethodManager = ({
  isOpen,
  onClose,
  selectedMethodIds,
  onChangeSelected,
}: PaymentMethodManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);

  const { data: pmData, isLoading } = usePaymentMethods();
  const { mutate: addPaymentMethod, isPending: isAddingMethod } = useAddPaymentMethod();

  const savedMethods: any[] = pmData?.data?.data ?? [];

  const [newMethod, setNewMethod] = useState("Bank Transfer");
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newBankName, setNewBankName] = useState("");

  const handleAdd = () => {
    addPaymentMethod(
      {
        method: newMethod,
        accountName: newAccountName,
        accountNumber: newAccountNumber,
        bankName: newBankName,
      },
      {
        onSuccess: () => {
          setIsAdding(false);
          setNewAccountName("");
          setNewAccountNumber("");
          setNewBankName("");
        },
      }
    );
  };

  const toggleSelection = (methodId: string) => {
    if (selectedMethodIds.includes(methodId)) {
      onChangeSelected(selectedMethodIds.filter((m) => m !== methodId));
    } else if (selectedMethodIds.length < 3) {
      onChangeSelected([...selectedMethodIds, methodId]);
    }
  };

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="right"
      title="Manage Payment Methods"
      size="md"
      classNames={{
        content: "!bg-[#181a20] !text-white",
        header: "!bg-[#181a20] !text-white !border-b !border-white/[0.06]",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-4 pt-3 h-full">
        <div className="text-white/50 text-xs leading-relaxed">
          Select up to 3 payment methods for this ad. All accounts must match your verified real name.
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2].map((i) => (
              <div key={i} className="p-3.5 rounded-lg border border-white/[0.07] bg-white/[0.02] flex flex-col gap-2">
                <Skeleton height={14} width={120} />
                <Skeleton height={10} width={180} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {savedMethods.map((sm) => {
              const isSelected = selectedMethodIds.includes(sm.id);
              return (
                <div
                  key={sm.id}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/[0.08] border-primary/40 text-white"
                      : "bg-white/[0.03] border-white/[0.07] text-white/70 hover:bg-white/[0.05]"
                  }`}
                  onClick={() => toggleSelection(sm.id)}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-xs text-white">
                      {sm.data?.bankName || sm.method}
                    </span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {isSelected && <MdCheck size={12} />}
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div>
                      <span className="text-white/40">Name:</span> {sm.data?.accountName}
                    </div>
                    <div>
                      <span className="text-white/40">Account:</span> {sm.data?.accountNumber}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isAdding ? (
          <div className="bg-white/[0.03] p-4 rounded-lg border border-white/[0.07] flex flex-col gap-3">
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider">Add Payment Method</h4>

            <Select
              label="Method"
              value={newMethod}
              onChange={(val) => setNewMethod(val || "Bank Transfer")}
              data={["Bank Transfer", "PayPal", "WeChat", "Alipay"]}
              classNames={{
                label: "!text-white/60 !text-xs !mb-1 font-medium",
                input:
                  "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !h-9 !rounded-lg !text-xs",
                dropdown: "!bg-[#181a20] !border !border-white/[0.09] !text-white !rounded-lg !shadow-2xl",
                option:
                  "hover:!bg-white/[0.08] data-[combobox-selected]:!bg-primary/20 data-[combobox-selected]:!text-primary !rounded-md !mx-1 !my-0.5 !text-xs !transition-colors",
              }}
            />

            <TextInput
              label="Account Name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.currentTarget.value)}
              placeholder="Exactly as shown on official ID"
              classNames={{
                label: "!text-white/60 !text-xs !mb-1 font-medium",
                input:
                  "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !h-9 !rounded-lg !text-xs",
              }}
            />

            <TextInput
              label="Account Number / Identifier"
              value={newAccountNumber}
              onChange={(e) => setNewAccountNumber(e.currentTarget.value)}
              placeholder="Bank account number or payment ID"
              classNames={{
                label: "!text-white/60 !text-xs !mb-1 font-medium",
                input:
                  "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !h-9 !rounded-lg !text-xs",
              }}
            />

            {newMethod === "Bank Transfer" && (
              <TextInput
                label="Bank Name"
                value={newBankName}
                onChange={(e) => setNewBankName(e.currentTarget.value)}
                placeholder="Full bank name"
                classNames={{
                  label: "!text-white/60 !text-xs !mb-1 font-medium",
                  input:
                    "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !h-9 !rounded-lg !text-xs",
                }}
              />
            )}

            <div className="flex gap-2.5 mt-1">
              <Button
                variant="subtle"
                className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-9 !rounded-lg !text-xs !font-semibold"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 !bg-primary hover:!bg-primary/90 !text-white !h-9 !rounded-lg !text-xs !font-semibold"
                loading={isAddingMethod}
                disabled={!newAccountName || !newAccountNumber}
                onClick={handleAdd}
              >
                Save Method
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="subtle"
            className="w-full !border !border-white/[0.08] !bg-white/[0.03] hover:!bg-white/[0.06] !text-white/80 !h-9 !rounded-lg !text-xs !font-semibold"
            onClick={() => setIsAdding(true)}
          >
            + Add New Payment Method
          </Button>
        )}

        <Button
          className="w-full mt-auto !bg-primary hover:!bg-primary/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </Drawer>
  );
};
