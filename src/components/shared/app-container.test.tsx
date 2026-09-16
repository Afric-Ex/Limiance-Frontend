import React from "react";
(globalThis as any).React = React;
import { fireEvent, render, screen } from "@testing-library/react";
import { AppContainer } from "./app-container";

const pathnameMock = vi.hoisted(() => vi.fn(() => "/"));

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
}));

const footerRef = vi.hoisted(() => ({}));
vi.mock("./footer", () => ({
  Footer: () => {
    footerRef.count = (footerRef.count ?? 0) + 1;
    return <div data-testid="footer" />;
  },
}));

describe("AppContainer", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/");
    footerRef.count = 0;
  });

  it("renders children and the footer on public routes", () => {
    render(<AppContainer>content</AppContainer>);
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(footerRef.count).toBe(1);
  });

  it("hides the footer on no-footer routes", () => {
    pathnameMock.mockReturnValue("/dashboard");
    render(<AppContainer>content</AppContainer>);
    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
  });

  it("hides the footer for nested no-footer routes", () => {
    pathnameMock.mockReturnValue("/assets/spot");
    render(<AppContainer>content</AppContainer>);
    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
  });

  it("resets scroll to top when the pathname changes", () => {
    const { container, rerender } = render(<AppContainer>content</AppContainer>);
    const box = container.firstChild as HTMLElement;
    box.scrollTop = 250;
    pathnameMock.mockReturnValue("/market");
    rerender(<AppContainer>content</AppContainer>);
    expect(box.scrollTop).toBe(0);
  });

  it("scrolls to top when pathname is unchanged (mount)", () => {
    const { container } = render(<AppContainer>content</AppContainer>);
    expect((container.firstChild as HTMLElement).scrollTop).toBe(0);
  });

  it("does not scroll-to-top on empty ref (already scrolled)", () => {
    const { container } = render(<AppContainer>content</AppContainer>);
    const box = container.firstChild as HTMLElement;
    box.scrollTop = 100;
    fireEvent.scroll(box);
    expect(box.scrollTop).toBe(100);
  });
});