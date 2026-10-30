"use client";

import { Add } from "@/src/components/icons/add";
import { InfoOrange } from "@/src/components/icons/info-orange";
import { InfoWhite } from "@/src/components/icons/info-white";
import { TextInput, RadioGroup, Radio, Textarea, Loader, Modal, Checkbox } from "@mantine/core";
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
  const queryClient = useQueryClient();
  const router = useRouter();
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealOpen, { open: openReveal, close: closeReveal }] = useDisclosure(false);
  const [permissions, setPermissions] = useState<string[]>(["read"]);

  const form = useForm({
    initialValues: {
      label: "",
      purpose: "purpose",
      ipAllowlist: "",
    },
    validate: {
      label: (value) => (value.trim() ? null : "API name is required"),
      ipAllowlist: (value) => {
        const invalid = findInvalidIp(value);
        return invalid.length > 0 ? `Invalid IP address: ${invalid.join(", ")}` : null;
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
      if (res.data?.fullKey) {
        setRevealedKey(res.data.fullKey);
        openReveal();
      } else {
        successNotification("API key created");
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
    if (result.hasErrors) return;
    createKey();
  };

  return (
    <main className="flex flex-col gap-5">
      {/* Reveal full key modal */}
      <Modal
        opened={revealOpen}
        onClose={() => { closeReveal(); router.push("/account/api-keys"); }}
        title="API Key Created"
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
      >
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-yellow-400">
            Copy this key now — it will never be shown again.
          </p>
          <div className="bg-gray-1 rounded p-3 break-all text-sm font-mono text-primary">
            {revealedKey}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(revealedKey ?? "");
              successNotification("Key copied to clipboard");
            }}
            className="w-full py-3 bg-primary rounded-lg text-sm font-semibold"
          >
            Copy Key
          </button>
          <button
            onClick={() => { closeReveal(); router.push("/account/api-keys"); }}
            className="w-full py-3 bg-transparent border border-white/30 rounded-lg text-sm"
          >
            Done
          </button>
        </div>
      </Modal>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">API Keys</h2>
            <p className="text-xs text-gray-9">
              Create APIs to suit your trading needs. For your security,
              don&apos;t share your APIs with anyone.
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={isPending || !form.values.label}
            className="flex font-medium py-4 px-18px rounded-3xl bg-primary items-center justify-center gap-6px disabled:opacity-50"
          >
            {isPending ? <Loader size="xs" color="white" /> : <Add />}
            Create APIs
          </button>
        </div>
        <div className="account-card !p-5 flex flex-col gap-4">
          <div className="flex items-center gap-6px">
            <InfoWhite />
            <span className="font-semibold">Note</span>
          </div>
          <ol className="text-xs text-gray-9 list-decimal pl-4">
            <li>
              Limiance offers a robust API that allows you to access market data,
              execute trades, transfer assets, and process withdrawals.
            </li>
            <li>
              When you generate a new API, you need to set a passphrase to
              access the API and obtain the secret key. Keep your passphrase
              secure, as losing it will necessitate creating a new API key.
            </li>
            <li>
              To enhance your account security, it is advisable to limit access
              to trusted IPs only.
            </li>
            <li>
              You will not be able to create an API Key if KYC is not completed.
            </li>
          </ol>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
        <div className="account-card !py-30px !px-5">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-30px">
              <div className="flex items-center justify-between">
                <span className="text-sm">API drafts</span>
                <span className="flex rounded-xl items-center bg-orange-1/5 px-2 py-2px gap-6px">
                  <InfoOrange />
                  <span className="text-xs text-orange-1">Incomplete</span>
                </span>
              </div>
              <div className="py-4 px-2 border border-white/[0.06] rounded-lg flex flex-col gap-2">
                <span className="text-sm font-medium">{form.values.label || "New API"}</span>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-9/25 py-2px px-5px text-gray-9 text-xs">
                    Main account
                  </span>
                  <span className="flex rounded-xl items-center bg-orange-1/5 px-2 py-2px gap-6px">
                    <InfoOrange />
                    <span className="text-xs text-orange-1">Incomplete</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="py-3 text-center px-2 border border-white/[0.06] rounded-lg cursor-pointer">
              Add another
            </div>
            <button
              onClick={handleCreate}
              disabled={isPending || !form.values.label}
              className="bg-primary rounded-xl py-18px text-base font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending && <Loader size="xs" color="white" />}
              Submit
            </button>
          </div>
        </div>
        <div className="account-card !py-30px !px-5 flex flex-col gap-6">
          <TextInput
            classNames={inputStyles}
            label="API name"
            placeholder="Enter API name"
            {...form.getInputProps("label")}
          />
          <TextInput
            classNames={inputStyles}
            label="Account"
            placeholder="Enter"
            value="Main account"
            readOnly
          />
          <RadioGroup
            label="Purpose"
            {...form.getInputProps("purpose")}
          >
            <div className="flex items-center gap-6 mt-1">
              <Radio value="purpose" label="Purpose" />
              <Radio value="linking" label="Linking third-party app" />
            </div>
          </RadioGroup>
          <Textarea
            classNames={inputStyles}
            label="IP address allowlist (optional)"
            placeholder="Enter IP address"
            autosize
            minRows={5}
            maxRows={5}
            {...form.getInputProps("ipAllowlist")}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm">Permissions</span>
            <div className="flex items-center gap-4">
              {["read", "trade", "withdraw"].map((perm) => (
                <Checkbox
                  key={perm}
                  label={perm.charAt(0).toUpperCase() + perm.slice(1)}
                  checked={permissions.includes(perm)}
                  onChange={() => togglePermission(perm)}
                  classNames={{ input: "!border-gray-31 !bg-transparent" }}
                />
              ))}
            </div>
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
