import { useBalanceCloakStore } from "./balance-cloak-store";

describe("balance-cloak-store", () => {
  beforeEach(() => {
    localStorage.clear();
    useBalanceCloakStore.setState({ enabled: false });
  });

  it("has initial disabled state", () => {
    expect(useBalanceCloakStore.getState().enabled).toBe(false);
  });

  it("toggleCloak flips the flag", () => {
    useBalanceCloakStore.getState().toggleCloak();
    expect(useBalanceCloakStore.getState().enabled).toBe(true);
    useBalanceCloakStore.getState().toggleCloak();
    expect(useBalanceCloakStore.getState().enabled).toBe(false);
  });

  it("setEnabled sets the value directly", () => {
    useBalanceCloakStore.getState().setEnabled(true);
    expect(useBalanceCloakStore.getState().enabled).toBe(true);
    useBalanceCloakStore.getState().setEnabled(false);
    expect(useBalanceCloakStore.getState().enabled).toBe(false);
  });

  it("persists enabled under balance-cloak-enabled key", () => {
    useBalanceCloakStore.getState().setEnabled(true);

    const raw = localStorage.getItem("balance-cloak-enabled");
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string)?.state;
    expect(stored.enabled).toBe(true);
  });

  it("does not throw when localStorage is unavailable", () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => {
      useBalanceCloakStore.getState().setEnabled(true);
      expect(useBalanceCloakStore.getState().enabled).toBe(true);
    }).not.toThrow();

    setSpy.mockRestore();
    getSpy.mockRestore();
    localStorage.clear();
    useBalanceCloakStore.setState({ enabled: false });
  });
});
