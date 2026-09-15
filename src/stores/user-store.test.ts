import { useUserStore } from "./user-store";
import { userService } from "../services/user";
import { errorMessageHandler } from "../lib/error-handler";

vi.mock("../services/user", () => ({
  userService: { getUser: vi.fn() },
}));

vi.mock("../lib/error-handler", () => ({
  errorMessageHandler: vi.fn(),
}));

describe("user-store", () => {
  const baseUser = {
    id: "u-1",
    email: "user@limiance.io",
    phone: "+1-555-0100",
    firstName: "Jane",
    lastName: "Doe",
    country: "US",
    username: "janedoe",
    photo: "",
    isActive: true,
    isIDverified: false,
    isFuturesAccepted: false,
    twoFaEnabled: false,
    isVerified: false,
  };

  beforeEach(() => {
    localStorage.clear();
    useUserStore.setState({
      user: null,
      hideBalance: false,
      selectedCoinsHistory: [],
      loading: false,
      error: null,
    });
    vi.mocked(userService.getUser).mockReset();
    vi.mocked(errorMessageHandler).mockClear();
  });

  it("has the initial state values", () => {
    const state = useUserStore.getState();
    expect(state.user).toBeNull();
    expect(state.hideBalance).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.selectedCoinsHistory).toEqual([]);
  });

  it("setUser stores the user object", () => {
    useUserStore.getState().setUser(baseUser);
    expect(useUserStore.getState().user).toEqual(baseUser);
    useUserStore.getState().setUser(null as never);
    expect(useUserStore.getState().user).toBeNull();
  });

  it("setHideBalance toggles the flag", () => {
    useUserStore.getState().setHideBalance(true);
    expect(useUserStore.getState().hideBalance).toBe(true);
    useUserStore.getState().setHideBalance(false);
    expect(useUserStore.getState().hideBalance).toBe(false);
  });

  it("setSelectedCoinsHistory stores the array and handles empty arrays", () => {
    useUserStore.getState().setSelectedCoinsHistory(["BTC", "ETH"]);
    expect(useUserStore.getState().selectedCoinsHistory).toEqual(["BTC", "ETH"]);
    useUserStore.getState().setSelectedCoinsHistory([]);
    expect(useUserStore.getState().selectedCoinsHistory).toEqual([]);
  });

  it("fetchUser sets loading true while pending and false when done", async () => {
    let resolveGetUser: (value: { data: object }) => void;
    vi.mocked(userService.getUser).mockImplementation(
      () => new Promise((resolve) => { resolveGetUser = resolve; })
    );
    useUserStore.getState().setUser(baseUser);

    const promise = useUserStore.getState().fetchUser();
    expect(useUserStore.getState().loading).toBe(true);
    expect(useUserStore.getState().error).toBeNull();

    resolveGetUser({ data: { username: "updated-user" } });
    await promise;

    const state = useUserStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.user).toEqual({ ...baseUser, username: "updated-user" });
  });

  it("fetchUser merges incoming data with the existing user profile", async () => {
    useUserStore.getState().setUser(baseUser);
    vi.mocked(userService.getUser).mockResolvedValue({
      data: { firstName: "Janet", isIDverified: true },
    });

    await useUserStore.getState().fetchUser();

    const user = useUserStore.getState().user;
    expect(user?.id).toBe("u-1");
    expect(user?.firstName).toBe("Janet");
    expect(user?.isIDverified).toBe(true);
    expect(useUserStore.getState().loading).toBe(false);
  });

  it("fetchUser leaves the user untouched when the response has no data", async () => {
    useUserStore.getState().setUser(baseUser);
    vi.mocked(userService.getUser).mockResolvedValue({ data: undefined });

    await useUserStore.getState().fetchUser();

    expect(useUserStore.getState().user).toEqual(baseUser);
    expect(useUserStore.getState().loading).toBe(false);
    expect(useUserStore.getState().error).toBeNull();
  });

  it("fetchUser suppresses 500 Unimplemented errors without calling errorMessageHandler", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(userService.getUser).mockRejectedValue({
      response: { status: 500, data: { error: "Unimplemented: /user not live yet" } },
    });

    await useUserStore.getState().fetchUser();

    const state = useUserStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBe("Failed to fetch user");
    expect(errorMessageHandler).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("Suppressing unimplemented /user backend error");
    warnSpy.mockRestore();
  });

  it("fetchUser calls errorMessageHandler and records the error for other failures", async () => {
    const boom = { message: "Network error", response: { status: 503 } };
    vi.mocked(userService.getUser).mockRejectedValue(boom);

    await useUserStore.getState().fetchUser();

    const state = useUserStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBe("Failed to fetch user");
    expect(errorMessageHandler).toHaveBeenCalledWith(boom);
  });

  it("persists user, hideBalance, and selectedCoinsHistory under the user-store key", () => {
    useUserStore.getState().setUser(baseUser);
    useUserStore.getState().setHideBalance(true);
    useUserStore.getState().setSelectedCoinsHistory(["BTC"]);

    const raw = localStorage.getItem("user-store");
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string)?.state;
    expect(stored.user).toEqual(baseUser);
    expect(stored.hideBalance).toBe(true);
    expect(stored.selectedCoinsHistory).toEqual(["BTC"]);
  });

  it("does not persist volatile loading or error state", () => {
    useUserStore.getState().setUser(baseUser);
    const raw = localStorage.getItem("user-store");
    const stored = JSON.parse(raw as string)?.state;
    expect(stored.loading).toBeUndefined();
    expect(stored.error).toBeUndefined();
  });
});