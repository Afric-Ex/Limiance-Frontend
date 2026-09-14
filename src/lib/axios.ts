import axios from "axios";
import { handleLogout } from "./handle-logout";
import { authDebug } from "./auth-debug";

const baseURL = process.env.NEXT_PUBLIC_API_URL;
const rootBaseURL = baseURL?.replace(/\/api\/v1\/?$/, "");

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiRoot = axios.create({
  baseURL: rootBaseURL || baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

/** Get auth token — localStorage first (reliable), then cookie (for SSR fallback) */
function getAuthToken(): string | null {
  // Try localStorage first — most reliable in browser
  if (typeof localStorage !== "undefined") {
    const lsToken = localStorage.getItem("auth-token");
    if (lsToken && lsToken !== "undefined" && lsToken !== "null") return lsToken;
  }
  // Fallback to document.cookie
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
  const cookieToken = match ? decodeURIComponent(match[1]) : null;
  return cookieToken && cookieToken !== "undefined" && cookieToken !== "null"
    ? cookieToken
    : null;
}

const attachInterceptors = (client: typeof api) => {
  client.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      authDebug("request-auth", {
        method: config.method,
        url: config.url,
        authHeaderAttached: Boolean(token),
        tokenLength: token?.length ?? 0,
      });
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Global error handling
      authDebug("response-error", {
        status: error?.response?.status,
        url: error?.config?.url,
        responseKeys:
          error?.response?.data && typeof error.response.data === "object"
            ? Object.keys(error.response.data)
            : [],
        responseMessage:
          typeof error?.response?.data?.message === "string"
            ? error.response.data.message
            : typeof error?.response?.data?.error === "string"
              ? error.response.data.error
              : null,
        authTokenPresent: Boolean(getAuthToken()),
      });
      handleLogout(error);
      return Promise.reject(error);
    }
  );
};

attachInterceptors(api);
attachInterceptors(apiRoot);
