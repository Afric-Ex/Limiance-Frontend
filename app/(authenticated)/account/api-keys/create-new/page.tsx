"use client";

import { Add } from "@/src/components/icons/add";
import { InfoOrange } from "@/src/components/icons/info-orange";
import { InfoWhite } from "@/src/components/icons/info-white";
import { TextInput, RadioGroup, Radio, Textarea, Loader, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { userKeys, userService } from "@/src/services/user";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountCreateApiKeySkeleton } from "@/src/components/skeletons/account";
import { useApiKeyPermissions } from "@/src/hooks/use-api-key-permissions";
import { ApiKeyPermissionPicker } from "@/src/components/settings/api-key-permission-picker";
import { useTranslations } from "next-intl";

const inputStyles = {
  input: "!h-50px !bg-transparent !rounded",
  label: "!text-sm",
};

const ipSchema = z.string().ip();

const parseIpAllowlist = (value: string): string[] =>
  value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const findInvalidIp = (value: string): string[] =>
  parseIpAllowlist(value).filter((entry) => !ipSchema.safeParse(entry).success);

function CreateApiKeyInner() {
  const t = useTranslations("Security");
  const queryClient = useQueryClient();
  const router = useRouter();
  const [revealedKey, setRevealedKey] = useState<{ key: string; secret: string } | null>(null);
  const [revealOpen, { open: openReveal, close: closeReveal }] = useDisclosure(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const {
    data: permissionData,
    isLoading: permissionsLoading,
    isError: permissionsError,
    refetch: refetchPermissions,
  } = useApiKeyPermissions();

  const form = useForm({
    initialValues: {
      label: "",
      purpose: "purpose",
      ipAllowlist: "",
    },
    validate: {
      label: (value) => (value.trim() ? null : t("apiNameRequired")),
      ipAllowlist: (value) => {
        const invalid = findInvalidIp(value);
        return invalid.length > 0 ? t("invalidIpAddress", { addresses: invalid.join(", ") }) : null;
      },
    },
  });

  const { mutate: createKey, isPending } = useMutation({
    mutationFn: (): Promise<any> =>
      userService.createApiKey({
        label: form.values.label.trim(),
        permissions,
        ipAllowlist: parseIpAllowlist(form.values.ipAllowlist),
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: userKeys.apiKeys });
      // Response: { data: { key, secret, keyPrefix, label, coverage, ... } }
      const payload = res?.data?.data ?? res?.data ?? res;
      const key = payload?.key ?? payload?.apiKey ?? payload?.api_key ?? payload?.fullKey;
      const secret = payload?.secret ?? payload?.secretKey ?? payload?.secret_key;
      if (key) {
        setRevealedKey({ key, secret: secret ?? "" });
        openReveal();
      } else {
        successNotification(t("apiKeyCreated"));
        router.push("/account/api-keys");
      }
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreate = () => {
    const result = form.validate();
    if (result.hasErrors || permissionsLoading || permissionsError || !permissionData?.permissions.length || permissions.length === 0) return;
    createKey();
  };

  return (
    <main className="flex flex-col gap-5">
      {/* Reveal full key modal */}
      <Modal
        opened={revealOpen}
        onClose={() => { closeReveal(); router.push("/account/api-keys"); }}
        title={t("apiKeyCreated")}
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
      >
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-yellow-400">
            {t("copySecretNow")}
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-white/50 font-medium">{t("apiKey")}</span>
            <div className="bg-gray-1 rounded p-3 break-all text-sm font-mono text-primary">
              {revealedKey?.key}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-white/50 font-medium">{t("secretKey")}</span>
            <div className="bg-gray-1 rounded p-3 break-all text-sm font-mono text-primary">
              {revealedKey?.secret || "—"}
            </div>
          </div>
          <button
            onClick={() => {
              const text = [revealedKey?.key, revealedKey?.secret].filter(Boolean).join("\n");
              navigator.clipboard.writeText(text);
              successNotification(t("keyCopied"));
            }}
            className="w-full py-3 bg-primary rounded-lg text-sm font-semibold"
          >
            {t("copyKeyAndSecret")}
          </button>
          <button
            onClick={() => { closeReveal(); router.push("/account/api-keys"); }}
            className="w-full py-3 bg-transparent border border-white/30 rounded-lg text-sm"
          >
            {t("done")}
          </button>
        </div>
      </Modal>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{t("apiKeys")}</h2>
            <p className="text-xs text-gray-9">
              {t("apiKeysIntro")}
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={isPending || !form.values.label.trim() || permissionsLoading || permissionsError || !permissionData?.permissions.length || permissions.length === 0}
            className="flex font-medium py-4 px-18px rounded-3xl bg-primary items-center justify-center gap-6px disabled:opacity-50"
          >
            {isPending ? <Loader size="xs" color="white" /> : <Add />}
            {t("createApis")}
          </button>
        </div>
        <div className="account-card !p-5 flex flex-col gap-4">
          <div className="flex items-center gap-6px">
            <InfoWhite />
            <span className="font-semibold">{t("note")}</span>
          </div>
          <ol className="text-xs text-gray-9 list-decimal pl-4">
            <li>
              {t("noteItem1")}
            </li>
            <li>
              {t("noteItem2")}
            </li>
            <li>
              {t("noteItem3")}
            </li>
            <li>
              {t("noteItem4")}
            </li>
          </ol>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
        <div className="account-card !py-30px !px-5">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-30px">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("apiDrafts")}</span>
                <span className="flex rounded-xl items-center bg-orange-1/5 px-2 py-2px gap-6px">
                  <InfoOrange />
                  <span className="text-xs text-orange-1">{t("incomplete")}</span>
                </span>
              </div>
              <div className="py-4 px-2 border border-white/[0.06] rounded-lg flex flex-col gap-2">
                <span className="text-sm font-medium">{form.values.label || t("newApi")}</span>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-9/25 py-2px px-5px text-gray-9 text-xs">
                    {t("mainAccount")}
                  </span>
                  <span className="flex rounded-xl items-center bg-orange-1/5 px-2 py-2px gap-6px">
                    <InfoOrange />
                    <span className="text-xs text-orange-1">{t("incomplete")}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="py-3 text-center px-2 border border-white/[0.06] rounded-lg cursor-pointer">
              {t("addAnother")}
            </div>
            <button
              onClick={handleCreate}
              disabled={isPending || !form.values.label.trim() || permissionsLoading || permissionsError || !permissionData?.permissions.length || permissions.length === 0}
              className="bg-primary rounded-xl py-18px text-base font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending && <Loader size="xs" color="white" />}
              {t("submit")}
            </button>
          </div>
        </div>
        <div className="account-card !py-30px !px-5 flex flex-col gap-6">
          <TextInput
            classNames={inputStyles}
            label={t("apiName")}
            placeholder={t("enterApiName")}
            {...form.getInputProps("label")}
          />
          <TextInput
            classNames={inputStyles}
            label={t("account")}
            placeholder={t("enter")}
            value={t("mainAccount")}
            readOnly
          />
          <RadioGroup
            label={t("purpose")}
            {...form.getInputProps("purpose")}
          >
            <div className="flex items-center gap-6 mt-1">
              <Radio value="purpose" label={t("purpose")} />
              <Radio value="linking" label={t("linkingThirdPartyApp")} />
            </div>
          </RadioGroup>
          <Textarea
            classNames={inputStyles}
            label={t("ipAllowlist")}
            placeholder={t("enterIpAddress")}
            autosize
            minRows={5}
            maxRows={5}
            {...form.getInputProps("ipAllowlist")}
          />
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-sm font-semibold">{t("permissions")}</span>
              <p className="mt-1 text-xs text-white/45">{t("permissionsSelectHint")}</p>
              <p className="mt-1 text-xs text-white/50">{t("selectedCount", { count: permissions.length })}</p>
            </div>
            <ApiKeyPermissionPicker
              groups={permissionData?.groups ?? []}
              selected={permissions}
              onToggle={togglePermission}
              isLoading={permissionsLoading}
              isError={permissionsError}
              onRetry={() => void refetchPermissions()}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CreateApiKeyPage() {
  return (
    <PageSuspense fallback={<AccountCreateApiKeySkeleton />}>
      <CreateApiKeyInner />
    </PageSuspense>
  );
}
