import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { BalanceCloak } from "./balance-cloak";
import { useUserStore } from "@/src/stores/user-store";

describe("BalanceCloak", () => {
  beforeEach(() => {
    useUserStore.setState({ hideBalance: false });
  });

  it("formats the balance when visible", () => {
    useUserStore.setState({ hideBalance: false });
    render(<BalanceCloak balance={1250.5} />);
    expect(screen.getByText("1,250.5")).toBeInTheDocument();
  });

  it("clamps undefined balance to 0", () => {
    useUserStore.setState({ hideBalance: false });
    render(<BalanceCloak balance={undefined} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("clamps null balance to 0", () => {
    useUserStore.setState({ hideBalance: false });
    render(<BalanceCloak balance={null} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders asterisks when hidden", () => {
    useUserStore.setState({ hideBalance: true });
    render(<BalanceCloak balance={5000} />);
    expect(screen.getByText("****")).toBeInTheDocument();
  });
});