type RawUser = Record<string, any> | null | undefined;

export const normalizeUser = <T extends RawUser>(user: T): T => {
  if (!user || typeof user !== "object") {
    return user;
  }

  const kycStatus = String(user.kycStatus ?? user.kyc_status ?? "").toLowerCase();
  const isIDverified =
    user.isIDverified === true ||
    user.is_id_verified === true ||
    user.kyc_status === true ||
    user.kycStatus === true ||
    kycStatus === "approved" ||
    kycStatus === "verified";

  return {
    ...user,
    firstName: user.firstName ?? user.first_name ?? "",
    lastName: user.lastName ?? user.last_name ?? "",
    isVerified: user.isVerified ?? user.is_verified ?? false,
    isIDverified,
    kycStatus: user.kycStatus ?? user.kyc_status ?? (isIDverified ? "approved" : "not_submitted"),
    twoFaEnabled: user.twoFaEnabled ?? user.two_factor_enabled ?? user.two_fa_enabled ?? false,
    isFuturesAccepted:
      user.isFuturesAccepted ?? user.isFutures_accepted ?? false,
  } as T;
};
