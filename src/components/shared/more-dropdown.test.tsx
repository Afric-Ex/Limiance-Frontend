import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { MoreDropdown } from "./more-dropdown";

describe("MoreDropdown", () => {
  it("renders all more options", () => {
    render(<MoreDropdown />);
    for (const title of [
      "Vip & Institution",
      "Launchpool",
      "Pay",
      "Loans",
      "NFT",
      "Web3Wallet",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("renders the NEW badge", () => {
    render(<MoreDropdown />);
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("renders subtitles", () => {
    render(<MoreDropdown />);
    expect(screen.getByText("Send, receive and spend crypto")).toBeInTheDocument();
  });
});