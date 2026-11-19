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
  productIds: string[];
  coverageIds: string[];
  groups: ApiKeyPermissionGroup[];
};

const PRODUCT_PERMISSION_SET = new Set(["spot", "futures", "margin", "p2p", "funding"]);
const ACTION_COVERAGE_SET = new Set([
  "trading",
  "deposit",
  "withdrawals",
  "conversion",
  "transfers",
  "internal_transfers",
  "external_transfers",
]);

const PERMISSION_META: Record<string, Omit<ApiKeyPermissionMeta, "id">> = {
  spot: {
    label: "Spot",
    shortLabel: "Spot",
    description: "Permit actions on your Spot account and orders.",
    group: "trading",
    icon: MdOutlineShowChart,
    tone: "primary",
    sensitive: false,
  },
  futures: {
    label: "Futures",
    shortLabel: "Futures",
    description: "Permit actions on your Futures account and positions.",
    group: "trading",
    icon: MdOutlineTrendingUp,
    tone: "primary",
    sensitive: false,
  },
  margin: {
    label: "Margin",
    shortLabel: "Margin",
    description: "Permit actions on your Margin account and borrowings.",
    group: "trading",
    icon: MdOutlineAccountBalanceWallet,
    tone: "blue",
    sensitive: false,
  },
  p2p: {
    label: "P2P",
    shortLabel: "P2P",
    description: "Permit actions on peer-to-peer orders.",
    group: "trading",
    icon: MdOutlinePeopleOutline,
    tone: "blue",
    sensitive: false,
  },
  funding: {
    label: "Funding",
    shortLabel: "Funding",
    description: "Permit actions on your Funding wallet.",
    group: "trading",
    icon: MdOutlineAccountBalanceWallet,
    tone: "blue",
    sensitive: false,
  },
  trading: {
    label: "Trading",
    shortLabel: "Trading",
    description: "Place, modify, and cancel orders on permitted products.",
    group: "accounts",
    icon: MdOutlineShowChart,
    tone: "primary",
    sensitive: false,
  },
  conversion: {
    label: "Conversion",
    shortLabel: "Convert",
    description: "Convert between supported assets.",
    group: "accounts",
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
  transfers: {
    label: "Transfers",
    shortLabel: "Transfers",
    description: "Move funds internally or to external addresses.",
    group: "accounts",
    icon: MdOutlineSwapVert,
    tone: "blue",
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
    title: "Account & Product Permissions",
    description: "Select which accounts/products this key can access (e.g. Spot, Futures, Margin).",
  },
  accounts: {
    title: "Action Coverage",
    description: "Select which operations this key can perform on the permitted accounts.",
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
  const coverageObj = isRecord(payload.coverage) ? payload.coverage : {};
  const coverageArray = readStringList(payload.coverage).filter((c) => c !== "all");
  const rawPerms = readStringList(payload.permissions).filter((p) => p !== "all");

  const groupedIds: Record<ApiKeyPermissionGroupKey, string[]> = {
    trading: isRecord(payload.coverage) ? readStringList(coverageObj.trading) : [],
    accounts: isRecord(payload.coverage)
      ? readStringList(coverageObj.accounts)
      : coverageArray,
  };

  const ordered: string[] = [];
  const seen = new Set<string>();
  const add = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  };

  rawPerms.forEach(add);
  GROUP_ORDER.forEach((key) => groupedIds[key].forEach(add));

  ordered.forEach((id) => {
    const group = getApiKeyPermissionMeta(id).group;
    if (!groupedIds[group].includes(id)) groupedIds[group].push(id);
  });

  const productIds = ordered.filter((id) => PRODUCT_PERMISSION_SET.has(id) || rawPerms.includes(id));
  const coverageIds = ordered.filter((id) => ACTION_COVERAGE_SET.has(id) || coverageArray.includes(id));

  const groups = GROUP_ORDER.map((key) => ({
    key,
    ...GROUP_META[key],
    permissionIds: groupedIds[key],
  })).filter((group) => group.permissionIds.length > 0);

  return { permissions: ordered, productIds, coverageIds, groups };
};
