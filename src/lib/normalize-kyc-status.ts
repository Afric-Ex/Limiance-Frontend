type KycStatusResponse = Record<string, any>;

const APPROVED_STATUSES = new Set(["approved", "verified"]);

export const normalizeKycStatus = <T extends KycStatusResponse>(response: T): T => {
  if (!response || typeof response !== "object") {
    return response;
  }

  const source = response.data && typeof response.data === "object" ? response.data : response;
  const rawStatus =
    source.status ??
    source.kycStatus ??
    source.kyc_status ??
    source.reviewStatus ??
    source.review_status ??
    source.applicantStatus ??
    source.applicant_status ??
    (source.verified === true || source.isVerified === true || source.isIDverified === true ? "approved" : undefined);

  const status = String(rawStatus || "not_submitted").toLowerCase();
  const reason = source.reason ?? source.rejectionReason ?? source.rejection_reason ?? source.reviewResult?.reviewRejectType ?? "";
  const submittedAt = source.submittedAt ?? source.submitted_at ?? source.createdAt ?? source.created_at ?? "";
  const isApproved = APPROVED_STATUSES.has(status);

  return {
    ...response,
    status,
    kycStatus: status,
    reason,
    rejectionReason: reason,
    submittedAt,
    verified: isApproved,
    isIDverified: isApproved,
    data: {
      ...(response.data && typeof response.data === "object" ? response.data : {}),
      status,
      kycStatus: status,
      reason,
      rejectionReason: reason,
      submittedAt,
      verified: isApproved,
      isIDverified: isApproved,
    },
  };
};

export const isKycApproved = (status?: string | null) =>
  APPROVED_STATUSES.has(String(status || "").toLowerCase());

export const getKycAccessToken = (response: Record<string, any> | null | undefined) => {
  if (!response || typeof response !== "object") {
    return "";
  }

  const data = response.data && typeof response.data === "object" ? response.data : {};
  const token =
    response.accessToken ??
    response.token ??
    response.sessionToken ??
    response.sdkToken ??
    response.sumsubToken ??
    data.accessToken ??
    data.token ??
    data.sessionToken ??
    data.sdkToken ??
    data.sumsubToken;

  return typeof token === "string" ? token : "";
};
