import type { IconType } from "react-icons";
import {
  MdOutlineAccountBalanceWallet,
  MdOutlineCallMade,
  MdOutlineCallReceived,
  MdOutlineCurrencyExchange,
  MdOutlineKey,
  MdOutlineLock,
  MdOutlinePeopleOutline,
  MdOutlineShowChart,
  MdOutlineSwapVert,
  MdOutlineTrendingUp,
} from "react-icons/md";
import { unwrapObject } from "@/src/lib/api-response";

export type ApiKeyPermissionGroupKey = "trading" | "accounts";

export type ApiKeyPermissionTone = "primary" | "blue" | "warning";

export type ApiKeyPermissionMeta = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  group: ApiKeyPermissionGroupKey;
  icon: IconType;
  tone: ApiKeyPermissionTone;
  sensitive: boolean;
};

export type ApiKeyPermissionGroup = {
  key: ApiKeyPermissionGroupKey;
  title: string;
  description: string;
  permissionIds: string[];
};

export type NormalizedApiKeyPermissions = {
  permissions: string[];
  groups: ApiKeyPermissionGroup[];
};

const PERMISSION_META: Record<string, Omit<ApiKeyPermissionMeta, "id">> = {
  spot: {
    label: "Spot trading",
    shortLabel: "Spot",
    description: "Place and manage spot market orders.",
    group: "trading",
    icon: MdOutlineShowChart,
    tone: "primary",
    sensitive: false,
  },
  futures: {
    label: "Futures trading",
    shortLabel: "Futures",
    description: "Open, manage and close futures positions.",
    group: "trading",
    icon: MdOutlineTrendingUp,
    tone: "primary",
    sensitive: false,
  },
  margin: {
    label: "Margin trading",
    shortLabel: "Margin",
    description: "Borrow funds and trade with margin.",
    group: "trading",
    icon: MdOutlineAccountBalanceWallet,
    tone: "blue",
    sensitive: false,
  },
  p2p: {
    label: "P2P trading",
    shortLabel: "P2P",
    description: "Create and manage peer-to-peer orders.",
    group: "trading",
    icon: MdOutlinePeopleOutline,
    tone: "blue",
    sensitive: false,
  },
  conversion: {
    label: "Conversion",
    shortLabel: "Convert",
    description: "Convert between supported assets.",
    group: "trading",
    icon: MdOutlineCurrencyExchange,
    tone: "blue",
    sensitive: false,
  },
  deposit: {
    label: "Deposits",
    shortLabel: "Deposit",
    description: "Generate deposit addresses and view deposits.",
    group: "accounts",
    icon: MdOutlineCallReceived,
    tone: "blue",
    sensitive: false,
  },
  withdrawals: {
    label: "Withdrawals",
    shortLabel: "Withdraw",
    description: "Request withdrawals from your account.",
    group: "accounts",
    icon: MdOutlineLock,
    tone: "warning",
    sensitive: true,
  },
  internal_transfers: {
    label: "Internal transfers",
    shortLabel: "Internal",
    description: "Move funds between your own accounts.",
    group: "accounts",
    icon: MdOutlineSwapVert,
    tone: "blue",
    sensitive: false,
  },
  external_transfers: {
    label: "External transfers",
    shortLabel: "External",
    description: "Send funds to external addresses.",
    group: "accounts",
    icon: MdOutlineCallMade,
    tone: "warning",
    sensitive: true,
  },
};

const GROUP_META: Record<
  ApiKeyPermissionGroupKey,
  { title: string; description: string }
> = {
  trading: {
    title: "Trading permissions",
    description: "Place orders, manage positions and convert assets.",
  },
  accounts: {
    title: "Account permissions",
    description: "Deposit, withdraw and move funds between accounts.",
  },
};

const GROUP_ORDER: ApiKeyPermissionGroupKey[] = ["trading", "accounts"];

export const API_KEY_PERMISSION_TONE_CLASS: Record<ApiKeyPermissionTone, string> = {
  primary: "bg-primary/20 text-primary border border-primary/30",
  blue: "bg-blue-2/20 text-blue-2 border border-blue-2/30",
  warning: "bg-warning-1/20 text-warning-1 border border-warning-1/30",
};

const humanizePermissionId = (id: string): string =>
  id
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const getApiKeyPermissionMeta = (id: string): ApiKeyPermissionMeta => {
  const known = PERMISSION_META[id];
  if (known) return { id, ...known };

  const label = humanizePermissionId(id) || id;
  return {
    id,
    label,
    shortLabel: label,
    description: "Custom permission provided by Limiance.",
    group: "trading",
    icon: MdOutlineKey,
    tone: "blue",
    sensitive: /withdraw|external/i.test(id),
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const readStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    : [];

export const normalizeApiKeyPermissions = (
  response: unknown
): NormalizedApiKeyPermissions => {
  const payload = unwrapObject<Record<string, unknown>>(response) ?? {};
  const coverage = isRecord(payload.coverage) ? payload.coverage : {};

  const groupedIds: Record<ApiKeyPermissionGroupKey, string[]> = {
    trading: readStringList(coverage.trading),
    accounts: readStringList(coverage.accounts),
  };

  const ordered: string[] = [];
  const seen = new Set<string>();
  const add = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  };

  readStringList(payload.permissions).forEach(add);
  GROUP_ORDER.forEach((key) => groupedIds[key].forEach(add));

  ordered.forEach((id) => {
    const group = getApiKeyPermissionMeta(id).group;
    if (!groupedIds[group].includes(id)) groupedIds[group].push(id);
  });

  const groups = GROUP_ORDER.map((key) => ({
    key,
    ...GROUP_META[key],
    permissionIds: groupedIds[key],
  })).filter((group) => group.permissionIds.length > 0);

  return { permissions: ordered, groups };
};
