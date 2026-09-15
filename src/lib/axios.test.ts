import { api, apiRoot } from "./axios";
import { handleLogout } from "./handle-logout";

vi.mock("./handle-logout", () => ({
  handleLogout: vi.fn(),
}));

type MockConfig = { method?: string; url?: string; headers: Record<string, unknown> };
type InterceptorBag<T> = Array<{ fulfilled: (value: T) => T | Promise<T>; rejected: (error: unknown) => unknown }>;

const requestHandlers = (client: typeof api): InterceptorBag<MockConfig> =>
  (client.interceptors.request as unknown as { handlers: InterceptorBag<MockConfig> }).handlers;

const responseHandlers = (client: typeof api): InterceptorBag<unknown> =>
  (client.interceptors.response as unknown as { handlers: InterceptorBag<unknown> }).handlers;

describe("lib/axios", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    vi.mocked(handleLogout).mockClear();
  });

  it("creates two distinct axios instances with JSON content type", () => {
    for (const client of [api, apiRoot]) {
      expect(typeof client.request).toBe("function");
      expect(client.defaults.headers["Content-Type"]).toBe("application/json");
      expect(client.interceptors.request).toBeDefined();
      expect(client.interceptors.response).toBeDefined();
    }
    expect(api).not.toBe(apiRoot);
  });

  it("registers one request and one response interceptor on both instances", () => {
    for (const client of [api, apiRoot]) {
      expect(requestHandlers(client)).toHaveLength(1);
      expect(responseHandlers(client)).toHaveLength(1);
    }
  });

  it("attaches an Authorization header when localStorage holds a token", () => {
    localStorage.setItem("auth-token", "ls-token-123");

    for (const client of [api, apiRoot]) {
      const config: MockConfig = { method: "get", url: "/user", headers: {} };
      const result = requestHandlers(client)[0].fulfilled(config) as MockConfig;
      expect(result.headers.Authorization).toBe("Bearer ls-token-123");
    }
  });

  it("does not attach an Authorization header when there is no token", () => {
    for (const client of [api, apiRoot]) {
      const config: MockConfig = { method: "get", url: "/user", headers: {} };
      const result = requestHandlers(client)[0].fulfilled(config) as MockConfig;
      expect(result.headers.Authorization).toBeUndefined();
    }
  });

  it("ignores literal undefined and null localStorage tokens", () => {
    localStorage.setItem("auth-token", "undefined");
    const config = { method: "get", url: "/user", headers: {} };
    expect((requestHandlers(api)[0].fulfilled(config) as MockConfig).headers.Authorization).toBeUndefined();

    localStorage.setItem("auth-token", "null");
    expect((requestHandlers(api)[0].fulfilled(config) as MockConfig).headers.Authorization).toBeUndefined();
  });

  it("falls back to the auth-token cookie when localStorage is empty", () => {
    document.cookie = "auth-token=cookie-token-456; path=/";
    const config = { method: "get", url: "/user", headers: {} };
    const result = requestHandlers(api)[0].fulfilled(config) as MockConfig;
    expect(result.headers.Authorization).toBe("Bearer cookie-token-456");
  });

  it("gives localStorage precedence over the cookie", () => {
    document.cookie = "auth-token=cookie-token; path=/";
    localStorage.setItem("auth-token", "ls-token");
    const config = { method: "get", url: "/user", headers: {} };
    const result = requestHandlers(api)[0].fulfilled(config) as MockConfig;
    expect(result.headers.Authorization).toBe("Bearer ls-token");
  });

  it("decodes percent-encoded cookie tokens", () => {
    document.cookie = `auth-token=${encodeURIComponent("tok+1/abc")}; path=/`;
    const config = { method: "get", url: "/user", headers: {} };
    const result = requestHandlers(api)[0].fulfilled(config) as MockConfig;
    expect(result.headers.Authorization).toBe("Bearer tok+1/abc");
  });

  it("ignores literal undefined and null cookie tokens", () => {
    document.cookie = "auth-token=undefined; path=/";
    const config = { method: "get", url: "/user", headers: {} };
    expect((requestHandlers(api)[0].fulfilled(config) as MockConfig).headers.Authorization).toBeUndefined();

    document.cookie = "auth-token=null; path=/";
    expect((requestHandlers(api)[0].fulfilled(config) as MockConfig).headers.Authorization).toBeUndefined();
  });

  it("does not read the token from unrelated cookies", () => {
    document.cookie = "session=abc123; path=/";
    const config = { method: "get", url: "/user", headers: {} };
    expect((requestHandlers(api)[0].fulfilled(config) as MockConfig).headers.Authorization).toBeUndefined();
  });

  it("returns the response unchanged from the fulfilled response interceptor", () => {
    const response = { data: { ok: true }, status: 200 };
    expect(responseHandlers(api)[0].fulfilled(response)).toBe(response);
  });

  it("rejects on response errors and calls handleLogout", async () => {
    const error = { response: { status: 401, data: {} }, config: { url: "/user" } };
    for (const client of [api, apiRoot]) {
      await expect(responseHandlers(client)[0].rejected(error)).rejects.toBe(error);
    }
    expect(handleLogout).toHaveBeenCalledWith(error);
    expect(handleLogout).toHaveBeenCalledTimes(2);
  });

  it("rejects non-401 response errors and calls handleLogout as well", async () => {
    const error = { response: { status: 502 } };
    await expect(responseHandlers(api)[0].rejected(error)).rejects.toBe(error);
    expect(handleLogout).toHaveBeenCalledWith(error);
  });
});