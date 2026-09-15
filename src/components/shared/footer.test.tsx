import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { Footer } from "./footer";

const pathnameMock = vi.hoisted(() => vi.fn(() => "/"));

vi.mock("next/navigation", () => ({ usePathname: pathnameMock }));
vi.mock("next/image", () => ({
  default: (props: any) => <img src={props.src ?? ""} alt={props.alt ?? ""} />,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Footer", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/");
  });

  it("renders the brand, community and app sections on public routes", () => {
    render(<Footer />);
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Start Trading Now")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
    expect(screen.getByText("Scan to download the app")).toBeInTheDocument();
  });

  it("renders the current year in the copyright", () => {
    render(<Footer />);
    expect(
      screen.getByText(new RegExp(String(new Date().getFullYear())))
    ).toBeInTheDocument();
  });

  it("renders footer link groups", () => {
    render(<Footer />);
    expect(screen.getAllByText("About Us").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Service").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Product").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Support").length).toBeGreaterThan(0);
  });

  it("renders the language and currency controls", () => {
    render(<Footer />);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("USD-$")).toBeInTheDocument();
  });

  it("returns null on the dashboard route", () => {
    pathnameMock.mockReturnValue("/dashboard");
    const { container } = render(<Footer />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null on auth routes", () => {
    pathnameMock.mockReturnValue("/auth/login");
    const { container } = render(<Footer />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null on no-footer inner routes", () => {
    pathnameMock.mockReturnValue("/assets/spot");
    const { container } = render(<Footer />);
    expect(container.firstChild).toBeNull();
  });
});