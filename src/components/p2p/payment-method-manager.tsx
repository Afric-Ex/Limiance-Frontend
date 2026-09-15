"use client";

import React, { useState } from "react";
import { Drawer, Button, Select, TextInput, ActionIcon, Loader, Skeleton } from "@mantine/core";
import { MdDelete } from "react-icons/md";
import { PaymentMethodBadge } from "./payment-method-badge";
import { usePaymentMethods, useAddPaymentMethod } from "@/src/hooks/p2p/use-p2p";

interface PaymentMethodManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethodIds: string[];
  onChangeSelected: (methods: string[]) => void;
  fiat?: string;
  adMode?: "BUY" | "SELL";
}

export const PaymentMethodManager = ({ isOpen, onClose, selectedMethodIds, onChangeSelected, fiat, adMode }: PaymentMethodManagerProps) => {
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
        }
      }
    );
  };

  const toggleSelection = (methodId: string) => {
    if (selectedMethodIds.includes(methodId)) {
      onChangeSelected(selectedMethodIds.filter(m => m !== methodId));
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
        content: "bg-elevated text-white",
        header: "bg-elevated text-white border-b border-white/10",
        title: "text-lg font-bold",
        close: "text-white/50 hover:text-white"
      }}
    >
      <div className="flex flex-col gap-6 pt-4">
        
        <div className="text-white/70 text-sm">
          Select up to 3 payment methods for this ad. You must only use accounts matching your verified real name.
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton height={20} width={20} radius="sm" />
                  <Skeleton height={20} width={120} />
                </div>
                <div className="pl-6 space-y-2 mt-2">
                  <Skeleton height={14} width={180} />
                  <Skeleton height={14} width={160} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {savedMethods.map(sm => {
              const isSelected = selectedMethodIds.includes(sm.id);
              return (
                <div 
                  key={sm.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-yellow-500/10 border-yellow-500 text-white" 
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => toggleSelection(sm.id)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 rounded border-white/20 bg-transparent text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="font-semibold">{sm.data?.bankName || sm.method}</span>
                    </div>
                  </div>
                  <div className="pl-6 space-y-1 text-sm">
                    <div><span className="opacity-50">Name:</span> {sm.data?.accountName}</div>
                    <div><span className="opacity-50">Account:</span> {sm.data?.accountNumber}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isAdding ? (
          <div className="bg-black/20 p-4 rounded-xl border border-white/10 flex flex-col gap-4">
            <h4 className="font-bold">Add New Method</h4>
            
            <Select
              label="Method"
              value={newMethod}
              onChange={(val) => setNewMethod(val || "Bank Transfer")}
              data={["Bank Transfer", "PayPal", "WeChat", "Alipay"]}
              classNames={{
                label: "text-white/70 text-sm mb-1",
                input: "bg-black/40 border-white/10 text-white focus:border-primary",
                dropdown: "bg-gray-900 border-white/10 text-white",
                option: "hover:bg-white/10 data-[combobox-selected]:bg-primary/20"
              }}
            />
            
            <TextInput
              label="Account Name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.currentTarget.value)}
              placeholder="Exactly as shown on ID"
              classNames={{
                label: "text-white/70 text-sm mb-1",
                input: "bg-black/40 border-white/10 text-white focus:border-primary"
              }}
            />

            <TextInput
              label="Account Number"
              value={newAccountNumber}
              onChange={(e) => setNewAccountNumber(e.currentTarget.value)}
              placeholder="Number or Email"
              classNames={{
                label: "text-white/70 text-sm mb-1",
                input: "bg-black/40 border-white/10 text-white focus:border-primary"
              }}
            />

            {newMethod === "Bank Transfer" && (
              <TextInput
                label="Bank Name"
                value={newBankName}
                onChange={(e) => setNewBankName(e.currentTarget.value)}
                classNames={{
                  label: "text-white/70 text-sm mb-1",
                  input: "bg-black/40 border-white/10 text-white focus:border-primary"
                }}
              />
            )}

            <div className="flex gap-3 mt-2">
              <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/5" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold" loading={isAddingMethod} disabled={!newAccountName || !newAccountNumber} onClick={handleAdd}>
                Add Method
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="light" 
            className="w-full border-dashed border-2 border-white/20 bg-transparent hover:bg-white/5 text-white"
            onClick={() => setIsAdding(true)}
          >
            + Add New Payment Method
          </Button>
        )}

        <Button className="w-full mt-auto bg-yellow-500 hover:bg-yellow-400 text-black font-semibold" size="lg" onClick={onClose}>
          Done
        </Button>
      </div>
    </Drawer>
  );
};
