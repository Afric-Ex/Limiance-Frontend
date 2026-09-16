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
import { MdSmartphone, MdDesktopMac, MdMailOutline } from "react-icons/md";
import { BiCheck } from "react-icons/bi";
import { CopyButton } from "@/src/components/shared/copy-button";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountSecuritySkeleton } from "@/src/components/skeletons";

type TwoFASetupData = {
  secret: string;
  qrCodeUrl: string;
};

type SecurityRecord = Record<string, any>;

type SessionItem = {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  canRevoke: boolean;
};

type LoginLogItem = {
  id: string;
  device: string;
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

const toArray = (value: unknown): SecurityRecord[] => {
  if (Array.isArray(value)) return value as SecurityRecord[];
  return [];
};

const extractPayloadList = (res: any, nestedKey?: string): SecurityRecord[] => {
  const candidates = [
    res?.data,
    res?.data?.data,
    nestedKey ? res?.data?.[nestedKey] : undefined,
    nestedKey ? res?.[nestedKey] : undefined,
    res,
  ];

  for (const candidate of candidates) {
    const list = toArray(candidate);
    if (list.length > 0) return list;
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
  if (typeof value !== "string" || !value.trim()) return "";

  const trimmed = value.trim();
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  const formattedMatch = trimmed.match(/^[A-Za-z]+\s(\d{2})\s([A-Za-z]+)\s(\d{4})\s(\d{2}:\d{2}:\d{2})(AM|PM)$/);
  if (formattedMatch) {
    const [, day, month, year, time, meridiem] = formattedMatch;
    const normalized = `${day} ${month} ${year} ${time} ${meridiem}`;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return "";
};

function SecurityPageInner() {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const twoFAEnabled = user?.twoFaEnabled ?? false;
  const emailOtpEnabled = user?.emailOtpEnabled ?? false;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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
  const qrImageSrc = qrData?.qrCodeUrl || (qrSetupUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrSetupUri)}`
    : "");

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
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<any, Error, SessionItem[]>({
    queryKey: userKeys.sessions,
    queryFn: async () => {
      try {
        return await userService.getActiveSessions();
      } catch (error: any) {
        const backendMessage = String(
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          ""
        ).toLowerCase();

        const canFallback =
          error?.response?.status === 500 &&
          (backendMessage.includes("unimplemented") || backendMessage.includes("getactivesessions"));

        if (!canFallback) throw error;

        return await userService.getLoginLogs({ page: 1, limit: 5 });
      }
    },
    select: (res: any) => {
      const rawSessions = extractPayloadList(res, "user_login_log");
      const isFallbackSource = !Array.isArray(res?.data) && rawSessions.length > 0;

      return rawSessions.map((session: SecurityRecord, index: number) => ({
        id: getStringField(session, ["id", "_id", "sessionId", "session_id"]) || `session-${index}`,
        device: getStringField(session, ["device", "browser", "userAgent", "user_agent"]),
        ip: getStringField(session, ["ip", "IP"]),
        location: getStringField(session, ["location", "country", "city"]),
        lastActive: normalizeDateValue(getDateField(session, ["lastActive", "createdAt", "created_at", "loginAt", "login_at"])),
        isCurrent: typeof session?.isCurrent === "boolean" ? session.isCurrent : index === 0,
        canRevoke: !isFallbackSource,
      }));
    },
  });

  const { mutate: revokeSession, isPending: revokeLoading } = useMutation({
    mutationFn: (sessionId: string) => userService.revokeSession(sessionId),
    onSuccess: () => {
      successNotification("Session revoked successfully");
      queryClient.invalidateQueries({ queryKey: userKeys.sessions });
      setRevokeConfirmId(null);
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);

  // Logs
  const { data: logs = [], isLoading: logsLoading } = useQuery<any, Error, LoginLogItem[]>({
    queryKey: userKeys.loginLogs(),
    queryFn: () => userService.getLoginLogs({ page: 1, limit: 10 }),
    select: (res: any) => {
      const rawLogs = extractPayloadList(res, "user_login_log");

      return rawLogs.map((log: SecurityRecord, index: number) => ({
        id: getStringField(log, ["id", "_id"]) || `log-${index}`,
        device: getStringField(log, ["device", "browser", "userAgent", "user_agent"]),
        location: getStringField(log, ["location", "country", "city"]),
        ip: getStringField(log, ["ip", "IP"]),
        createdAt: normalizeDateValue(getDateField(log, ["createdAt", "created_at", "loginAt", "login_at"])),
        status: getStringField(log, ["status", "result"]) || "Success",
      }));
    },
  });

  if (!mounted) return <AccountSecuritySkeleton />;

  return (
    <main className="flex flex-col gap-8 max-[1150px]:gap-4 max-w-4xl max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-sm text-white/50">Manage your password, 2FA, and active sessions.</p>
      </div>

      {/* Card 1 — Two-Factor Authentication (2FA) */}
      <div className="p-8 max-[1150px]:p-4 bg-primary/10 border border-primary/25 rounded-20px max-[1150px]:rounded-xl backdrop-blur-8px flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 max-[1150px]:gap-4">
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
      <div className="p-8 max-[1150px]:p-4 bg-primary/10 border border-primary/25 rounded-20px max-[1150px]:rounded-xl backdrop-blur-8px flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 max-[1150px]:gap-4">
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
      <div className="p-8 max-[1150px]:p-4 bg-primary/10 border border-primary/25 rounded-20px max-[1150px]:rounded-xl backdrop-blur-8px flex flex-col gap-6 max-[1150px]:gap-4">
        <h3 className="text-lg font-semibold">Change Password</h3>
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
      <div className="p-8 max-[1150px]:p-4 bg-primary/10 border border-primary/25 rounded-20px max-[1150px]:rounded-xl backdrop-blur-8px flex flex-col gap-6 max-[1150px]:gap-4">
        <h3 className="text-lg font-semibold">Active Sessions</h3>
        {sessionsLoading ? (
          <div className="flex justify-center py-6"><Loader color="blue" /></div>
        ) : sessions?.length > 0 ? (
          <div className="flex flex-col gap-4">
            {sessions.map((session: any) => (
              <div key={session.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-white/[0.06] bg-black/20 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-white/50">
                    {session.device?.toLowerCase().includes("mobile") ? <MdSmartphone size={20} /> : <MdDesktopMac size={20} />}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{session.device || "Unknown Device"}</span>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 bg-success-6/20 text-success-6 text-[10px] font-bold rounded-full">CURRENT SESSION</span>
                      )}
                    </div>
                    <span className="text-xs text-white/40">{session.location || "Unknown Location"} • {session.ip || "Unknown IP"}</span>
                    <span className="text-xs text-white/40">Last active: {session.lastActive ? new Date(session.lastActive).toLocaleString() : "Recently"}</span>
                  </div>
                </div>
                
                {!session.isCurrent && session.canRevoke && (
                  revokeConfirmId === session.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-warning-1 mr-2">Revoke this session?</span>
                      <Button size="xs" variant="subtle" color="gray" onClick={() => setRevokeConfirmId(null)}>Cancel</Button>
                      <Button size="xs" color="red" loading={revokeLoading} onClick={() => revokeSession(session.id)}>Confirm</Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      color="red"
                      size="sm"
                      onClick={() => setRevokeConfirmId(session.id)}
                      className="!border-error-1 !text-error-1 hover:!bg-error-1/10"
                    >
                      Revoke
                    </Button>
                  )
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40 italic">No other active sessions</p>
        )}
        {sessions.length > 0 && sessions.some((session) => !session.canRevoke) && (
          <p className="text-xs text-white/40">
            Active sessions are temporarily being derived from recent login activity because the live session endpoint is unavailable.
          </p>
        )}
      </div>

      {/* Card 4 — Login History */}
      <div className="p-8 max-[1150px]:p-4 bg-primary/10 border border-primary/25 rounded-20px max-[1150px]:rounded-xl backdrop-blur-8px flex flex-col gap-6 max-[1150px]:gap-4">
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
                    <td className="py-4 pr-4 text-sm text-white/80">{log.device ?? "—"}</td>
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
                  
                  {qrImageSrc ? (
                    <div className="bg-white p-3 rounded-xl shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrImageSrc}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                      />
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
