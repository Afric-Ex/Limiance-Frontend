import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import Logo from "./logo";
import { useUserStore } from "@/src/stores/user-store";

vi.mock("next/image", () => ({
  default: (props: any) => (
    <img
      src={props.src ?? ""}
      alt={props.alt ?? ""}
      className={props.className}
    />
  ),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("Logo", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null });
  });

  it("links to / when logged out", () => {
    render(<Logo />);
    expect(screen.getByAltText("Limiance").closest("a")).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("links to /dashboard when logged in", () => {
    useUserStore.setState({ user: { id: 1 } as any });
    render(<Logo />);
    expect(screen.getByAltText("Limiance").closest("a")).toHaveAttribute(
      "href",
      "/dashboard"
    );
  });

  it("applies custom image classes and calls onClick", () => {
    const onClick = vi.fn();
    render(<Logo imageClasses="logo-cls" onClick={onClick} />);
    const img = screen.getByAltText("Limiance");
    expect(img.className).toContain("logo-cls");
    fireEvent.click(img.closest("a") as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});