import { auth } from "../services/auth";
import { errorNotification, successNotification } from "./notification-handler";
import { handleLogout } from "./handle-logout";

export type ErrorType = {
  response?: {
    data?: {
      data?: { errors?: any };
      message: any;
      error?: any | string[];
      errors?: any;
    };
    config?: { data: any };
    status: number;
  };
  message: string;
  /** Axios sets this when the request is aborted by the timeout in src/lib/axios.ts. */
  code?: string;
};
export const errorMessageHandler = (obj: ErrorType) => {
  const formatErrorString = (errStr: string): string => {
    if (typeof errStr !== "string") return String(errStr);
    if (errStr.includes("Error:Field validation for")) {
      const lines = errStr.split("\\n");
      const formatted = lines.map((line) => {
        const match = line.match(
          /validation for '([^']+)' failed on the '([^']+)' tag/i
        );
        if (match) {
          const field = match[1].replace(/([A-Z])/g, " $1").trim();
          const tag = match[2];
          if (tag === "required") return field + " is required.";
          if (tag === "min") return field + " is too short.";
          if (tag === "max") return field + " is too long.";
          if (tag === "email")
            return "Please enter a valid " + field.toLowerCase() + ".";
          if (tag === "eqfield") return field + " does not match.";
          return "Invalid " + field + ".";
        }
        return line;
      });
      return formatted.join(" ");
    }
    return errStr;
  };

  const notifyError = (msg: any) => {
    if (typeof msg === "string") {
      errorNotification(formatErrorString(msg));
    } else {
      errorNotification(String(msg));
    }
  };
  // A timed-out request never reaches the server, so it has no response body to
  // describe. Report it in plain language rather than leaking axios's
  // "timeout of 30000ms exceeded" string at the user.
  if (obj.code === "ECONNABORTED" || obj.code === "ETIMEDOUT") {
    return notifyError("The request timed out. Please check your connection and try again.");
  }
  if (obj.response) {
    if (obj.response.status === 401) {
      if (
        obj.response.data?.error ===
        "Account is not verified, resend verification code"
      ) {
        if (obj.response.config?.data) {
          const requestData = JSON.parse(obj.response.config?.data);

          const resendEmail = async () => {
            try {
              const res: any = await auth.forgotPassword({
                email: requestData?.emailOrPhone,
              });
              const tempToken = res?.data?.accessToken;
              if (typeof window !== "undefined" && tempToken) {
                sessionStorage.setItem("verify-token", tempToken);
              }
              successNotification("OTP has been resent to your mail");
              location.href = "/auth/verify-email";
            } catch (error) {
              errorMessageHandler(error as any);
            }
          };
          resendEmail();
        }
      } else {
        handleLogout(obj);
      }
    }
    if (obj.response.status === 500) {
      return notifyError(obj?.response?.data?.message ?? "Internal Server Error");
    }
    if (obj.response.status === 404) {
      const error = obj.response?.data?.error;
      return notifyError(
        error ?? "Page not found, Please contact the site administrator"
      );
    }
    const errorMessage = (obj as any)?.response?.data?.non_field_errors;
    if (errorMessage) {
      (errorMessage as string[]).forEach((item) => notifyError(item));
      return;
    }
    if (Array.isArray(obj?.response?.data)) {
      obj.response.data.forEach((item) => {
        if (typeof item === "string") {
          notifyError(item);
        }
      });
    }
    if (obj?.response?.data?.data?.errors) {
      const dataErrors = obj?.response?.data?.data?.errors;
      if (typeof dataErrors === "object") {
        Object.entries(dataErrors)?.forEach(([, v]) => {
          if (typeof v === "string") notifyError(v);
          else if (Array.isArray(v)) {
            v?.forEach((el) => {
              if (typeof el === "string") {
                notifyError(el);
              } else if (typeof el === "object" && !Array.isArray(el)) {
                Object.entries(el).forEach(([key, val]) => {
                  if (key === "message") {
                    if (typeof val === "string") {
                      notifyError(val);
                    }
                  }
                });
              }
            });
          }
        });
      }
      if (typeof dataErrors === "string") notifyError(dataErrors);
    } else if (obj?.response?.data?.data) {
      const errorData = obj?.response?.data?.data;
      if (typeof errorData === "string") {
        notifyError(errorData);
        return;
      }
      Object.entries(errorData).map(([, v]) => {
        if (Array.isArray(v)) {
          v.forEach((el: string) => notifyError(el));
        } else notifyError(v as string);
      });
    } else if (obj?.response?.data?.error) {
      if (
        typeof obj.response.data.error === "string" &&
        obj.response.data.message
      ) {
        return notifyError(String(obj.response.data.message));
      }
      if (typeof obj.response.data.error === "string") {
        return notifyError(obj.response.data.error);
      }
      if (Array.isArray(obj.response.data.error))
        return notifyError(String(obj.response.data.error));
      Object.entries(obj.response.data.error).map((item: any[]) => {
        if (item[1].length > 1) {
          item[1].forEach((el: any) => {
            if (typeof el === "string") {
              notifyError(el);
            } else if (typeof el === "object") {
              Object.entries(el).map((item: any[]) => {
                notifyError(item[1]);
              });
            }
          });
        } else {
          notifyError(item[1]);
        }
      });
    } else if (obj?.response?.data?.errors) {
      const errors = obj?.response?.data?.errors;
      if (typeof errors === "object") {
        Object.entries(errors)?.forEach(([, v]) => {
          if (typeof v === "string") notifyError(v);
          else if (Array.isArray(v)) {
            v?.forEach((el) => {
              if (typeof el === "string") {
                notifyError(el);
              } else if (typeof el === "object" && !Array.isArray(el)) {
                Object.entries(el).forEach(([key, val]) => {
                  if (key === "message") {
                    if (typeof val === "string") {
                      notifyError(val);
                    }
                  }
                });
              }
            });
          }
        });
      }
      if (typeof errors === "string") notifyError(errors);
    } else if (obj?.response?.data?.message) {
      notifyError(obj?.response?.data?.message);
    }
  } else notifyError(obj.message);
};
