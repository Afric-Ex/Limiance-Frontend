"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { useUserStore } from "@/src/stores/user-store";
import { useState, useMemo, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Loader, TextInput, Button } from "@mantine/core";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { Authenticator } from "@/src/components/icons/authenticator";
import { OtpInput } from "@/src/components/settings/otp-input";
import { MdSmartphone, MdDesktopMac, MdTablet, MdMailOutline, MdRefresh } from "react-icons/md";
import { BiCheck } from "react-icons/bi";
import { CopyButton } from "@/src/components/shared/copy-button";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountSecuritySkeleton } from "@/src/components/skeletons/account";
import { AccountPageHeader } from "@/src/components/settings/account-page-header";
import { MdShield } from "react-icons/md";
import QRCode from "react-qr-code";

type TwoFASetupData = {
  secret: string;
  qrCodeUrl: string;
};

type SecurityRecord = Record<string, any>;

type DeviceKind = "mobile" | "tablet" | "desktop";

type SessionItem = {
  id: string;
  device: string;
  rawDevice: string;
  deviceKind: DeviceKind;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  canRevoke: boolean;
};

type LoginLogItem = {
  id: string;
  device: string;
  rawDevice: string;
  location: string;
  ip: string;
  createdAt: string;
  status: string;
};

const findDeepValue = (input: unknown, keys: string[], seen = new Set<unknown>()): unknown => {
  if (!input || typeof input !== "object" || seen.has(input)) return undefined;
  seen.add(input);

  const record = input as Record<string, unknown>;
  for (const key of keys) {
    if (typeof record[key] === "string" && record[key]) return record[key];
  }

  for (const value of Object.values(record)) {
    const match = findDeepValue(value, keys, seen);
    if (match) return match;
  }

  return undefined;
};

const normalizeTwoFASetup = (res: unknown): TwoFASetupData => {
  const secret = findDeepValue(res, ["secret", "base32", "totp_secret", "totpSecret"]);
  const qrCodeUrl = findDeepValue(res, [
    "qr_code_url",
    "qrCodeUrl",
    "qrCodeDataURL",
    "qrCodeDataUrl",
    "qr_code_data_url",
    "qr_url",
    "qrUrl",
    "qr",
    "qrCode",
    "otpauth_url",
    "otpauthUrl",
    "setupUrl",
  ]);

  return {
    secret: typeof secret === "string" ? secret : "",
    qrCodeUrl: typeof qrCodeUrl === "string" ? qrCodeUrl : "",
  };
};

const extractPayloadList = (res: any, ...nestedKeys: string[]): SecurityRecord[] => {
  const candidates = [
    res?.data,
    res?.data?.data,
    ...nestedKeys.flatMap((key) => [res?.data?.[key], res?.[key]]),
    res,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as SecurityRecord[];
  }

  return [];
};

const getStringField = (record: SecurityRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const getDateField = (record: SecurityRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = record?.[key];
    if (value == null) continue;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
};

const normalizeDateValue = (value: unknown): string => {
  if (value == null) return "";

  let date: Date | null = null;

  if (typeof value === "number" && Number.isFinite(value)) {
    // Session timestamps are epoch milliseconds, but accept seconds too.
    date = new Date(value < 1e12 ? value * 1000 : value);
  } else if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) {
        date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
      }
    }

    if (!date || Number.isNaN(date.getTime())) {
      date = new Date(trimmed);
    }

    if (Number.isNaN(date.getTime())) {
      const formattedMatch = trimmed.match(/^[A-Za-z]+\s(\d{2})\s([A-Za-z]+)\s(\d{4})\s(\d{2}:\d{2}:\d{2})(AM|PM)$/);
      if (formattedMatch) {
        const [, day, month, year, time, meridiem] = formattedMatch;
        date = new Date(`${day} ${month} ${year} ${time} ${meridiem}`);
      }
    }
  }

  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
};

const describeUserAgent = (ua: string): { label: string; kind: DeviceKind } => {
  const raw = ua.trim();
  if (!raw) return { label: "Unknown device", kind: "desktop" };

  const lower = raw.toLowerCase();

  if (lower.includes("apidog")) return { label: "Apidog (API client)", kind: "desktop" };
  if (lower.includes("postman")) return { label: "Postman (API client)", kind: "desktop" };
  if (lower.startsWith("curl/") || lower.includes(" curl/")) return { label: "curl (API client)", kind: "desktop" };
  if (lower.includes("python-requests") || lower.includes("axios")) return { label: "API client", kind: "desktop" };

  const isTablet =
    lower.includes("ipad") ||
    lower.includes("tablet") ||
    (lower.includes("android") && !lower.includes("mobile")) ||
    (lower.includes("macintosh") && lower.includes("mobile"));
  const isMobile =
    !isTablet &&
    (lower.includes("mobile") ||
      lower.includes("iphone") ||
      lower.includes("ipod") ||
      lower.includes("android") ||
      lower.includes("windows phone"));

  let platform = "";
  if (lower.includes("windows")) platform = "Windows";
  else if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ipod")) platform = "iOS";
  else if (lower.includes("android")) platform = "Android";
  else if (lower.includes("mac os x") || lower.includes("macintosh")) platform = "macOS";
  else if (lower.includes("cros")) platform = "ChromeOS";
  else if (lower.includes("linux")) platform = "Linux";

  let browser = "";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("opr/") || lower.includes("opera")) browser = "Opera";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("chrome") || lower.includes("crios")) browser = "Chrome";
  else if (lower.includes("safari")) browser = "Safari";

  const kind: DeviceKind = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
  const label = browser && platform ? `${browser} on ${platform}` : browser || platform || raw;

  return { label, kind };
};

const formatRelativeTime = (iso: string): string => {
  if (!iso) return "Unknown";
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown";

  const diff = Date.now() - timestamp;
  const abs = Math.abs(diff);
  const suffix = diff >= 0 ? "ago" : "from now";
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (abs < minute) return "Just now";
  if (abs < hour) return `${Math.round(abs / minute)} min ${suffix}`;
  if (abs < day) return `${Math.round(abs / hour)} hr ${suffix}`;
  if (abs < 7 * day) return `${Math.round(abs / day)} d ${suffix}`;
  return new Date(timestamp).toLocaleDateString();
};

function SecurityPageInner() {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const twoFAEnabled = user?.twoFaEnabled ?? false;
  const emailOtpEnabled = user?.emailOtpEnabled ?? false;
  const [mounted, setMounted] = useState(false);
  const [currentUserAgent, setCurrentUserAgent] = useState("");
  useEffect(() => {
    setMounted(true);
    setCurrentUserAgent(window.navigator.userAgent);
  }, []);

  // Modals state
  const [setupOpen, { open: openSetup, close: closeSetup }] = useDisclosure(false);
  const [disableOpen, { open: openDisable, close: closeDisable }] = useDisclosure(false);
  
  // 2FA Setup state
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [setupCode, setSetupCode] = useState("");
  const [setupError, setSetupError] = useState(false);
  
  // 2FA Disable state
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState(false);

  // Queries & Mutations
  const {
    data: qrData,
    isError: qrIsError,
    isLoading: qrLoading,
    refetch: refetchQr,
  } = useQuery({
    queryKey: userKeys.twoFASetup,
    queryFn: () => userService.enable2FA(),
    enabled: setupOpen && setupStep === 1 && !twoFAEnabled,
    select: normalizeTwoFASetup,
    staleTime: 0,
  });

  const qrSetupUri = qrData?.secret
    ? `otpauth://totp/Limiance:${user?.email || "User"}?secret=${qrData.secret}&issuer=Limiance`
    : "";
  const qrCodeUrl = qrData?.qrCodeUrl || "";
  const hasQrCode = Boolean(qrCodeUrl || qrSetupUri);

  const { mutate: verify2FA, isPending: verifyLoading } = useMutation({
    mutationFn: (code: string) => userService.verify2FA({ code }),
    onSuccess: () => {
      successNotification("Two-factor authentication enabled.");
      if (user) setUser({ ...user, twoFaEnabled: true });
      queryClient.invalidateQueries({ queryKey: userKeys.twoFASetup });
      closeSetup();
      setSetupStep(1);
      setSetupCode("");
    },
    onError: (e: any) => {
      errorMessageHandler(e);
      setSetupError(true);
      setSetupCode("");
      setTimeout(() => setSetupError(false), 600);
    },
  });

  const { mutate: disable2FA, isPending: disableLoading } = useMutation({
    mutationFn: (code: string) => userService.disable2FA({ code }),
    onSuccess: () => {
      successNotification("Two-factor authentication disabled.");
      if (user) setUser({ ...user, twoFaEnabled: false });
      closeDisable();
      setDisableCode("");
    },
    onError: (e: any) => {
      errorMessageHandler(e);
      setDisableError(true);
      setDisableCode("");
      setTimeout(() => setDisableError(false), 600);
    },
  });

  const { mutate: enableEmailOtp, isPending: enableEmailLoading } = useMutation({
    mutationFn: () => userService.enableEmailOtp(),
    onSuccess: () => {
      successNotification("Email OTP login enabled.");
      if (user) setUser({ ...user, emailOtpEnabled: true });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const { mutate: disableEmailOtp, isPending: disableEmailLoading } = useMutation({
    mutationFn: () => userService.disableEmailOtp(),
    onSuccess: () => {
      successNotification("Email OTP login disabled.");
      if (user) setUser({ ...user, emailOtpEnabled: false });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  // Password State
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  const passwordCriteria = useMemo(() => {
    return {
      length: newPw.length >= 8,
      upper: /[A-Z]/.test(newPw),
      lower: /[a-z]/.test(newPw),
      number: /[0-9]/.test(newPw),
      special: /[^A-Za-z0-9]/.test(newPw),
    };
  }, [newPw]);

  const strength = Object.values(passwordCriteria).filter(Boolean).length;
  const strengthLabels = ["Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const strengthColors = ["bg-error-1", "bg-error-1", "bg-yellow-500", "bg-success-6", "bg-success-6"];

  const { mutate: changePassword, isPending: changePwLoading } = useMutation({
    mutationFn: () => userService.changePassword({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw }),
    onSuccess: () => {
      successNotification("Password updated successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwError("");
    },
    onError: (e: any) => {
      if (e?.response?.status === 401 || e?.response?.data?.message?.toLowerCase().includes("incorrect")) {
        setPwError("Incorrect current password");
      } else {
        errorMessageHandler(e);
      }
    },
  });

  const handleChangePassword = () => {
    setPwError("");
    if (newPw !== confirmPw) return;
    if (strength < 5) return;
    changePassword();
  };

  // Sessions
  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    isFetching: sessionsFetching,
    isError: sessionsError,
    refetch: refetchSessions,
  } = useQuery<any, Error, SessionItem[]>({
    queryKey: userKeys.sessions,
    queryFn: () => userService.getActiveSessions(),
    select: (res: any) => {
      const rawSessions = extractPayloadList(
        res,
        "sessions",
        "active_sessions",
        "activeSessions"
      );

      return rawSessions.map((session: SecurityRecord) => {
        const id = getStringField(session, [
          "id",
          "_id",
          "sessionId",
          "session_id",
          "sessionKey",
          "session_key",
        ]);
        const isCurrent =
          session?.isCurrent === true || session?.is_current === true;
        const rawDevice = getStringField(session, ["device", "browser", "userAgent", "user_agent"]);
        const device = describeUserAgent(rawDevice);

        return {
          id,
          device: device.label,
          rawDevice,
          deviceKind: device.kind,
          ip: getStringField(session, ["ip", "IP"]),
          location: getStringField(session, ["location", "country", "city"]),
          lastActive: normalizeDateValue(
            getDateField(session, [
              "lastActive",
              "last_active",
              "createdAt",
              "created_at",
              "loginAt",
              "login_at",
            ])
          ),
          isCurrent,
          canRevoke:
            session?.canRevoke === false || session?.can_revoke === false
              ? false
              : !isCurrent && Boolean(id),
        };
      });
    },
  });

  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { mutate: revokeSession } = useMutation({
    mutationFn: (sessionId: string) => userService.revokeSession(sessionId),
    onMutate: (sessionId) => setRevokingId(sessionId),
    onSuccess: () => {
      successNotification("Session revoked successfully");
      queryClient.invalidateQueries({ queryKey: userKeys.sessions });
      setRevokeConfirmId(null);
    },
    onSettled: () => setRevokingId(null),
    onError: (e: any) => errorMessageHandler(e),
  });

  const activeSessions = useMemo(() => {
    const timestamp = (iso: string) => {
      const value = new Date(iso).getTime();
      return Number.isFinite(value) ? value : 0;
    };

    return sessions
      .map((session) => {
        const isCurrent =
          session.isCurrent ||
          (currentUserAgent !== "" && session.rawDevice === currentUserAgent);
        return {
          ...session,
          isCurrent,
          canRevoke: session.canRevoke && !isCurrent,
        };
      })
      .sort((a, b) => timestamp(b.lastActive) - timestamp(a.lastActive));
  }, [sessions, currentUserAgent]);

  // Logs
  const { data: logs = [], isLoading: logsLoading } = useQuery<any, Error, LoginLogItem[]>({
    queryKey: userKeys.loginLogs(),
    queryFn: () => userService.getLoginLogs({ page: 1, limit: 10 }),
    select: (res: any) => {
      const rawLogs = extractPayloadList(res, "user_login_log");

      return rawLogs.map((log: SecurityRecord, index: number) => {
        const rawDevice = getStringField(log, ["device", "browser", "userAgent", "user_agent"]);
        return {
          id: getStringField(log, ["id", "_id"]) || `log-${index}`,
          device: describeUserAgent(rawDevice).label,
          rawDevice,
          location: getStringField(log, ["location", "country", "city"]),
          ip: getStringField(log, ["ip", "IP"]),
          createdAt: normalizeDateValue(getDateField(log, ["createdAt", "created_at", "loginAt", "login_at"])),
          status: getStringField(log, ["status", "result"]) || "Success",
        };
      });
    },
  });

  if (!mounted) return <AccountSecuritySkeleton />;

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 pb-8 page-enter max-[1150px]:pb-[100px]">
      <AccountPageHeader
        title="Security & access"
        description="Protect your account with strong authentication and monitor where you’re signed in."
        icon={<MdShield size={23} />}
        eyebrow="Account protection"
      />

      {/* Card 1 — Two-Factor Authentication (2FA) */}
      <div className="account-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 max-[1150px]:gap-4">
        <div className="flex items-start gap-4">
          <div className="mt-1"><Authenticator /></div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-white/50">Protect your account with an authenticator app.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {twoFAEnabled ? (
            <>
              <span className="px-3 py-1 bg-success-6/15 text-success-6 text-xs font-semibold rounded-full border border-success-6/30">
                ENABLED
              </span>
              <Button
                onClick={openDisable}
                variant="outline"
                color="red"
                className="!border-error-1 !text-error-1 hover:!bg-error-1/10"
              >
                Disable 2FA
              </Button>
            </>
          ) : (
            <>
              <span className="px-3 py-1 bg-gray-9/15 text-gray-9 text-xs font-semibold rounded-full border border-gray-9/30">
                DISABLED
              </span>
              <Button
                onClick={openSetup}
                className="!bg-primary hover:!bg-primary/90"
              >
                Enable 2FA
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Card 1.5 — Email OTP Login */}
      <div className="account-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 max-[1150px]:gap-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex items-center justify-center w-[30px] h-[30px] rounded bg-white/5"><MdMailOutline size={20} className="text-white" /></div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Email OTP Login</h3>
            <p className="text-sm text-white/50">Require an email verification code when logging in from new devices.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {emailOtpEnabled ? (
            <>
              <span className="px-3 py-1 bg-success-6/15 text-success-6 text-xs font-semibold rounded-full border border-success-6/30">
                ENABLED
              </span>
              <Button
                onClick={() => disableEmailOtp()}
                loading={disableEmailLoading}
                variant="outline"
                color="red"
                className="!border-error-1 !text-error-1 hover:!bg-error-1/10"
              >
                Disable Email OTP
              </Button>
            </>
          ) : (
            <>
              <span className="px-3 py-1 bg-gray-9/15 text-gray-9 text-xs font-semibold rounded-full border border-gray-9/30">
                DISABLED
              </span>
              <Button
                onClick={() => enableEmailOtp()}
                loading={enableEmailLoading}
                className="!bg-primary hover:!bg-primary/90"
              >
                Enable Email OTP
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Card 2 — Change Password */}
      <div className="account-card flex flex-col gap-6 max-[1150px]:gap-4">
        <div>
          <h3 className="text-lg font-semibold">Change password</h3>
          <p className="mt-1 text-sm text-white/45">Use a unique password you don’t use on other sites.</p>
        </div>
        <div className="flex flex-col gap-5 max-w-md">
          <TextInput
            label="Current Password"
            type="password"
            value={currentPw}
            onChange={(e) => { setCurrentPw(e.target.value); setPwError(""); }}
            error={pwError}
            classNames={{ input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary", label: "!text-white/70 !mb-1.5 !text-sm" }}
          />
          <TextInput
            label="New Password"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            classNames={{ input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary", label: "!text-white/70 !mb-1.5 !text-sm" }}
          />
          
          {/* Password Strength Indicator */}
          {newPw && (
            <div className="flex flex-col gap-2 -mt-2 mb-2">
              <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div key={level} className={`flex-1 rounded-full transition-colors ${strength >= level ? strengthColors[Math.max(0, strength - 1)] : "bg-gray-7"}`} />
                ))}
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={strengthColors[Math.max(0, strength - 1)]?.replace("bg-", "text-")}>{strength > 0 ? strengthLabels[strength - 1] : ""}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className={`flex items-center gap-1.5 text-xs ${passwordCriteria.length ? "text-success-6" : "text-white/40"}`}><BiCheck size={16} /> ≥ 8 chars</div>
                <div className={`flex items-center gap-1.5 text-xs ${passwordCriteria.upper ? "text-success-6" : "text-white/40"}`}><BiCheck size={16} /> Uppercase</div>
                <div className={`flex items-center gap-1.5 text-xs ${passwordCriteria.lower ? "text-success-6" : "text-white/40"}`}><BiCheck size={16} /> Lowercase</div>
                <div className={`flex items-center gap-1.5 text-xs ${passwordCriteria.number ? "text-success-6" : "text-white/40"}`}><BiCheck size={16} /> Number</div>
                <div className={`flex items-center gap-1.5 text-xs ${passwordCriteria.special ? "text-success-6" : "text-white/40"}`}><BiCheck size={16} /> Special character</div>
              </div>
            </div>
          )}

          <TextInput
            label="Confirm New Password"
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            error={confirmPw && newPw !== confirmPw ? "Passwords do not match" : null}
            classNames={{ input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary", label: "!text-white/70 !mb-1.5 !text-sm", error: "!mt-1.5 !text-xs !text-error-1" }}
          />

          <Button
            onClick={handleChangePassword}
            disabled={changePwLoading || !currentPw || strength < 5 || newPw !== confirmPw}
            loading={changePwLoading}
            className="w-fit !mt-2 !bg-primary hover:!bg-primary/90"
          >
            Update Password
          </Button>
        </div>
      </div>

      {/* Card 3 — Active Sessions */}
      <div className="account-card flex flex-col gap-6 max-[1150px]:gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-semibold">Active Sessions</h3>
            {!sessionsLoading && !sessionsError && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-2xs font-semibold text-white/50">
                {activeSessions.length} {activeSessions.length === 1 ? "session" : "sessions"}
              </span>
            )}
          </div>
          <Button
            variant="subtle"
            size="xs"
            disabled={sessionsFetching}
            onClick={() => void refetchSessions()}
            className="!text-white/55 hover:!text-white"
          >
            <span className="inline-flex items-center gap-1.5">
              <MdRefresh size={14} className={sessionsFetching ? "animate-spin" : ""} />
              Refresh
            </span>
          </Button>
        </div>

        {sessionsLoading ? (
          <div className="flex justify-center py-6"><Loader color="blue" /></div>
        ) : sessionsError ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-white/55">Unable to load active sessions.</p>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => void refetchSessions()}
            >
              Retry
            </Button>
          </div>
        ) : activeSessions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {activeSessions.map((session, index) => (
              <div
                key={session.id || index}
                className={`flex flex-col gap-4 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  session.isCurrent
                    ? "border-success-6/25 bg-success-6/[0.04]"
                    : "border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    session.isCurrent ? "bg-success-6/10 text-success-6" : "bg-white/[0.05] text-white/50"
                  }`}>
                    {session.deviceKind === "mobile" ? (
                      <MdSmartphone size={20} />
                    ) : session.deviceKind === "tablet" ? (
                      <MdTablet size={20} />
                    ) : (
                      <MdDesktopMac size={20} />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-white/90" title={session.rawDevice || undefined}>
                        {session.device || "Unknown device"}
                      </span>
                      {session.isCurrent && (
                        <span className="shrink-0 rounded-full bg-success-6/20 px-2 py-0.5 text-2xs font-bold text-success-6">
                          CURRENT SESSION
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs text-white/40">
                      {session.location || "Unknown location"} • {session.ip || "Unknown IP"}
                    </span>
                    <span
                      className="text-xs text-white/40"
                      title={session.lastActive ? new Date(session.lastActive).toLocaleString() : undefined}
                    >
                      Last active: {session.lastActive ? formatRelativeTime(session.lastActive) : "Unknown"}
                    </span>
                  </div>
                </div>

                {!session.isCurrent && session.canRevoke && (
                  revokeConfirmId === session.id ? (
                    <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-warning-1/20 bg-warning-1/[0.06] px-3 py-2 sm:w-auto">
                      <span className="mr-auto text-xs text-warning-1">Revoke this session?</span>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="gray"
                        disabled={revokingId !== null}
                        onClick={() => setRevokeConfirmId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        loading={revokingId === session.id}
                        disabled={revokingId !== null && revokingId !== session.id}
                        onClick={() => revokeSession(session.id)}
                      >
                        Confirm
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      color="red"
                      size="sm"
                      onClick={() => setRevokeConfirmId(session.id)}
                      className="w-full !border-error-1 !text-error-1 hover:!bg-error-1/10 sm:w-auto"
                    >
                      Revoke
                    </Button>
                  )
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-8 text-center">
            <MdDesktopMac size={22} className="text-white/25" />
            <p className="text-sm text-white/45">No active sessions found</p>
            <p className="text-xs text-white/30">Sessions appear here when you sign in from another device.</p>
          </div>
        )}
      </div>

      {/* Card 4 — Login History */}
      <div className="account-card flex flex-col gap-6 max-[1150px]:gap-4">
        <h3 className="text-lg font-semibold">Login History</h3>
        {logsLoading ? (
          <div className="flex justify-center py-6"><Loader color="blue" /></div>
        ) : logs?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-3 pr-4 text-xs font-semibold text-white/50 whitespace-nowrap">Date / Time</th>
                  <th className="pb-3 pr-4 text-xs font-semibold text-white/50 whitespace-nowrap">IP Address</th>
                  <th className="pb-3 pr-4 text-xs font-semibold text-white/50 whitespace-nowrap">Location</th>
                  <th className="pb-3 pr-4 text-xs font-semibold text-white/50 whitespace-nowrap">Device / Browser</th>
                  <th className="pb-3 text-xs font-semibold text-white/50 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, idx: number) => (
                  <tr key={log.id ?? idx} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-4 pr-4 text-sm text-white/80 whitespace-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</td>
                    <td className="py-4 pr-4 text-sm font-mono text-white/60 whitespace-nowrap">{log.ip ?? "—"}</td>
                    <td className="py-4 pr-4 text-sm text-white/80 whitespace-nowrap">{log.location ?? "—"}</td>
                    <td className="py-4 pr-4 text-sm text-white/80" title={log.rawDevice || undefined}>{log.device ?? "—"}</td>
                    <td className="py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${log.status.toLowerCase() === "success" ? "bg-success-6/15 text-success-6" : "bg-error-1/15 text-error-1"}`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-white/40 italic">No login history available.</p>
        )}
      </div>

      {/* Modals */}
      <Modal
        opened={setupOpen}
        onClose={() => { closeSetup(); setSetupStep(1); setSetupCode(""); }}
        title={<span className="font-bold text-lg">Enable 2FA</span>}
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
        size="md"
        centered
      >
        <div className="flex flex-col gap-6 py-2">
          {setupStep === 1 && (
            <>
              {qrLoading ? (
                <div className="flex justify-center py-10"><Loader /></div>
              ) : (
                <div className="flex flex-col gap-6 items-center">
                  <p className="text-sm text-white/70 text-center">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).
                  </p>
                  
                  {hasQrCode ? (
                    <div className="bg-white p-3 rounded-xl shadow-md">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="2FA QR Code"
                          className="w-48 h-48"
                        />
                      ) : (
                        <QRCode
                          value={qrSetupUri}
                          size={192}
                          aria-label="2FA QR Code"
                          className="w-48 h-48"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full rounded-xl border border-warning-1/30 bg-warning-1/10 p-4 text-center">
                      <p className="text-sm text-warning-1">
                        2FA setup data was not returned. Please retry setup.
                      </p>
                      <Button
                        onClick={() => refetchQr()}
                        variant="outline"
                        color="yellow"
                        size="xs"
                        className="!mt-3"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {qrIsError && (
                    <p className="text-xs text-error-1 text-center">
                      Unable to start 2FA setup. Please try again.
                    </p>
                  )}

                  {qrData?.secret && (
                    <div className="w-full flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/10">
                      <span className="font-mono text-sm tracking-widest text-primary break-all">{qrData.secret}</span>
                      <CopyButton text={qrData.secret} />
                    </div>
                  )}

                  <Button
                    onClick={() => setSetupStep(2)}
                    disabled={!qrData?.secret}
                    className="w-full !mt-2 !bg-primary hover:!bg-primary/90"
                    size="md"
                  >
                    I&apos;ve scanned it - Next
                  </Button>
                </div>
              )}
            </>
          )}

          {setupStep === 2 && (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-white/70 text-center">
                Enter the 6-digit code generated by your authenticator app.
              </p>
              
              <div className={`flex flex-col gap-2 items-center ${setupError ? 'animate-shake' : ''}`}>
                <OtpInput digits={6} value={setupCode} onChange={setSetupCode} error={setupError} />
                {setupError && <span className="text-xs text-error-1 mt-1">Invalid code. Please try again.</span>}
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="default" onClick={() => setSetupStep(1)} className="flex-1 !bg-white/5 !border-white/10 !text-white hover:!bg-white/10">
                  Back
                </Button>
                <Button 
                  onClick={() => verify2FA(setupCode)} 
                  loading={verifyLoading}
                  disabled={setupCode.length !== 6}
                  className="flex-1 !bg-primary hover:!bg-primary/90"
                >
                  Activate 2FA
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        opened={disableOpen}
        onClose={() => { closeDisable(); setDisableCode(""); setDisableError(false); }}
        title={<span className="font-bold text-lg">Disable 2FA</span>}
        classNames={{ content: "!bg-gray-7", header: "!bg-gray-7" }}
        size="md"
        centered
      >
        <div className="flex flex-col gap-6 py-2">
          <div className="p-4 bg-warning-1/10 border border-warning-1/30 rounded-xl">
            <p className="text-sm text-warning-1 font-medium">
              Disabling 2FA reduces account security. Only proceed if you&apos;re resetting your authenticator app.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-white/70 text-center mb-2">Enter the 6-digit code from your authenticator app.</span>
            <div className={`flex flex-col gap-2 items-center ${disableError ? 'animate-shake' : ''}`}>
              <OtpInput digits={6} value={disableCode} onChange={setDisableCode} error={disableError} />
              {disableError && <span className="text-xs text-error-1 mt-1">Invalid code. Please try again.</span>}
            </div>
          </div>

          <Button 
            onClick={() => disable2FA(disableCode)} 
            loading={disableLoading}
            disabled={disableCode.length !== 6}
            color="red"
            className="w-full !mt-2 !bg-error-1 hover:!bg-error-1/90"
            size="md"
          >
            Confirm Disable
          </Button>
        </div>
      </Modal>

    </main>
  );
}

export default function SecurityPage() {
  return (
    <PageSuspense fallback={<AccountSecuritySkeleton />}>
      <SecurityPageInner />
    </PageSuspense>
  );
}
