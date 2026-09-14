"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { p2p, p2pKey } from "@/src/services/p2p";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { Modal, Loader } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { BusinessCard } from "@/src/components/icons/business-card";
import { Delete as Trash } from "@/src/components/icons/trash";
import { Add } from "@/src/components/icons/add";
import { MdVisibility, MdVisibilityOff, MdClose, MdAccountBalance } from "react-icons/md";
import clsx from "clsx";

type Step = 1 | 2;

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();

  // Queries
  const { data: methods, isLoading } = useQuery({
    queryKey: p2pKey.paymentMethods(),
    queryFn: () => p2p.fetchPaymentMethod(),
    select: (res: any) => res?.data?.data ?? res?.data ?? [],
  });

  // Modal
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [step, setStep] = useState<Step>(1);

  // Form
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  // Reveal account number
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const resetModal = () => {
    setStep(1);
    setBankName(""); setAccountNumber(""); setAccountName("");
    setFormErrors({});
  };

  const handleClose = () => { closeModal(); resetModal(); };

  // Add mutation
  const { mutate: addMethod, isPending: addLoading } = useMutation({
    mutationFn: () => p2p.addPaymentMethod({ method: "bank_transfer", bankName, accountNumber, accountName }),
    onSuccess: () => {
      successNotification("Payment method added.");
      handleClose();
      queryClient.invalidateQueries({ queryKey: p2pKey.paymentMethods() });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? "";
      if (msg.toLowerCase().includes("max") || msg.toLowerCase().includes("limit")) {
        errorMessageHandler(new Error("You've reached the maximum of 5 payment methods."));
      } else {
        errorMessageHandler(e);
      }
    },
  });

  // Delete mutation
  const { mutate: deleteMethod, isPending: deleteLoading } = useMutation({
    mutationFn: (id: string) => p2p.deletePaymentMethod(id),
    onSuccess: () => {
      successNotification("Payment method removed.");
      closeDeleteModal();
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: p2pKey.paymentMethods() });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!bankName.trim()) errors.bankName = "Bank name is required";
    if (!accountNumber.trim()) errors.accountNumber = "Account number is required";
    else if (!/^\d{10}$/.test(accountNumber)) errors.accountNumber = "Account number must be exactly 10 digits";
    if (!accountName.trim()) errors.accountName = "Account name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => { if (validate()) addMethod(); };

  const atLimit = Array.isArray(methods) && methods.length >= 5;

  const maskAccount = (num: string) => {
    if (!num) return "——";
    if (num.length <= 4) return num;
    return `••••••${num.slice(-4)}`;
  };

  return (
    <main className="flex flex-col gap-8 max-[1150px]:gap-4 max-w-3xl max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter">
      {/* Header */}
      <div className="flex flex-col min-[1150px]:flex-row min-[1150px]:items-start justify-between gap-4 max-[1150px]:gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-sm text-white/50">Manage bank accounts for P2P trading.</p>
        </div>
        {!atLimit && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-3 bg-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] shrink-0"
          >
            <Add />
            Add Payment Method
          </button>
        )}
      </div>

      {/* Context Banner */}
      <div className="p-4 bg-blue-3/30 border border-blue-2/30 rounded-xl">
        <p className="text-sm text-white/70">
          Payment methods are used for P2P trading. Add your bank account details so buyers and sellers can send and receive fiat payments.
        </p>
      </div>

      {/* Limit Notice */}
      {atLimit && (
        <div className="p-4 bg-warning-1/10 border border-warning-1/30 rounded-xl flex items-center gap-3">
          <span className="text-warning-1 shrink-0">⚠</span>
          <p className="text-sm text-warning-1">You've reached the maximum of 5 payment methods.</p>
        </div>
      )}

      {/* Methods List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader color="blue" /></div>
      ) : Array.isArray(methods) && methods.length > 0 ? (
        <div className="flex flex-col gap-4">
          {methods.map((method: any) => {
            const id = method.id ?? method._id;
            const revealed = revealedIds.has(id);
            const acctNum = method.data?.accountNumber ?? method.accountNumber ?? method.account_number ?? "";
            return (
              <div key={id} className="p-6 max-[1150px]:p-4 bg-primary/10 border border-primary/25 rounded-20px max-[1150px]:rounded-xl backdrop-blur-8px flex flex-col min-[1150px]:flex-row justify-between items-start min-[1150px]:items-center gap-5 max-[1150px]:gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <MdAccountBalance size={24} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{method.data?.bankName ?? method.bankName ?? method.bank_name ?? "Bank"}</span>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 bg-success-6/20 text-success-6 text-[11px] font-bold rounded-full border border-success-6/30">Default</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white/70">
                        {revealed ? acctNum : maskAccount(acctNum)}
                      </span>
                      <button
                        onClick={() => toggleReveal(id)}
                        className="text-white/40 hover:text-white transition-colors"
                        title={revealed ? "Hide" : "Reveal"}
                      >
                        {revealed ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                      </button>
                    </div>
                    <span className="text-xs text-white/50">{method.data?.accountName ?? method.accountName ?? method.account_name ?? ""}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setDeleteConfirmId(id); openDeleteModal(); }}
                  className="flex items-center justify-center max-[1150px]:w-full gap-1.5 px-3 py-2 text-sm text-error-1 border border-error-1/30 rounded-lg hover:bg-error-1/10 transition-all"
                >
                  <Trash />
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-5 py-20 px-8 bg-primary/10 border border-primary/25 rounded-20px">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <MdAccountBalance size={32} />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="font-semibold text-lg">No payment methods added yet</h3>
            <p className="text-sm text-white/50 max-w-xs">Add a payment method to start trading on P2P.</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-3 bg-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            <Add />
            Add Payment Method
          </button>
        </div>
      )}

      {/* Add Payment Method Modal */}
      <Modal
        opened={modalOpen}
        onClose={handleClose}
        title={<span className="font-bold text-lg">{step === 1 ? "Add Payment Method" : "Bank Details"}</span>}
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
        size="md"
        centered
      >
        {step === 1 ? (
          <div className="flex flex-col gap-5 py-2">
            <p className="text-sm text-white/60">Select a payment method type to add.</p>
            {/* Bank Transfer — selectable */}
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-4 p-5 rounded-xl border-2 border-primary bg-primary/10 hover:bg-primary/15 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <MdAccountBalance size={24} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">Bank Transfer</span>
                <span className="text-xs text-white/50">Send and receive via bank account</span>
              </div>
            </button>

            {/* Coming Soon */}
            {["Mobile Money", "Debit / Credit Card"].map((label) => (
              <div key={label} className="flex items-center gap-4 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] opacity-50 cursor-not-allowed">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                  <BusinessCard />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{label}</span>
                    <span className="px-2 py-0.5 bg-white/10 text-white/40 text-[10px] font-bold rounded-full">Coming soon</span>
                  </div>
                  <span className="text-xs text-white/40">Not yet available</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-2">
            <div className="flex flex-col gap-4">
              {/* Bank Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">Bank Name <span className="text-error-1">*</span></label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => { setBankName(e.target.value); setFormErrors((p) => ({ ...p, bankName: "" })); }}
                  placeholder="e.g. First Bank"
                  className={clsx("w-full px-4 py-3 rounded-xl bg-gray-1 border text-sm text-white outline-none transition-all", formErrors.bankName ? "border-error-1" : "border-gray-9/40 focus:border-primary")}
                />
                {formErrors.bankName && <span className="text-xs text-error-1">{formErrors.bankName}</span>}
              </div>

              {/* Account Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">Account Number <span className="text-error-1">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setAccountNumber(val);
                    setFormErrors((p) => ({ ...p, accountNumber: "" }));
                  }}
                  placeholder="10-digit account number"
                  maxLength={10}
                  className={clsx("w-full px-4 py-3 rounded-xl bg-gray-1 border text-sm text-white outline-none transition-all font-mono tracking-widest", formErrors.accountNumber ? "border-error-1" : "border-gray-9/40 focus:border-primary")}
                />
                {formErrors.accountNumber && <span className="text-xs text-error-1">{formErrors.accountNumber}</span>}
              </div>

              {/* Account Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">Account Name <span className="text-error-1">*</span></label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => { setAccountName(e.target.value); setFormErrors((p) => ({ ...p, accountName: "" })); }}
                  placeholder="Full account holder name"
                  className={clsx("w-full px-4 py-3 rounded-xl bg-gray-1 border text-sm text-white outline-none transition-all", formErrors.accountName ? "border-error-1" : "border-gray-9/40 focus:border-primary")}
                />
                {formErrors.accountName && <span className="text-xs text-error-1">{formErrors.accountName}</span>}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-white/20 rounded-xl text-sm font-medium text-white/70 hover:bg-white/[0.04] transition-all">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={addLoading}
                className="flex-1 py-3 bg-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addLoading && <Loader size="xs" color="white" />}
                Add Method
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => { closeDeleteModal(); setDeleteConfirmId(null); }}
        title={<span className="font-bold text-lg">Delete Payment Method</span>}
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
        size="sm"
        centered
      >
        <div className="flex flex-col gap-6 py-2">
          <p className="text-sm text-white/70">
            Delete this payment method? It will no longer be available during P2P trades.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { closeDeleteModal(); setDeleteConfirmId(null); }}
              className="flex-1 py-3 border border-white/20 rounded-xl text-sm font-medium text-white/70 hover:bg-white/[0.04] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => { if (deleteConfirmId) deleteMethod(deleteConfirmId); }}
              disabled={deleteLoading}
              className="flex-1 py-3 bg-error-1 rounded-xl text-sm font-semibold hover:bg-error-1/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleteLoading && <Loader size="xs" color="white" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
