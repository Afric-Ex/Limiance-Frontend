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
import { MdVisibility, MdVisibilityOff, MdAccountBalance } from "react-icons/md";
import clsx from "clsx";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountPaymentMethodsSkeleton } from "@/src/components/skeletons/account";
import { AccountPageHeader } from "@/src/components/settings/account-page-header";
import { useTranslations } from "next-intl";

type Step = 1 | 2;

function PaymentMethodsPageInner() {
  const t = useTranslations("Settings");
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
      successNotification(t("paymentMethodAdded"));
      handleClose();
      queryClient.invalidateQueries({ queryKey: p2pKey.paymentMethods() });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? "";
      if (msg.toLowerCase().includes("max") || msg.toLowerCase().includes("limit")) {
        errorMessageHandler(new Error(t("paymentMethodsLimit")));
      } else {
        errorMessageHandler(e);
      }
    },
  });

  // Delete mutation
  const { mutate: deleteMethod, isPending: deleteLoading } = useMutation({
    mutationFn: (id: string) => p2p.deletePaymentMethod(id),
    onSuccess: () => {
      successNotification(t("paymentMethodRemoved"));
      closeDeleteModal();
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: p2pKey.paymentMethods() });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!bankName.trim()) errors.bankName = t("bankNameRequired");
    if (!accountNumber.trim()) errors.accountNumber = t("accountNumberRequired");
    else if (!/^\d{10}$/.test(accountNumber)) errors.accountNumber = t("accountNumberDigits");
    if (!accountName.trim()) errors.accountName = t("accountNameRequired");
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
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 pb-8 page-enter max-[1150px]:pb-[100px]">
      <AccountPageHeader
        title={t("paymentMethodsTitle")}
        description={t("paymentMethodsDescription")}
        icon={<MdAccountBalance size={23} />}
        eyebrow={t("p2pPayments")}
        action={
          !atLimit ? (
            <button
              type="button"
              onClick={openModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(77,119,240,0.2)] transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              <Add />
              {t("addPaymentMethod")}
            </button>
          ) : undefined
        }
      />

      {/* Context Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-4 sm:p-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <MdAccountBalance size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-white/90">{t("p2pPayoutMethods")}</p>
          <p className="mt-1 text-sm leading-6 text-white/55">
            {t("p2pPayoutMethodsDescription")}
          </p>
        </div>
      </div>

      {/* Limit Notice */}
      {atLimit && (
        <div className="p-4 bg-warning-1/10 border border-warning-1/30 rounded-xl flex items-center gap-3">
          <span className="text-warning-1 shrink-0">⚠</span>
          <p className="text-sm text-warning-1">{t("paymentMethodsLimit")}</p>
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
              <div key={id} className="account-card flex flex-col items-start justify-between gap-5 !p-5 min-[1150px]:flex-row min-[1150px]:items-center sm:!p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.12] text-primary">
                    <MdAccountBalance size={24} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{method.data?.bankName ?? method.bankName ?? method.bank_name ?? t("bank")}</span>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 bg-success-6/20 text-success-6 text-micro font-bold rounded-full border border-success-6/30">{t("default")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white/70">
                        {revealed ? acctNum : maskAccount(acctNum)}
                      </span>
                      <button
                        onClick={() => toggleReveal(id)}
                        className="text-white/40 hover:text-white transition-colors"
                        title={revealed ? t("hide") : t("reveal")}
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
                  {t("delete")}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="account-card flex flex-col items-center justify-center gap-5 !py-20 !px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.12] text-primary">
            <MdAccountBalance size={32} />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="font-semibold text-lg">{t("noPaymentMethods")}</h3>
            <p className="text-sm text-white/50 max-w-xs">{t("noPaymentMethodsDesc")}</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-3 bg-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            <Add />
            {t("addPaymentMethod")}
          </button>
        </div>
      )}

      {/* Add Payment Method Modal */}
      <Modal
        opened={modalOpen}
        onClose={handleClose}
        title={<span className="font-bold text-lg">{step === 1 ? t("addPaymentMethod") : t("bankDetails")}</span>}
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
        size="md"
        centered
      >
        {step === 1 ? (
          <div className="flex flex-col gap-5 py-2">
            <p className="text-sm text-white/60">{t("selectPaymentType")}</p>
            {/* Bank Transfer — selectable */}
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-4 p-5 rounded-xl border-2 border-primary bg-primary/10 hover:bg-primary/15 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <MdAccountBalance size={24} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{t("bankTransfer")}</span>
                <span className="text-xs text-white/50">{t("bankTransferDesc")}</span>
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
                    <span className="px-2 py-0.5 bg-white/10 text-white/40 text-2xs font-bold rounded-full">{t("comingSoon")}</span>
                  </div>
                  <span className="text-xs text-white/40">{t("notYetAvailable")}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-2">
            <div className="flex flex-col gap-4">
              {/* Bank Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">{t("bankName")} <span className="text-error-1">*</span></label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => { setBankName(e.target.value); setFormErrors((p) => ({ ...p, bankName: "" })); }}
                  placeholder={t("bankNamePlaceholder")}
                  className={clsx("w-full px-4 py-3 rounded-xl bg-gray-1 border text-sm text-white outline-none transition-all", formErrors.bankName ? "border-error-1" : "border-gray-9/40 focus:border-primary")}
                />
                {formErrors.bankName && <span className="text-xs text-error-1">{formErrors.bankName}</span>}
              </div>

              {/* Account Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">{t("accountNumber")} <span className="text-error-1">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setAccountNumber(val);
                    setFormErrors((p) => ({ ...p, accountNumber: "" }));
                  }}
                  placeholder={t("accountNumberPlaceholder")}
                  maxLength={10}
                  className={clsx("w-full px-4 py-3 rounded-xl bg-gray-1 border text-sm text-white outline-none transition-all font-mono tracking-widest", formErrors.accountNumber ? "border-error-1" : "border-gray-9/40 focus:border-primary")}
                />
                {formErrors.accountNumber && <span className="text-xs text-error-1">{formErrors.accountNumber}</span>}
              </div>

              {/* Account Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">{t("accountName")} <span className="text-error-1">*</span></label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => { setAccountName(e.target.value); setFormErrors((p) => ({ ...p, accountName: "" })); }}
                  placeholder={t("accountNamePlaceholder")}
                  className={clsx("w-full px-4 py-3 rounded-xl bg-gray-1 border text-sm text-white outline-none transition-all", formErrors.accountName ? "border-error-1" : "border-gray-9/40 focus:border-primary")}
                />
                {formErrors.accountName && <span className="text-xs text-error-1">{formErrors.accountName}</span>}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-white/20 rounded-xl text-sm font-medium text-white/70 hover:bg-white/[0.04] transition-all">
                {t("back")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={addLoading}
                className="flex-1 py-3 bg-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addLoading && <Loader size="xs" color="white" />}
                {t("addMethod")}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => { closeDeleteModal(); setDeleteConfirmId(null); }}
        title={<span className="font-bold text-lg">{t("deletePaymentMethod")}</span>}
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
        size="sm"
        centered
      >
        <div className="flex flex-col gap-6 py-2">
          <p className="text-sm text-white/70">
            {t("deletePaymentMethodQuestion")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { closeDeleteModal(); setDeleteConfirmId(null); }}
              className="flex-1 py-3 border border-white/20 rounded-xl text-sm font-medium text-white/70 hover:bg-white/[0.04] transition-all"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() => { if (deleteConfirmId) deleteMethod(deleteConfirmId); }}
              disabled={deleteLoading}
              className="flex-1 py-3 bg-error-1 rounded-xl text-sm font-semibold hover:bg-error-1/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleteLoading && <Loader size="xs" color="white" />}
              {t("delete")}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

export default function PaymentMethodsPage() {
  return (
    <PageSuspense fallback={<AccountPaymentMethodsSkeleton />}>
      <PaymentMethodsPageInner />
    </PageSuspense>
  );
}
