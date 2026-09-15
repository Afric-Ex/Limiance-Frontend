import React from "react";
(globalThis as any).React = React;
import { render } from "@testing-library/react";
import { UserInitializer } from "./user-initializer";

const state = vi.hoisted(() => ({ fetchUser: vi.fn() }));

vi.mock("@/src/stores/user-store", () => ({
  useUserStore: (selector: (s: typeof state) => unknown) => selector(state),
}));

describe("UserInitializer", () => {
  beforeEach(() => {
    state.fetchUser.mockClear();
  });

  it("calls fetchUser once on mount and renders nothing", () => {
    const { container } = render(<UserInitializer />);
    expect(state.fetchUser).toHaveBeenCalledTimes(1);
    expect(container.firstChild).toBeNull();
  });

  it("does not refetch on re-render", () => {
    const { rerender } = render(<UserInitializer />);
    rerender(<UserInitializer />);
    expect(state.fetchUser).toHaveBeenCalledTimes(1);
  });
});