"use client";

import { useUserStore } from "@/src/stores/user-store";
import { CopyButton } from "@/src/components/shared/copy-button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { auth } from "@/src/services/auth";
import Avatar from "boring-avatars";
import { TextInput, Button, FileInput, Loader } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { BiEdit } from "react-icons/bi";
import { convertFileToBase64 } from "@/src/lib/convert-file-to-base64";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { CheckMark } from "@/src/components/icons/check-mark";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountProfileSkeleton } from "@/src/components/skeletons/account";
import { AccountPageHeader } from "@/src/components/settings/account-page-header";
import { MdPersonOutline } from "react-icons/md";
import { useTranslations } from "next-intl";

const kycBadge: Record<string, { color: string }> = {
  pending:       { color: "bg-yellow-500/20 text-yellow-400" },
  approved:      { color: "bg-green-500/20 text-green-400 border border-green-500/30" },
  rejected:      { color: "bg-red-500/20 text-red-400" },
  failed:        { color: "bg-red-500/20 text-red-400" },
  not_submitted: { color: "bg-gray-500/20 text-gray-400" },
};

function ProfilePageInner() {
  const t = useTranslations("Profile");
  const user = useUserStore((state) => state.user);
  const userLoading = useUserStore((state) => state.loading);
  const setUser = useUserStore((state) => state.setUser);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: kycStatus } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: auth.checkKycStatus,
    select: (res: any) => res.data,
  });

  const [imgError, setImgError] = useState(false);
  const kycLabel = (status?: string): string | undefined => {
    if (status === "pending") return t("kycPending");
    if (status === "approved") return t("kycVerified");
    if (status === "rejected") return t("kycRejected");
    if (status === "failed") return t("kycFailed");
    return undefined;
  };
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    t("user");
  const accountDetails = [
    { label: t("fullName"), value: fullName },
    { label: t("username"), value: user?.username || t("notSet") },
    { label: t("email"), value: user?.email || t("notAvailable") },
    { label: t("phone"), value: user?.phone || t("notAvailable") },
    { label: t("country"), value: user?.country || t("notAvailable") },
    { label: t("userId"), value: user?.id || t("notAvailable") },
  ];
  const accountStatus = [
    {
      label: t("emailVerification"),
      value: user?.isVerified ? t("verified") : t("pending"),
      tone: user?.isVerified ? "text-green-400" : "text-yellow-400",
    },
    {
      label: t("identityCheck"),
      value: user?.isIDverified ? t("verified") : t("notVerified"),
      tone: user?.isIDverified ? "text-green-400" : "text-yellow-400",
    },
    {
      label: t("twoFactorAuth"),
      value: user?.twoFaEnabled ? t("enabled") : t("disabled"),
      tone: user?.twoFaEnabled ? "text-green-400" : "text-red-400",
    },
    {
      label: t("futuresAccess"),
      value: user?.isFuturesAccepted ? t("enabled") : t("disabled"),
      tone: user?.isFuturesAccepted ? "text-green-400" : "text-white",
    },
    {
      label: t("accountStatus"),
      value: user?.isActive ? t("active") : t("inactive"),
      tone: user?.isActive ? "text-green-400" : "text-red-400",
    },
    {
      label: t("kycStatus"),
      value: kycLabel(kycStatus?.status) ?? t("unverified"),
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
      username: "",
    },
    validate: {
      firstName: (value) => (value.length < 2 ? t("firstNameMinLength") : null),
      lastName: (value) => (value.length < 2 ? t("lastNameMinLength") : null),
      phone: (value) => (/^\+?[1-9]\d{7,14}$/.test(value) ? null : t("invalidPhone")),
      username: (value) => (value.length > 0 && value.length < 4 ? t("usernameMinLength") : null),
    },
  });
  const { setValues } = form;

  useEffect(() => {
    if (!user) return;
    setValues({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      email: user.email || "",
      username: user.username || "",
    });
  }, [setValues, user]);

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
        email: values.email || user?.email || "",
        username: values.username || user?.username || "",
        password: "",
        photo: user?.photo || "",
        country: user?.country || "",
      }),
    onSuccess: (_, variables) => {
      successNotification(t("updateSuccess"));
      if (user) {
        setUser({
          ...user,
          firstName: variables.firstName,
          lastName: variables.lastName,
          phone: variables.phone,
          username: variables.username,
        });
      }
    },
    onError: (err) => errorMessageHandler(err),
  });

  // Avatar upload → persisted via users/update_user, reflected immediately in store
  const [photoDraft, setPhotoDraft] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const { mutate: updatePhoto, isPending: photoUpdating } = useMutation({
    mutationFn: (photo: string) =>
      userService.updateUser({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: user?.phone || "",
        email: user?.email || "",
        username: user?.username || "",
        password: "",
        photo,
        country: user?.country || "",
      }),
    onSuccess: (_, photo) => {
      setPhotoDraft(photo);
      setImgError(false);
      if (user) setUser({ ...user, photo });
      successNotification(t("photoUpdated"));
    },
    onError: (err) => errorMessageHandler(err),
  });

  useEffect(() => {
    setImgError(false);
  }, [photoDraft]);

  const handleAvatarSelect = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      errorMessageHandler({ message: t("imageTooLarge") } as any);
      return;
    }
    setAvatarFile(file);
    const base64 = await convertFileToBase64(file);
    setPhotoDraft(base64); // optimistic preview
    setImgError(false);
    updatePhoto(base64);
  };

  if (!mounted || (!user && userLoading)) return <AccountProfileSkeleton />;

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 pb-8 page-enter max-[1150px]:pb-[100px]">
      <AccountPageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        icon={<MdPersonOutline size={23} />}
      />

      {/* Section A — Avatar & Identity */}
      <div className="account-card relative flex flex-col items-center gap-5 overflow-hidden sm:flex-row sm:items-start sm:gap-6">
        <label className="relative cursor-pointer group shrink-0">
          <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden bg-primary/20 border-2 border-white/10 group-hover:border-primary/50 transition-colors">
            {photoDraft || (user?.photo && !imgError) ? (
              <img
                src={photoDraft || user.photo}
                alt={t("avatar")}
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
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {photoUpdating ? (
              <Loader size={18} color="#fff" />
            ) : (
              <BiEdit size={20} className="text-white" />
            )}
          </div>
          <FileInput
            value={avatarFile}
            hidden
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleAvatarSelect}
          />
        </label>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:items-start">
          <div className="flex flex-col gap-1 items-center sm:items-start">
            <h2 className="max-w-full truncate text-xl font-semibold">{user?.username || user?.firstName || t("user")}</h2>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <span>UID: {user?.id?.split("-")?.at(-1)}</span>
              <CopyButton text={user?.id as string} />
            </div>
          </div>
          
          <div className="mt-1">
            {kycStatus?.status ? (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${kycBadge[kycStatus.status]?.color ?? "bg-gray-9/20 text-gray-9"}`}>
                {kycStatus.status === "approved" && <CheckMark />}
                {kycLabel(kycStatus.status) ?? kycStatus.status}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit bg-gray-500/20 text-gray-400">
                {t("unverified")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section B — Edit Profile Form */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
        <div className="account-card flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold">{t("profileDetails")}</h3>
            <p className="text-sm text-white/45 mt-1">
              {t("profileDetailsDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {accountDetails.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.07] bg-black/15 p-4 transition-colors hover:border-white/[0.13]"
              >
                <div className="text-xs uppercase tracking-wide text-white/45 mb-2">
                  {item.label}
                </div>
                <div
                  className={`${
                    item.label === t("userId")
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

        <div className="account-card flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold">{t("accountStatus")}</h3>
            <p className="text-sm text-white/45 mt-1">
              {t("accountStatusDesc")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {accountStatus.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/15 px-4 py-3"
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

      <div className="account-card flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-semibold">{t("editProfile")}</h3>
          <p className="mt-1 text-sm text-white/45">{t("editProfileDesc")}</p>
        </div>
        <form onSubmit={form.onSubmit((values) => updateProfile(values))} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <TextInput
              label={t("firstName")}
              placeholder={t("enterFirstName")}
              classNames={{
                input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary",
                label: "!text-white/70 !mb-1.5 !text-sm",
                error: "!mt-1.5 !text-xs !text-error-1",
              }}
              {...form.getInputProps("firstName")}
            />
            <TextInput
              label={t("lastName")}
              placeholder={t("enterLastName")}
              classNames={{
                input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary",
                label: "!text-white/70 !mb-1.5 !text-sm",
                error: "!mt-1.5 !text-xs !text-error-1",
              }}
              {...form.getInputProps("lastName")}
            />
          </div>
          
          <TextInput
            label={t("username")}
            placeholder={t("enterUsername")}
            description={t("usernameChangeLimit")}
            maxLength={40}
            classNames={{
              input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary",
              label: "!text-white/70 !mb-1.5 !text-sm",
              description: "!text-white/40 !mb-2 !text-xs",
              error: "!mt-1.5 !text-xs !text-error-1",
            }}
            {...form.getInputProps("username")}
          />

          <TextInput
            label={t("phoneNumber")}
            placeholder="+1234567890"
            description={t("phoneCountryCodeHint")}
            classNames={{
              input: "!bg-gray-1 !border-gray-9/40 !text-white focus:!border-primary",
              label: "!text-white/70 !mb-1.5 !text-sm",
              description: "!text-white/40 !mb-2 !text-xs",
              error: "!mt-1.5 !text-xs !text-error-1",
            }}
            {...form.getInputProps("phone")}
          />

          <TextInput
            label={t("emailAddress")}
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
              {isSuccess ? t("updateSuccess") : t("saveChanges")}
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
