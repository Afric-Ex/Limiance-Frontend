import axios, { InternalAxiosRequestConfig } from "axios";
import { handleLogout } from "./handle-logout";
import { authDebug } from "./auth-debug";
import { sanitizeUrl } from "./pii-policy";
import { sessionCoordinator } from "./session-coordinator";

const baseURL = process.env.NEXT_PUBLIC_API_URL;
const rootBaseURL = baseURL?.replace(/\/api\/v1\/?$/, "");

/**
 * Hard cap on every request the app makes. Axios defaults to no timeout, so a
 * backend that accepts the connection and then never answers leaves the caller
 * pending forever and spinners on screen indefinitely. At this point the request
 * is aborted and rejects like any other error, so `data` stays empty and the
 * caller's loading state ends. A per-request `timeout` still overrides this.
 */
export const REQUEST_TIMEOUT_MS = 30_000;

export const api = axios.create({
  baseURL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiRoot = axios.create({
  baseURL: rootBaseURL || baseURL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type SessionRequestConfig = InternalAxiosRequestConfig & {
  __sessionGeneration?: number;
  __sessionController?: AbortController;
};

const pendingControllers = new Set<AbortController>();

// Logout invalidates work that was started under the previous session. Axios
// will reject these requests as cancelled instead of allowing old responses to
// update stores or query caches after an account switch.
sessionCoordinator.subscribe(() => {
  pendingControllers.forEach((controller) => controller.abort());
  pendingControllers.clear();
});

const attachInterceptors = (client: typeof api) => {
  client.interceptors.request.use(
    (config) => {
      const sessionConfig = config as SessionRequestConfig;
      sessionConfig.__sessionGeneration = sessionCoordinator.getGeneration();
      if (typeof AbortController !== "undefined" && !config.signal) {
        const controller = new AbortController();
        sessionConfig.__sessionController = controller;
        config.signal = controller.signal;
        pendingControllers.add(controller);
      }
      authDebug("request-auth", {
        method: config.method,
        url: sanitizeUrl(config.url),
        credentialMode: "http-only-cookie",
      });
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response) => {
      const sessionConfig = response.config as SessionRequestConfig;
      if (sessionConfig.__sessionController) {
        pendingControllers.delete(sessionConfig.__sessionController);
      }
      if (sessionConfig.__sessionGeneration !== sessionCoordinator.getGeneration()) {
        const staleError = new Error("Stale session response discarded") as Error & {
          code?: string;
        };
        staleError.code = "ERR_SESSION_STALE";
        return Promise.reject(staleError);
      }
      return response;
    },
    (error) => {
      const sessionConfig = error?.config as SessionRequestConfig | undefined;
      if (sessionConfig?.__sessionController) {
        pendingControllers.delete(sessionConfig.__sessionController);
      }
      if (error?.code === "ERR_CANCELED" || error?.code === "ERR_SESSION_STALE") {
        return Promise.reject(error);
      }
      // Global error handling
      authDebug("response-error", {
        status: error?.response?.status,
        url: sanitizeUrl(error?.config?.url),
        responseKeys:
          error?.response?.data && typeof error.response.data === "object"
            ? Object.keys(error.response.data)
            : [],
        responseMessage: "[REDACTED]",
      });
      handleLogout(error);
      return Promise.reject(error);
    }
  );
};

attachInterceptors(api);
attachInterceptors(apiRoot);
