import { redactDiagnostic } from "./pii-policy";

const tokenKeyPattern = /(access|auth|token|jwt|refresh|session|captcha|pass|verify)/i;

export const isAuthDebugEnabled = () => {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_AUTH_DEBUG === "1";
};

export const authDebug = (event: string, details: Record<string, unknown>) => {
  if (isAuthDebugEnabled()) {
    console.info(`[auth-debug] ${event}`, redactDiagnostic(details));
  }
};

const describeValue = (value: unknown) => {
  if (typeof value !== "string") {
    return { type: typeof value };
  }
  return {
    type: "string",
    length: value.length,
    looksJwt: value.split(".").length === 3,
  };
};

export const describeAuthPayload = (payload: unknown) => {
  const fields: Record<string, unknown>[] = [];
  const visit = (value: unknown, path: string, depth: number) => {
    if (!value || typeof value !== "object" || depth > 4) return;
    for (const [key, nested] of Object.entries(value)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (tokenKeyPattern.test(key)) {
        fields.push({ path: nextPath, ...describeValue(nested) });
      }
      visit(nested, nextPath, depth + 1);
    }
  };

  visit(payload, "", 0);
  return {
    topLevelKeys:
      payload && typeof payload === "object" ? Object.keys(payload) : [],
    tokenLikeFields: fields,
  };
};
