"use client";

import { useUserStore } from "@/src/stores/user-store";
import { CopyButton } from "@/src/components/shared/copy-button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { auth } from "@/src/services/auth";
import Avatar from "boring-avatars";
import { TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { CheckMark } from "@/src/components/icons/check-mark";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountProfileSkeleton } from "@/src/components/skeletons";

const kycBadge: Record<string, { label: string; color: string }> = {
  pending:       { label: "Pending",    color: "bg-yellow-500/20 text-yellow-400" },
  approved:      { label: "Verified",   color: "bg-green-500/20 text-green-400 border border-green-500/30" },
  rejected:      { label: "Rejected",   color: "bg-red-500/20 text-red-400" },
  failed:        { label: "Failed",     color: "bg-red-500/20 text-red-400" },
  not_submitted: { label: "Unverified", color: "bg-gray-500/20 text-gray-400" },
};

function ProfilePageInner() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: kycStatus } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: auth.checkKycStatus,
    select: (res: any) => res.data,
  });

  const [imgError, setImgError] = useState(false);
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "User";
  const accountDetails = [
    { label: "Full Name", value: fullName },
    { label: "Username", value: user?.username || "Not set" },
    { label: "Email", value: user?.email || "Not available" },
    { label: "Phone", value: user?.phone || "Not available" },
    { label: "Country", value: user?.country || "Not available" },
    { label: "User ID", value: user?.id || "Not available" },
  ];
  const accountStatus = [
    {
      label: "Email Verification",
      value: user?.isVerified ? "Verified" : "Pending",
      tone: user?.isVerified ? "text-green-400" : "text-yellow-400",
    },
    {
      label: "Identity Check",
      value: user?.isIDverified ? "Verified" : "Not verified",
      tone: user?.isIDverified ? "text-green-400" : "text-yellow-400",
    },
    {
      label: "Two-Factor Auth",
      value: user?.twoFaEnabled ? "Enabled" : "Disabled",
      tone: user?.twoFaEnabled ? "text-green-400" : "text-red-400",
    },
    {
      label: "Futures Access",
      value: user?.isFuturesAccepted ? "Enabled" : "Disabled",
      tone: user?.isFuturesAccepted ? "text-green-400" : "text-white",
    },
    {
      label: "Account Status",
      value: user?.isActive ? "Active" : "Inactive",
      tone: user?.isActive ? "text-green-400" : "text-red-400",
    },
    {
      label: "KYC Status",
      value: kycBadge[kycStatus?.status]?.label ?? "Unverified",
      tone:
        kycStatus?.status === "approved"
          ? "text-green-400"
          : kycStatus?.status === "pending"
            ? "text-yellow-400"
            : "text-red-400",
    },
  ];

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    },
    validate: {
      firstName: (value) => (value.length < 2 ? "First name must be at least 2 characters" : null),
      lastName: (value) => (value.length < 2 ? "Last name must be at least 2 characters" : null),
      phone: (value) => (/^\+?[1-9]\d{7,14}$/.test(value) ? null : "Invalid international phone format"),
    },
  });

  useEffect(() => {
    if (user) {
      form.setValues({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [form, user]);

  useEffect(() => {
    if (user && isKycApproved(kycStatus?.status) && !user.isIDverified) {
      setUser({ ...user, isIDverified: true, kycStatus: "approved" } as any);
    }
  }, [kycStatus?.status, setUser, user]);

  const { mutate: updateProfile, isPending, isSuccess } = useMutation({
    mutationFn: (values: typeof form.values) =>
      userService.updateUser({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        username: user?.username || "",
        password: "",
        photo: user?.photo || "",
        country: user?.country || "",
      }),
    onSuccess: (_, variables) => {
      successNotification("Profile updated");
      if (user) {
        setUser({
          ...user,
          firstName: variables.firstName,
          lastName: variables.lastName,
          phone: variables.phone,
        });
      }
    },
    onError: (err) => errorMessageHandler(err),
  });

  if (!mounted) return <AccountProfileSkeleton />;

  return (
    <main className="flex flex-col gap-8 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Personal Information</h1>
        <p className="text-sm text-white/50">Review your account information and update the editable fields below.</p>
      </div>

      {/* Section A — Avatar & Identity */}
      <div className="p-8 bg-primary/10 border border-primary/25 rounded-20px backdrop-blur-8px flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-primary/20 shrink-0">
          {user?.photo && !imgError ? (
            <img 
              src={user.photo} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
              onError={() => setImgError(true)} 
            />
          ) : (
            <Avatar
              size={80}
              name={user?.id || user?.username || user?.email || "User"}
              variant="beam"
              colors={["#4d77f0", "#181a20", "#3354c4", "#0ECB81", "#F6465D"]}
            />
          )}
        </div>
        
        <div className="flex flex-col gap-3 items-center sm:items-start flex-1">
          <div className="flex flex-col gap-1 items-center sm:items-start">
            <h2 className="text-xl font-semibold">{user?.username || user?.firstName || "User"}</h2>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <span>UID: {user?.id?.split("-")?.at(-1)}</span>
              <CopyButton text={user?.id as string} />
            </div>
          </div>
          
          <div className="mt-1">
            {kycStatus?.status ? (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${kycBadge[kycStatus.status]?.color ?? "bg-gray-9/20 text-gray-9"}`}>
                {kycStatus.status === "approved" && <CheckMark />}
                {kycBadge[kycStatus.status]?.label ?? kycStatus.status}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit bg-gray-500/20 text-gray-400">
                Unverified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section B — Edit Profile Form */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
        <div className="p-8 bg-primary/10 border border-primary/25 rounded-20px backdrop-blur-8px flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold">Profile Details</h3>
            <p className="text-sm text-white/45 mt-1">
              This screen shows the account details currently attached to your profile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accountDetails.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-xs uppercase tracking-wide text-white/45 mb-2">
                  {item.label}
                </div>
                <div
                  className={`${
                    item.label === "User ID"
                      ? "font-mono text-sm break-all"
                      : "text-base"
                  } text-white font-medium`}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-primary/10 border border-primary/25 rounded-20px backdrop-blur-8px flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold">Account Status</h3>
            <p className="text-sm text-white/45 mt-1">
              Security and verification flags currently active on your account.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {accountStatus.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <span className="text-sm text-white/60">{item.label}</span>
                <span className={`text-sm font-semibold ${item.tone}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 bg-primary/10 border border-primary/25 rounded-20px backdrop-blur-8px flex flex-col gap-6">
        <h3 className="text-lg font-semibold">Edit Profile</h3>
        <form onSubmit={form.onSubmit((values) => updateProfile(values))} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <TextInput
              label="First Name"
              placeholder="Enter first name"
              classNames={{
                input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary",
                label: "!text-white/70 !mb-1.5 !text-sm",
                error: "!mt-1.5 !text-xs !text-error-1",
              }}
              {...form.getInputProps("firstName")}
            />
            <TextInput
              label="Last Name"
              placeholder="Enter last name"
              classNames={{
                input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary",
                label: "!text-white/70 !mb-1.5 !text-sm",
                error: "!mt-1.5 !text-xs !text-error-1",
              }}
              {...form.getInputProps("lastName")}
            />
          </div>
          
          <TextInput
            label="Phone Number"
            placeholder="+1234567890"
            description="Include country code (e.g., +1 for US)"
            classNames={{
              input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary",
              label: "!text-white/70 !mb-1.5 !text-sm",
              description: "!text-white/40 !mb-2 !text-xs",
              error: "!mt-1.5 !text-xs !text-error-1",
            }}
            {...form.getInputProps("phone")}
          />

          <TextInput
            label="Email Address"
            disabled
            classNames={{
              input: "!bg-gray-1/50 !border-gray-9/20 !text-white/50 cursor-not-allowed",
              label: "!text-white/70 !mb-1.5 !text-sm",
            }}
            {...form.getInputProps("email")}
          />

          <div className="pt-2">
            <Button
              type="submit"
              loading={isPending}
              className={`!h-[44px] !px-8 !rounded-xl !font-semibold !transition-all ${isSuccess ? '!bg-success-6 hover:!bg-success-6' : '!bg-primary hover:!bg-primary/90'}`}
              leftSection={isSuccess ? <CheckMark /> : undefined}
            >
              {isSuccess ? "Profile updated" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <PageSuspense fallback={<AccountProfileSkeleton />}>
      <ProfilePageInner />
    </PageSuspense>
  );
}
