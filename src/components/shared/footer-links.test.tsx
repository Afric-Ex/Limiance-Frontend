import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { FooterLinks } from "./footer-links";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("FooterLinks", () => {
  it("renders every footer group", () => {
    render(<FooterLinks />);
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("renders nested sub lists", () => {
    render(<FooterLinks />);
    expect(screen.getByText("Learn")).toBeInTheDocument();
    expect(screen.getByText("Crypto Calculator")).toBeInTheDocument();
    expect(screen.getAllByText("Buy Crypto").length).toBeGreaterThan(0);
  });

  it("links the support entry", () => {
    render(<FooterLinks />);
    const support = screen.getByText("Support Center").closest("a");
    expect(support).toHaveAttribute("href", "/support");
  });
});