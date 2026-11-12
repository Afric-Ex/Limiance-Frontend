"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { useApiKeyPermissions } from "@/src/hooks/use-api-key-permissions";
import { ApiKeyPermissionPicker } from "@/src/components/settings/api-key-permission-picker";
import { API_KEY_PERMISSION_TONE_CLASS, getApiKeyPermissionMeta } from "@/src/lib/api-key-permissions";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { Add } from "@/src/components/icons/add";
import { EmptyTable } from "@/src/components/icons/empty-table";
import { Delete as Trash } from "@/src/components/icons/trash";
import { Modal, Loader, Table, TableTr, TableTh, TableTd, Checkbox } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { CopyButton } from "@/src/components/shared/copy-button";
import {
  MdVisibility,
  MdVisibilityOff,
  MdClose,
  MdOutlineKey,
  MdOutlineSecurity,
} from "react-icons/md";
import clsx from "clsx";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountApiKeysSkeleton } from "@/src/components/skeletons/account";
import { AccountPageHeader } from "@/src/components/settings/account-page-header";
import { MdVpnKey } from "react-icons/md";
import { useTranslations } from "next-intl";

const unwrapPayload = (value: any): any => {
  let payload = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || !("data" in payload)) {
      break;
    }
    payload = payload.data;
  }
  return payload;
};

const normalizeApiKeys = (response: any): any[] => {
  const candidates = [
    response?.data?.data,
    response?.data?.api_keys,
    response?.data?.apiKeys,
    response?.data,
    response?.api_keys,
    response?.apiKeys,
    response,
  ];
  const records = candidates.find(Array.isArray);
  if (!records) return [];

  return records.map((record: any) => ({
    ...record,
    id: record.id ?? record.keyId ?? record.key_id ?? record._id,
    apiKey: record.apiKey ?? record.api_key ?? record.key,
    createdAt: record.createdAt ?? record.created_at,
    lastUsed: record.lastUsed ?? record.last_used,
    permissions: Array.isArray(record.permissions) ? record.permissions : [],
  }));
};

function ApiKeysPageInner() {
  const t = useTranslations("Security");
  const queryClient = useQueryClient();

  // Queries
  const { data: apiKeys = [], isLoading, isError, refetch } = useQuery({
    queryKey: userKeys.apiKeys,
    queryFn: () => userService.listApiKeys(),
    select: normalizeApiKeys,
  });

  const {
    data: permissionData,
    isLoading: permissionsLoading,
    isError: permissionsError,
    refetch: refetchPermissions,
  } = useApiKeyPermissions();

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
    mutationFn: async () => {
      const response = await userService.createApiKey({
        label: label.trim(),
        permissions: selectedPerms,
      });
      const result = response as typeof response & {
        success?: boolean;
        statusCode?: number;
        error?: string;
      };
      const statusCode = Number(result.statusCode);
      if (result.success === false || (Number.isFinite(statusCode) && statusCode >= 400)) {
        const error = new Error(
          result.message || result.error || t("apiKeyCreateFailed")
        ) as Error & { response: { data: typeof response; status: number } };
        error.response = {
          data: response,
          status: Number.isFinite(statusCode) && statusCode >= 400 ? statusCode : 500,
        };
        throw error;
      }
      return response;
    },
    onSuccess: (res: any) => {
      const data = unwrapPayload(res);
      setNewKey({
        apiKey: data?.apiKey ?? data?.api_key ?? data?.key ?? data?.fullKey ?? "—",
        secretKey: data?.secretKey ?? data?.secret_key ?? data?.secret ?? "—",
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
      successNotification(t("apiKeyDeleted"));
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: userKeys.apiKeys });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const handleCreate = () => {
    let valid = true;
    if (!label.trim()) { setLabelError(t("labelRequired")); valid = false; } else setLabelError("");
    if (permissionsLoading || permissionsError || !permissionData?.permissions.length) {
      valid = false;
    }
    if (selectedPerms.length === 0) { setPermsError(t("selectPermission")); valid = false; } else setPermsError("");
    if (valid) createKey();
  };

  const togglePerm = (id: string) => {
    setSelectedPerms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
    setPermsError("");
  };

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 pb-8 page-enter max-[1150px]:pb-[100px]">
      <AccountPageHeader
        title={t("apiAccessTitle")}
        description={t("apiAccessDescription")}
        icon={<MdVpnKey size={22} />}
        eyebrow={t("developerAccess")}
        action={
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(77,119,240,0.2)] transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <Add />
            {t("createApiKey")}
          </button>
        }
      />

      {/* Info Banner */}
      {!bannerDismissed && (
        <div className="flex items-start justify-between gap-4 p-4 bg-warning-1/10 border border-warning-1/30 rounded-xl">
          <p className="text-sm text-warning-1">
            <strong>{t("securityNotice")}</strong> {t("apiKeySecurityNotice")}
          </p>
          <button onClick={dismissBanner} className="text-warning-1/60 hover:text-warning-1 transition-colors shrink-0 mt-0.5">
            <MdClose size={18} />
          </button>
        </div>
      )}

      {/* Keys Table */}
      <div className="account-card !overflow-hidden !p-0">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader color="blue" /></div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-sm text-white/60">{t("apiKeysLoadError")}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.05]"
            >
              {t("retry")}
            </button>
          </div>
        ) : apiKeys?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table classNames={{ th: "!text-white/50 !text-xs !font-semibold !py-4 !px-5 !bg-black/20", td: "!py-4 !px-5 !border-b !border-white/[0.04]" }}>
              <TableTr>
                <TableTh>{t("label")}</TableTh>
                <TableTh>{t("apiKey")}</TableTh>
                <TableTh>{t("permissions")}</TableTh>
                <TableTh>{t("created")}</TableTh>
                <TableTh>{t("lastUsed")}</TableTh>
                <TableTh>{t("action")}</TableTh>
              </TableTr>
              {apiKeys.map((k: any, index: number) => (
                <TableTr key={k.id ?? `${k.apiKey ?? "api-key"}-${index}`} className="hover:bg-white/[0.02] transition-colors">
                  <TableTd><span className="font-medium text-sm">{k.label}</span></TableTd>
                  <TableTd>
                    <span className="font-mono text-xs text-white/60">
                      {(k.apiKey ?? k.key ?? "").slice(0, 8)}••••••••
                    </span>
                  </TableTd>
                  <TableTd>
                    <div className="flex gap-1.5 flex-wrap">
                      {(k.permissions ?? []).map((p: string) => {
                        const meta = getApiKeyPermissionMeta(p);
                        return (
                          <span
                            key={p}
                            title={meta.description}
                            className={clsx("px-2 py-0.5 text-micro font-semibold rounded-full", API_KEY_PERMISSION_TONE_CLASS[meta.tone])}
                          >
                            {meta.shortLabel}
                          </span>
                        );
                      })}
                    </div>
                  </TableTd>
                  <TableTd><span className="text-xs text-white/50">{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "—"}</span></TableTd>
                  <TableTd><span className="text-xs text-white/50">{k.lastUsed ? new Date(k.lastUsed).toLocaleString() : t("never")}</span></TableTd>
                  <TableTd>
                    {deleteConfirmId === k.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60 whitespace-nowrap">{t("sure")}</span>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-white/50 hover:text-white px-2 py-1 rounded border border-white/20 hover:border-white/40 transition-all">{t("cancel")}</button>
                        <button onClick={() => deleteKey(k.id)} disabled={deleteLoading || !k.id} className="text-xs text-error-1 px-2 py-1 rounded border border-error-1/40 hover:bg-error-1/10 transition-all flex items-center gap-1">
                          {deleteLoading && <Loader size={10} />}
                          {t("confirm")}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(k.id)} disabled={!k.id} aria-label={`${t("delete")} ${k.label ?? t("apiKey")}`} className="p-2 text-white/40 hover:text-error-1 transition-colors rounded-lg hover:bg-error-1/10 disabled:cursor-not-allowed disabled:opacity-30">
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
              <h3 className="font-semibold text-lg">{t("noApiKeys")}</h3>
              <p className="text-sm text-white/50 max-w-xs">{t("noApiKeysDesc")}</p>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-3 bg-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all">
              <Add />
              {t("createApiKey")}
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        opened={createOpen}
        onClose={closeCreate}
        title={
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.12] text-primary">
              <MdOutlineKey size={21} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                {t("developerAccess")}
              </p>
              <h2 className="mt-0.5 text-base font-semibold leading-tight text-white sm:text-lg">
                {t("createApiKey")}
              </h2>
            </div>
          </div>
        }
        overlayProps={{ backgroundOpacity: 0.72, blur: 4 }}
        classNames={{
          content:
            "!flex !flex-col !overflow-hidden !rounded-2xl !border !border-white/[0.08] !bg-[#181a20] !text-white shadow-2xl max-[728px]:!m-0 max-[728px]:!h-[100dvh] max-[728px]:!max-h-[100dvh] max-[728px]:!rounded-none",
          header:
            "!shrink-0 !border-b !border-white/[0.07] !bg-[#181a20] !px-5 !py-4 sm:!px-6 max-[728px]:!pt-[calc(1rem+env(safe-area-inset-top,0px))]",
          title: "!w-full",
          close: "!text-white/50 hover:!bg-white/[0.06] hover:!text-white",
          body: "!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !p-0",
        }}
        size="md"
        centered
      >
        <div className="flex max-h-[min(76vh,680px)] flex-col max-[728px]:max-h-none max-[728px]:min-h-0 max-[728px]:flex-1">
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 sm:gap-6 sm:p-6">
            <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/[0.06] p-3.5">
              <MdOutlineSecurity className="mt-0.5 shrink-0 text-primary" size={18} />
              <p className="text-xs leading-5 text-white/55">
                {t("apiKeyPermissionsHint")}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <label htmlFor="api-key-label" className="text-sm font-semibold text-white/85">
                    {t("keyLabel")} <span className="text-error-1">*</span>
                  </label>
                  <p className="mt-1 text-xs text-white/40">
                    {t("keyLabelHint")}
                  </p>
                </div>
                <span className={clsx("text-xs tabular-nums", label.length >= 45 ? "text-warning-1" : "text-white/35")}>
                  {label.length}/50
                </span>
              </div>
              <input
                id="api-key-label"
                type="text"
                value={label}
                onChange={(event) => {
                  setLabel(event.target.value.slice(0, 50));
                  setLabelError("");
                }}
                placeholder={t("keyLabelPlaceholder")}
                aria-invalid={Boolean(labelError)}
                aria-describedby={labelError ? "api-key-label-error" : undefined}
                maxLength={50}
                className={clsx(
                  "min-h-12 w-full rounded-xl border bg-black/20 px-4 text-sm text-white outline-none transition-colors placeholder:text-white/25",
                  labelError
                    ? "border-error-1/70 focus:border-error-1"
                    : "border-white/[0.09] focus:border-primary/60"
                )}
              />
              {labelError && (
                <span id="api-key-label-error" className="text-xs text-error-1">
                  {labelError}
                </span>
              )}
            </div>

            <fieldset className="flex flex-col gap-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <legend className="text-sm font-semibold text-white/85">
                    {t("permissions")} <span className="text-error-1">*</span>
                  </legend>
                  <p className="mt-1 text-xs text-white/40">
                    {t("permissionsHint")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-white/50">
                  {t("selectedCount", { count: selectedPerms.length })}
                </span>
              </div>
              <ApiKeyPermissionPicker
                groups={permissionData?.groups ?? []}
                selected={selectedPerms}
                onToggle={togglePerm}
                isLoading={permissionsLoading}
                isError={permissionsError}
                onRetry={() => void refetchPermissions()}
              />
              {permsError && <span className="text-xs text-error-1">{permsError}</span>}
            </fieldset>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-white/[0.07] bg-black/[0.08] px-5 py-4 sm:px-6 max-[728px]:!pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              onClick={closeCreate}
              disabled={createLoading}
              className="min-h-11 rounded-xl border border-white/[0.09] bg-white/[0.025] text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={
                createLoading ||
                permissionsLoading ||
                permissionsError ||
                !permissionData?.permissions.length ||
                selectedPerms.length === 0 ||
                !label.trim()
              }
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(77,119,240,0.18)] transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createLoading ? <Loader size="xs" color="white" /> : <Add />}
              {createLoading ? t("creatingKey") : t("createApiKey")}
            </button>
          </div>
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
            <h3 className="text-xl font-bold">{t("apiKeyCreated")}</h3>
          </div>

          <div className="p-4 bg-error-1/10 border border-error-1/30 rounded-xl">
            <p className="text-sm text-error-1 font-medium text-center">
              {t("secretShownOnce")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 font-medium">{t("apiKey")}</label>
              <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10">
                <span className="font-mono text-sm text-white flex-1 break-all">{newKey?.apiKey}</span>
                <CopyButton text={newKey?.apiKey ?? ""} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 font-medium">{t("secretKey")}</label>
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
            <span className="text-sm text-white/70">{t("copiedStoredConfirm")}</span>
          </label>

          <button
            onClick={() => { closeReveal(); setNewKey(null); setSecretVisible(false); setConfirmedCopy(false); }}
            disabled={!confirmedCopy}
            className="w-full py-3 bg-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("done")}
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
