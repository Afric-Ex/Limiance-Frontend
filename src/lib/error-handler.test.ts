import { errorMessageHandler } from "./error-handler";
import { auth } from "../services/auth";
import { errorNotification, successNotification } from "./notification-handler";
import { handleLogout } from "./handle-logout";

vi.mock("../services/auth", () => ({
  auth: {
    forgotPassword: vi.fn(),
  },
}));

vi.mock("./notification-handler", () => ({
  errorNotification: vi.fn(),
  successNotification: vi.fn(),
}));

vi.mock("./handle-logout", () => ({
  handleLogout: vi.fn(),
}));

const RESEND_ERROR = "Account is not verified, resend verification code";

const makeError = (overrides: Record<string, unknown> = {}): any => ({
  message: "Request failed with status code 400",
  ...overrides,
});

describe("errorMessageHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("notifies the plain message when there is no response object", () => {
    errorMessageHandler(makeError({ message: "Network Error" }));
    expect(errorNotification).toHaveBeenCalledWith("Network Error");
  });

  it("stringifies non-string error messages", () => {
    errorMessageHandler(makeError({ message: 123 }));
    expect(errorNotification).toHaveBeenCalledWith("123");
  });

  it("leaves messages without Go validation markers untouched", () => {
    errorMessageHandler(makeError({ message: "Some backend error" }));
    expect(errorNotification).toHaveBeenCalledWith("Some backend error");
  });

  it("formats a Go required-field validation error", () => {
    errorMessageHandler(
      makeError({
        message: "Error:Field validation for 'Email' failed on the 'required' tag",
      })
    );
    expect(errorNotification).toHaveBeenCalledWith("Email is required.");
  });

  it("splits decorated field names on capital letters", () => {
    errorMessageHandler(
      makeError({
        message: "Error:Field validation for 'FirstName' failed on the 'required' tag",
      })
    );
    expect(errorNotification).toHaveBeenCalledWith("First Name is required.");
  });

  it("formats min, max, email, eqfield and unknown tags", () => {
    errorMessageHandler(
      makeError({
        message: "Error:Field validation for 'Password' failed on the 'min' tag",
      })
    );
    expect(errorNotification).toHaveBeenCalledWith("Password is too short.");

    errorMessageHandler(
      makeError({
        message: "Error:Field validation for 'Bio' failed on the 'max' tag",
      })
    );
    expect(errorNotification).toHaveBeenCalledWith("Bio is too long.");

    errorMessageHandler(
      makeError({
        message: "Error:Field validation for 'Email' failed on the 'email' tag",
      })
    );
    expect(errorNotification).toHaveBeenCalledWith("Please enter a valid email.");

    errorMessageHandler(
      makeError({
        message: "Error:Field validation for 'PasswordConfirm' failed on the 'eqfield' tag",
      })
    );
    expect(errorNotification).toHaveBeenCalledWith("Password Confirm does not match.");

    errorMessageHandler(
      makeError({
        message: "Error:Field validation for 'Amount' failed on the 'gte' tag",
      })
    );
    expect(errorNotification).toHaveBeenCalledWith("Invalid Amount.");
  });

  it("formats multiple validation errors separated by literal backslash-n", () => {
    const message =
      "Error:Field validation for 'Email' failed on the 'required' tag\\nError:Field validation for 'Password' failed on the 'min' tag";
    errorMessageHandler(makeError({ message }));
    expect(errorNotification).toHaveBeenCalledWith(
      "Email is required. Password is too short."
    );
  });

  it("keeps non-matching lines unchanged while formatting matched lines", () => {
    const message =
      "Error:Field validation for 'Email' failed on the 'required' tag\\nSome unrelated line";
    errorMessageHandler(makeError({ message }));
    expect(errorNotification).toHaveBeenCalledWith(
      "Email is required. Some unrelated line"
    );
  });

  it("calls handleLogout for a generic 401 response", () => {
    const err = makeError({
      response: { status: 401, data: { error: "Session expired" } },
    });
    errorMessageHandler(err);
    expect(handleLogout).toHaveBeenCalledWith(err);
  });

  it("does not log the user out for the verification resend 401 error", () => {
    const locationMock: any = { href: "" };
    vi.stubGlobal("location", locationMock);
    const err = makeError({
      response: {
        status: 401,
        config: { data: JSON.stringify({ emailOrPhone: "user@example.com" }) },
        data: { error: RESEND_ERROR },
      },
    });
    (auth.forgotPassword as any).mockResolvedValue({ data: { accessToken: "tok" } });
    errorMessageHandler(err);
    expect(handleLogout).not.toHaveBeenCalled();
  });

  it("resends the verification email with the email from the failed request", async () => {
    const locationMock: any = { href: "" };
    vi.stubGlobal("location", locationMock);
    const err = makeError({
      response: {
        status: 401,
        config: { data: JSON.stringify({ emailOrPhone: "user@example.com" }) },
        data: { error: RESEND_ERROR },
      },
    });
    (auth.forgotPassword as any).mockResolvedValue({ data: { accessToken: "tok" } });
    errorMessageHandler(err);
    expect(auth.forgotPassword).toHaveBeenCalledWith({
      email: "user@example.com",
    });
    await vi.waitFor(() => {
      expect(successNotification).toHaveBeenCalledWith("OTP has been resent to your mail");
    });
    expect(sessionStorage.getItem("verify-token")).toBe("tok");
    expect(locationMock.href).toBe("/auth/verify-email");
  });

  it("does not attempt a resend when config data is missing", () => {
    const err = makeError({
      response: { status: 401, data: { error: RESEND_ERROR } },
    });
    errorMessageHandler(err);
    expect(auth.forgotPassword).not.toHaveBeenCalled();
    expect(handleLogout).not.toHaveBeenCalled();
  });

  it("forwards resend failures to the error notification", async () => {
    const err = makeError({
      response: {
        status: 401,
        config: { data: JSON.stringify({ emailOrPhone: "user@example.com" }) },
        data: { error: RESEND_ERROR },
      },
    });
    (auth.forgotPassword as any).mockRejectedValue(new Error("resend failed"));
    errorMessageHandler(err);
    await vi.waitFor(() => {
      expect(errorNotification).toHaveBeenCalledWith("resend failed");
    });
  });

  it("throws when the resend request payload is not valid JSON", () => {
    const err = makeError({
      response: {
        status: 401,
        config: { data: "not-json" },
        data: { error: RESEND_ERROR },
      },
    });
    expect(() => errorMessageHandler(err)).toThrow(SyntaxError);
  });

  it("notifies the response message on a 500 error", () => {
    const err = makeError({
      response: { status: 500, data: { message: "Internal Server Error boom" } },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("Internal Server Error boom");
  });

  it("falls back to a default message on a 500 error without a message", () => {
    const err = makeError({ response: { status: 500, data: {} } });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("Internal Server Error");
  });

  it("notifies the provided error on a 404", () => {
    const err = makeError({
      response: { status: 404, data: { error: "Wallet not found" } },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("Wallet not found");
  });

  it("falls back to a default message on a 404 without an error", () => {
    const err = makeError({ response: { status: 404, data: {} } });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith(
      "Page not found, Please contact the site administrator"
    );
  });

  it("notifies every entry in non_field_errors", () => {
    const err = makeError({
      response: {
        status: 400,
        data: { non_field_errors: ["Invalid credentials", "Please retry"] },
      },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("Invalid credentials");
    expect(errorNotification).toHaveBeenCalledWith("Please retry");
  });

  it("notifies string entries in an array response body only", () => {
    const err = makeError({
      response: { status: 400, data: ["plain error", 42, null, { x: 1 }] },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("plain error");
    expect(errorNotification).not.toHaveBeenCalledWith("42");
    expect(errorNotification).not.toHaveBeenCalledWith(String({ x: 1 }));
  });

  it("notifies nested data.errors values including messages inside objects", () => {
    const err = makeError({
      response: {
        status: 400,
        data: {
          data: {
            errors: {
              email: ["Email is taken"],
              username: "Username already taken",
              field: [{ message: "Nested message" }],
            },
          },
        },
      },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("Email is taken");
    expect(errorNotification).toHaveBeenCalledWith("Username already taken");
    expect(errorNotification).toHaveBeenCalledWith("Nested message");
  });

  it("notifies a string nested data.errors value", () => {
    const err = makeError({
      response: { status: 400, data: { data: { errors: "flat nested error" } } },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("flat nested error");
  });

  it("notifies a nested data.data string", () => {
    const err = makeError({
      response: { status: 400, data: { data: "just a data string" } },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("just a data string");
  });

  it("notifies entries of a nested data.data object", () => {
    const err = makeError({
      response: {
        status: 400,
        data: { data: { email: ["email error", "second email error"], name: "name error" } },
      },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("email error");
    expect(errorNotification).toHaveBeenCalledWith("second email error");
    expect(errorNotification).toHaveBeenCalledWith("name error");
  });

  it("prefers the response message when a 400 error also carries a message", () => {
    const err = makeError({
      response: { status: 400, data: { error: "raw detail", message: "Friendly message" } },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("Friendly message");
  });

  it("notifies the raw string error when no message is present", () => {
    const err = makeError({
      response: { status: 400, data: { error: "raw detail" } },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("raw detail");
  });

  it("stringifies an array error body", () => {
    const err = makeError({
      response: { status: 400, data: { error: ["first", "second"] } },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("first,second");
  });

  it("notifies every message inside an object error", () => {
    const err = makeError({
      response: {
        status: 400,
        data: { error: { field: [{ detail: "detail one" }, { detail: "detail two" }] } },
      },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("detail one");
    expect(errorNotification).toHaveBeenCalledWith("detail two");
  });

  it("notifies top-level data.errors values", () => {
    const err = makeError({
      response: {
        status: 400,
        data: { errors: { email: ["Invalid email", "Try again"] } },
      },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("Invalid email");
    expect(errorNotification).toHaveBeenCalledWith("Try again");
  });

  it("notifies a string top-level data.errors value", () => {
    const err = makeError({
      response: { status: 400, data: { errors: "flat top-level error" } },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("flat top-level error");
  });

  it("notifies the top-level data.message", () => {
    const err = makeError({
      response: { status: 400, data: { message: "top-level message" } },
    });
    errorMessageHandler(err);
    expect(errorNotification).toHaveBeenCalledWith("top-level message");
  });
});