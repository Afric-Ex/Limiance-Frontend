"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { Add } from "@/src/components/icons/add";
import { EmptyTable } from "@/src/components/icons/empty-table";
import { Delete as Trash } from "@/src/components/icons/trash";
import { Modal, Loader, Checkbox, Table, TableTr, TableTh, TableTd } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { CopyButton } from "@/src/components/shared/copy-button";
import { MdVisibility, MdVisibilityOff, MdClose } from "react-icons/md";
import clsx from "clsx";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountApiKeysSkeleton } from "@/src/components/skeletons/account";

const PERMISSIONS = [
  { id: "read",     label: "Read",     desc: "View balances and orders" },
  { id: "trade",    label: "Trade",    desc: "Place and cancel orders" },
  { id: "withdraw", label: "Withdraw", desc: "Initiate withdrawals" },
];

const permColor: Record<string, string> = {
  read:     "bg-blue-2/20 text-blue-2 border border-blue-2/30",
  trade:    "bg-primary/20 text-primary border border-primary/30",
  withdraw: "bg-warning-1/20 text-warning-1 border border-warning-1/30",
};

function ApiKeysPageInner() {
  const queryClient = useQueryClient();

  // Queries
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: userKeys.apiKeys,
    queryFn: () => userService.listApiKeys(),
    select: (res: any) => res.data ?? [],
  });

  // Create key state
  const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [label, setLabel] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [labelError, setLabelError] = useState("");
  const [permsError, setPermsError] = useState("");

  // Reveal state
  const [revealOpen, { open: openReveal, close: closeReveal }] = useDisclosure(false);
  const [newKey, setNewKey] = useState<{ apiKey: string; secretKey: string; label: string } | null>(null);
  const [secretVisible, setSecretVisible] = useState(false);
  const [confirmedCopy, setConfirmedCopy] = useState(false);

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Banner dismissed state
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("api-banner-dismissed") === "1";
    return false;
  });

  const dismissBanner = () => {
    localStorage.setItem("api-banner-dismissed", "1");
    setBannerDismissed(true);
  };

  // Mutations
  const { mutate: createKey, isPending: createLoading } = useMutation({
    mutationFn: () => userService.createApiKey({ label, permissions: selectedPerms }),
    onSuccess: (res: any) => {
      const data = res.data ?? res;
      setNewKey({
        apiKey: data.apiKey ?? data.key ?? data.api_key ?? "—",
        secretKey: data.secretKey ?? data.secret ?? data.secret_key ?? "—",
        label,
      });
      setLabel(""); setSelectedPerms([]); setConfirmedCopy(false); setSecretVisible(false);
      closeCreate();
      openReveal();
      queryClient.invalidateQueries({ queryKey: userKeys.apiKeys });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const { mutate: deleteKey, isPending: deleteLoading } = useMutation({
    mutationFn: (keyId: string) => userService.deleteApiKey(keyId),
    onSuccess: () => {
      successNotification("API key deleted.");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: userKeys.apiKeys });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const handleCreate = () => {
    let valid = true;
    if (!label.trim()) { setLabelError("Label is required"); valid = false; } else setLabelError("");
    if (selectedPerms.length === 0) { setPermsError("Select at least one permission"); valid = false; } else setPermsError("");
    if (valid) createKey();
  };

  const togglePerm = (id: string) => {
    setSelectedPerms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
    setPermsError("");
  };

  return (
    <main className="flex flex-col gap-8 max-[1150px]:gap-4 max-w-5xl max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter">
      {/* Header */}
      <div className="flex flex-col min-[1150px]:flex-row min-[1150px]:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">API Management</h1>
          <p className="text-sm text-white/50">Create and manage API keys for programmatic access.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 bg-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] shrink-0"
        >
          <Add />
          Create API Key
        </button>
      </div>

      {/* Info Banner */}
      {!bannerDismissed && (
        <div className="flex items-start justify-between gap-4 p-4 bg-warning-1/10 border border-warning-1/30 rounded-xl">
          <p className="text-sm text-warning-1">
            <strong>Security Notice:</strong> API keys provide programmatic access to your account. Treat your secret key like a password — never share it. Keys are only shown once at creation.
          </p>
          <button onClick={dismissBanner} className="text-warning-1/60 hover:text-warning-1 transition-colors shrink-0 mt-0.5">
            <MdClose size={18} />
          </button>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-primary/10 border border-primary/25 rounded-20px overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader color="blue" /></div>
        ) : apiKeys?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table classNames={{ th: "!text-white/50 !text-xs !font-semibold !py-4 !px-5 !bg-black/20", td: "!py-4 !px-5 !border-b !border-white/[0.04]" }}>
              <TableTr>
                <TableTh>Label</TableTh>
                <TableTh>API Key</TableTh>
                <TableTh>Permissions</TableTh>
                <TableTh>Created</TableTh>
                <TableTh>Last Used</TableTh>
                <TableTh>Action</TableTh>
              </TableTr>
              {apiKeys.map((k: any) => (
                <TableTr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                  <TableTd><span className="font-medium text-sm">{k.label}</span></TableTd>
                  <TableTd>
                    <span className="font-mono text-xs text-white/60">
                      {(k.apiKey ?? k.key ?? "").slice(0, 8)}••••••••
                    </span>
                  </TableTd>
                  <TableTd>
                    <div className="flex gap-1.5 flex-wrap">
                      {(k.permissions ?? []).map((p: string) => (
                        <span key={p} className={clsx("px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize", permColor[p] ?? "bg-white/10 text-white/50")}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </TableTd>
                  <TableTd><span className="text-xs text-white/50">{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "—"}</span></TableTd>
                  <TableTd><span className="text-xs text-white/50">{k.lastUsed ? new Date(k.lastUsed).toLocaleString() : "Never"}</span></TableTd>
                  <TableTd>
                    {deleteConfirmId === k.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60 whitespace-nowrap">Sure?</span>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-white/50 hover:text-white px-2 py-1 rounded border border-white/20 hover:border-white/40 transition-all">Cancel</button>
                        <button onClick={() => deleteKey(k.id)} disabled={deleteLoading} className="text-xs text-error-1 px-2 py-1 rounded border border-error-1/40 hover:bg-error-1/10 transition-all flex items-center gap-1">
                          {deleteLoading && <Loader size={10} />}
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(k.id)} className="p-2 text-white/40 hover:text-error-1 transition-colors rounded-lg hover:bg-error-1/10">
                        <Trash />
                      </button>
                    )}
                  </TableTd>
                </TableTr>
              ))}
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-5 py-20 px-8">
            <EmptyTable />
            <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="font-semibold text-lg">No API keys yet</h3>
              <p className="text-sm text-white/50 max-w-xs">Create your first API key to connect trading bots or third-party applications.</p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-3 bg-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all">
              <Add />
              Create API Key
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        opened={createOpen}
        onClose={closeCreate}
        title={<span className="font-bold text-lg">Create API Key</span>}
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
        size="md"
        centered
      >
        <div className="flex flex-col gap-6 py-2">
          {/* Label */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/70">Label <span className="text-error-1">*</span></label>
            <input
              type="text"
              value={label}
              onChange={(e) => { setLabel(e.target.value.slice(0, 50)); setLabelError(""); }}
              placeholder="e.g. My Trading Bot"
              className={clsx("w-full px-4 py-3 rounded-xl bg-gray-1 border text-sm text-white outline-none transition-all", labelError ? "border-error-1" : "border-gray-9/40 focus:border-primary")}
            />
            <div className="flex justify-between items-center">
              {labelError && <span className="text-xs text-error-1">{labelError}</span>}
              <span className={clsx("text-xs ml-auto", label.length >= 45 ? "text-warning-1" : "text-white/30")}>{label.length}/50</span>
            </div>
          </div>

          {/* Permissions */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-white/70">Permissions <span className="text-error-1">*</span></label>
            <div className="flex flex-col gap-2">
              {PERMISSIONS.map((perm) => (
                <label key={perm.id} className={clsx("flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all", selectedPerms.includes(perm.id) ? "border-primary/60 bg-primary/10" : "border-white/[0.08] bg-black/20 hover:border-white/20")}>
                  <Checkbox
                    checked={selectedPerms.includes(perm.id)}
                    onChange={() => togglePerm(perm.id)}
                    color="blue"
                    size="sm"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold capitalize">{perm.label}</span>
                    <span className="text-xs text-white/50">{perm.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            {permsError && <span className="text-xs text-error-1">{permsError}</span>}
          </div>

          <button
            onClick={handleCreate}
            disabled={createLoading}
            className="w-full py-3 bg-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createLoading && <Loader size="xs" color="white" />}
            Create Key
          </button>
        </div>
      </Modal>

      {/* Secret Reveal Modal */}
      <Modal
        opened={revealOpen}
        onClose={() => {}} // force close via button only
        withCloseButton={false}
        title={null}
        classNames={{ content: "!bg-gray-7" }}
        size="md"
        centered
      >
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-success-6/20 flex items-center justify-center">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path stroke="#0ECB81" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7"/></svg>
            </div>
            <h3 className="text-xl font-bold">API Key Created</h3>
          </div>

          <div className="p-4 bg-error-1/10 border border-error-1/30 rounded-xl">
            <p className="text-sm text-error-1 font-medium text-center">
              Your secret key is shown only once. Copy it now and store it securely. You cannot retrieve it again.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 font-medium">API Key</label>
              <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10">
                <span className="font-mono text-sm text-white flex-1 break-all">{newKey?.apiKey}</span>
                <CopyButton text={newKey?.apiKey ?? ""} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 font-medium">Secret Key</label>
              <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10">
                <span className="font-mono text-sm text-white flex-1 break-all">
                  {secretVisible ? newKey?.secretKey : "••••••••••••••••••••••••••••••••"}
                </span>
                <button onClick={() => setSecretVisible(!secretVisible)} className="text-white/40 hover:text-white transition-colors shrink-0">
                  {secretVisible ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
                <CopyButton text={newKey?.secretKey ?? ""} />
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-white/[0.08] hover:border-white/20 transition-all">
            <Checkbox checked={confirmedCopy} onChange={(e) => setConfirmedCopy(e.currentTarget.checked)} color="blue" size="sm" className="mt-0.5" />
            <span className="text-sm text-white/70">I have copied and stored my API key securely</span>
          </label>

          <button
            onClick={() => { closeReveal(); setNewKey(null); setSecretVisible(false); setConfirmedCopy(false); }}
            disabled={!confirmedCopy}
            className="w-full py-3 bg-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      </Modal>
    </main>
  );
}

export default function ApiKeysPage() {
  return (
    <PageSuspense fallback={<AccountApiKeysSkeleton />}>
      <ApiKeysPageInner />
    </PageSuspense>
  );
}
