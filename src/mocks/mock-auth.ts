// mock auth — accepts any credentials so the full app can be tested without a real backend
// flip MOCK_MODE.auth to false when ready to switch to real endpoints

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

const MOCK_USER = {
  id: "usr_mock_001",
  email: "test@limiance.com",
  phone: "+2348012345678",
  firstName: "Test",
  lastName: "User",
  country: "NG",
  username: "testuser",
  photo: "",
  isActive: true,
  isIDverified: false,
  isFuturesAccepted: true,
  twoFaEnabled: false,
  isVerified: true,
};

export const mockAuth = {
  login: async () => {
    await delay(800);
    return {
      data: {
        statusCode: 200,
        error: "",
        message: "Login successful",
        success: true,
        accessToken: "mock_token_" + Date.now(),
        refreshToken: "mock_refresh_" + Date.now(),
        data: MOCK_USER,
      },
      status: 200,
    };
  },

  register: async () => {
    await delay(800);
    return {
      data: {
        statusCode: 200,
        error: "",
        message: "Registration successful",
        success: true,
        accessToken: "mock_token_" + Date.now(),
      },
      status: 200,
    };
  },

  verifyEmail: async () => {
    await delay(600);
    return {
      data: {
        statusCode: 200,
        error: "",
        message: "Email verified",
        success: true,
      },
      status: 200,
    };
  },

  forgotPassword: async () => {
    await delay(600);
    return {
      data: {
        statusCode: 200,
        error: "",
        message: "OTP sent",
        success: true,
        accessToken: "mock_token_" + Date.now(),
      },
      status: 200,
    };
  },

  resetPassword: async (_data?: any) => {
    await delay(800);
    return {
      data: {
        statusCode: 200,
        error: "",
        message: "Password reset successful",
        success: true,
      },
      status: 200,
    };
  },
};
