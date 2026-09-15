import {
  registerSchema,
  resetSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
} from "./schemas";

type ZodResult = {
  success: boolean;
  error?: { issues: Array<{ message: string; path: Array<string | number> }> };
};

const findIssue = (
  result: ZodResult,
  message: string
): { message: string; path: Array<string | number> } | undefined =>
  result.error?.issues.find((issue) => issue.message === message);

const withData = (overrides: Record<string, unknown>) => ({
  email: "test@example.com",
  phone: "1234567890",
  password: "Abcdef1@",
  confirmPassword: "Abcdef1@",
  firstName: "Alice",
  lastName: "Smith",
  username: "alice",
  ...overrides,
});

describe("registerSchema", () => {
  it("parses a valid registration payload", () => {
    const result = registerSchema.safeParse(withData({}));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects an invalid email with the correct message and path", () => {
    const result = registerSchema.safeParse(withData({ email: "not-an-email" }));
    expect(result.success).toBe(false);
    const issue = findIssue(result as any, "Invalid email address");
    expect(issue?.path).toEqual(["email"]);
  });

  it("rejects a missing email", () => {
    const { email: _email, ...rest } = withData({});
    const result = registerSchema.safeParse(rest);
    expect(result.success).toBe(false);
    const issue = findIssue(result as any, "Required");
    expect(issue?.path).toEqual(["email"]);
  });

  it("accepts a phone number with exactly 10 digits", () => {
    const result = registerSchema.safeParse(withData({ phone: "1234567890" }));
    expect(result.success).toBe(true);
  });

  it("rejects a phone number shorter than 10 digits", () => {
    const result = registerSchema.safeParse(withData({ phone: "123456789" }));
    expect(result.success).toBe(false);
    const issue = findIssue(result as any, "Phone number must be at least 10 digits");
    expect(issue?.path).toEqual(["phone"]);
  });

  it("rejects a phone number that is empty", () => {
    const result = registerSchema.safeParse(withData({ phone: "" }));
    expect(result.success).toBe(false);
    expect(
      findIssue(result as any, "Phone number must be at least 10 digits")?.path
    ).toEqual(["phone"]);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse(withData({ password: "Ab1@", confirmPassword: "Ab1@" }));
    expect(result.success).toBe(false);
    const issue = findIssue(result as any, "Password must be at least 8 characters");
    expect(issue?.path).toEqual(["password"]);
  });

  it("requires at least one lowercase letter in the password", () => {
    const result = registerSchema.safeParse(
      withData({ password: "ABCDEF1@", confirmPassword: "ABCDEF1@" })
    );
    expect(result.success).toBe(false);
    expect(
      findIssue(result as any, "Password must include at least one lowercase letter")?.path
    ).toEqual(["password"]);
  });

  it("requires at least one uppercase letter in the password", () => {
    const result = registerSchema.safeParse(
      withData({ password: "abcdef1@", confirmPassword: "abcdef1@" })
    );
    expect(result.success).toBe(false);
    expect(
      findIssue(result as any, "Password must include at least one uppercase letter")?.path
    ).toEqual(["password"]);
  });

  it("requires at least one number in the password", () => {
    const result = registerSchema.safeParse(
      withData({ password: "Abcdefg@", confirmPassword: "Abcdefg@" })
    );
    expect(result.success).toBe(false);
    expect(
      findIssue(result as any, "Password must include at least one number")?.path
    ).toEqual(["password"]);
  });

  it("requires at least one special character in the password", () => {
    const result = registerSchema.safeParse(
      withData({ password: "Abcdefg1", confirmPassword: "Abcdefg1" })
    );
    expect(result.success).toBe(false);
    expect(
      findIssue(result as any, "Password must include at least one special character (@$!%*?&#)")
        ?.path
    ).toEqual(["password"]);
  });

  it("rejects a confirmPassword shorter than 8 characters", () => {
    const result = registerSchema.safeParse(withData({ confirmPassword: "Ab1@" }));
    expect(result.success).toBe(false);
    const issue = findIssue(
      result as any,
      "Confirm Password must be at least 8 characters"
    );
    expect(issue?.path).toEqual(["confirmPassword"]);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse(
      withData({ password: "Abcdef1@", confirmPassword: "Abcdef2@" })
    );
    expect(result.success).toBe(false);
    const issue = findIssue(result as any, "Passwords do not match");
    expect(issue?.path).toEqual(["confirmPassword"]);
  });

  it("rejects an empty firstName", () => {
    const result = registerSchema.safeParse(withData({ firstName: "" }));
    expect(result.success).toBe(false);
    const issue = findIssue(result as any, "First name is required");
    expect(issue?.path).toEqual(["firstName"]);
  });

  it("rejects an empty lastName", () => {
    const result = registerSchema.safeParse(withData({ lastName: "" }));
    expect(result.success).toBe(false);
    const issue = findIssue(result as any, "Last name is required");
    expect(issue?.path).toEqual(["lastName"]);
  });

  it("rejects a username shorter than 3 characters", () => {
    const result = registerSchema.safeParse(withData({ username: "ab" }));
    expect(result.success).toBe(false);
    const issue = findIssue(result as any, "Username must be at least 3 characters");
    expect(issue?.path).toEqual(["username"]);
  });

  it("accepts a username of exactly 3 characters", () => {
    const result = registerSchema.safeParse(withData({ username: "abc" }));
    expect(result.success).toBe(true);
  });
});

describe("resetSchema", () => {
  const valid = { password: "Abcdef1@", confirmPassword: "Abcdef1@" };

  it("parses a valid reset payload", () => {
    const result = resetSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a short new password", () => {
    const result = resetSchema.safeParse({ ...valid, password: "Ab1@", confirmPassword: "Ab1@" });
    expect(result.success).toBe(false);
    expect(
      findIssue(result as any, "Password must be at least 8 characters")?.path
    ).toEqual(["password"]);
  });

  it("rejects a short confirmation password", () => {
    const result = resetSchema.safeParse({ ...valid, confirmPassword: "Ab1@" });
    expect(result.success).toBe(false);
    expect(
      findIssue(result as any, "Confirm Password must be at least 8 characters")?.path
    ).toEqual(["confirmPassword"]);
  });

  it("rejects mismatched passwords", () => {
    const result = resetSchema.safeParse({
      password: "Abcdef1@",
      confirmPassword: "Abcdef2@",
    });
    expect(result.success).toBe(false);
    expect(findIssue(result as any, "Passwords do not match")?.path).toEqual([
      "confirmPassword",
    ]);
  });

  it("requires the same password character classes as registration", () => {
    const result = resetSchema.safeParse({
      password: "ABCDEF1@",
      confirmPassword: "ABCDEF1@",
    });
    expect(result.success).toBe(false);
    expect(
      findIssue(result as any, "Password must include at least one lowercase letter")?.path
    ).toEqual(["password"]);
  });
});

describe("loginSchema", () => {
  it("parses a valid login payload", () => {
    const result = loginSchema.safeParse({ emailOrPhone: "user@example.com", password: "Abcdef1@" });
    expect(result.success).toBe(true);
  });

  it("accepts a phone-style login identifier", () => {
    const result = loginSchema.safeParse({ emailOrPhone: "1234567890", password: "Abcdef1@" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing emailOrPhone", () => {
    const result = loginSchema.safeParse({ password: "Abcdef1@" });
    expect(result.success).toBe(false);
    expect(findIssue(result as any, "Invalid email address")?.path).toEqual(["emailOrPhone"]);
  });

  it("rejects a short password", () => {
    const result = loginSchema.safeParse({ emailOrPhone: "user@example.com", password: "short" });
    expect(result.success).toBe(false);
    const issue = findIssue(
      result as any,
      "Confirm Password must be at least 8 characters"
    );
    expect(issue?.path).toEqual(["password"]);
  });

  it("rejects a number as the password type", () => {
    const result = loginSchema.safeParse({ emailOrPhone: "user@example.com", password: 42 });
    expect(result.success).toBe(false);
  });
});

describe("otpSchema", () => {
  it("parses a 6-digit otp", () => {
    const result = otpSchema.safeParse({ otp: "123456" });
    expect(result.success).toBe(true);
  });

  it("parses otps longer than 6 characters", () => {
    const result = otpSchema.safeParse({ otp: "1234567" });
    expect(result.success).toBe(true);
  });

  it("rejects an otp shorter than 6 characters", () => {
    const result = otpSchema.safeParse({ otp: "12345" });
    expect(result.success).toBe(false);
    expect(findIssue(result as any, "OTP must be 6 digits")?.path).toEqual(["otp"]);
  });

  it("rejects an empty otp", () => {
    const result = otpSchema.safeParse({ otp: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing otp", () => {
    const result = otpSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(findIssue(result as any, "Required")?.path).toEqual(["otp"]);
  });
});

describe("forgotPasswordSchema", () => {
  it("parses a valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(findIssue(result as any, "Invalid email address")?.path).toEqual(["email"]);
  });

  it("rejects a missing email", () => {
    const result = forgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(findIssue(result as any, "Required")?.path).toEqual(["email"]);
  });

  it("rejects a non-string email value", () => {
    const result = forgotPasswordSchema.safeParse({ email: 42 });
    expect(result.success).toBe(false);
    expect(findIssue(result as any, "Required")).toBeUndefined();
  });
});