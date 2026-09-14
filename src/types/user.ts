export interface User {
  id: string;
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
  emailOtpEnabled?: boolean;
  isVerified: boolean;
}
