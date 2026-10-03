export interface Register {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
  country: string;
}

export interface Login {
  emailOrPhone: string;
  password: string;
  rememberMe: boolean;
  userAgent?: string;
  lotNumber?: string;
  captchaOutput?: string;
  passToken?: string;
  genTime?: string;
}

export interface VerifyEmail {
  email: string;
  otp: string;
}

export interface RegisterResponse {
  statusCode: number;
  error: string;
  message: string;
  success: boolean;
}

export interface LoginResponse {
  statusCode: number;
  error: string;
  message: string;
  success: boolean;
  needs_2fa?: boolean;
  needs2FA?: boolean;
  user_id?: string;
  userId?: string;
  requiresSecondFactor?: boolean;
  totpRequired?: boolean;
  emailOtpRequired?: boolean;
  secondFactorRequired?: boolean;
  loginChallengeToken?: string;
  challengeToken?: string;
  data: {
    id: string;
    user_id?: string;
    userId?: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    country: string;
    username: string;
    photo: string;
    isActive: boolean;
    isIDverified: boolean;
    kycStatus?: string;
    isFuturesAccepted: boolean;
    isFutures_accepted?: boolean;
    twoFaEnabled: boolean;
    isVerified: boolean;
    needs_2fa?: boolean;
    needs2FA?: boolean;
    requiresSecondFactor?: boolean;
    secondFactorRequired?: boolean;
    emailOtpRequired?: boolean;
    totpRequired?: boolean;
    loginChallengeToken?: string;
    challengeToken?: string;
    emailOtpEnabled?: boolean;
    createdAt?: string | number;
    accountCreatedAt?: string | number;
  };
}

export type LoginSecondFactorMethod = "totp" | "email";

export interface VerifyLoginSecondFactor {
  loginChallengeToken: string;
  rememberMe?: boolean;
  emailOtpCode?: string;
  totpCode?: string;
}

export interface ForgotPasswordResponse {
  statusCode: number;
  error: string;
  message: string;
  success: boolean;
}
