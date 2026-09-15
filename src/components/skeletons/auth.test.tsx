import React from "react";
(globalThis as any).React = React;
import { render } from "@testing-library/react";
import {
  AuthSplitSkeleton,
  AuthCardSkeleton,
  LoginPageSkeleton,
  SignUpPageSkeleton,
  SignUpProfilePageSkeleton,
  ForgotPasswordPageSkeleton,
  ResetPasswordPageSkeleton,
  VerifyEmailPageSkeleton,
  Verify2FAPageSkeleton,
  VerifyIdentityPageSkeleton,
  VerifyIdentityStartPageSkeleton,
  VerifyIdentityPendingPageSkeleton,
  AuthPageSkeleton,
} from "./auth";

function countSkeletons(ui: React.ReactElement) {
  const { container } = render(ui);
  return container.querySelectorAll(".skeleton").length;
}

describe("AuthSplitSkeleton", () => {
  it("renders illustration panel, title and forms", () => {
    const { container } = render(<AuthSplitSkeleton />);
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(countSkeletons(<AuthSplitSkeleton />)).toBe(12);
  });

  it("renders the requested number of fields", () => {
    expect(countSkeletons(<AuthSplitSkeleton fields={2} />)).toBe(
      3 + 2 * 2 + 1
    );
  });

  it("omits the submit button when withButton={false}", () => {
    expect(countSkeletons(<AuthSplitSkeleton withButton={false} />)).toBe(
      3 + 4 * 2
    );
  });
});

describe("AuthCardSkeleton", () => {
  it("renders a centered card form", () => {
    const { container } = render(<AuthCardSkeleton />);
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(countSkeletons(<AuthCardSkeleton />)).toBe(3 + 4 * 2);
  });

  it("renders six PIN box placeholders when pin is set", () => {
    const { container } = render(<AuthCardSkeleton pin />);
    const boxes = Array.from(
      container.querySelectorAll<HTMLElement>(".skeleton")
    ).filter((el) => el.style.width === "48px" && el.style.height === "56px");
    expect(boxes).toHaveLength(6);
  });

  it("hides the button when withButton={false}", () => {
    expect(countSkeletons(<AuthCardSkeleton fields={3} withButton={false} />)).toBe(
      2 + 3 * 2
    );
  });
});

describe("auth page skeletons", () => {
  it.each([
    ["LoginPageSkeleton", LoginPageSkeleton],
    ["SignUpPageSkeleton", SignUpPageSkeleton],
    ["SignUpProfilePageSkeleton", SignUpProfilePageSkeleton],
    ["ForgotPasswordPageSkeleton", ForgotPasswordPageSkeleton],
    ["ResetPasswordPageSkeleton", ResetPasswordPageSkeleton],
    ["VerifyEmailPageSkeleton", VerifyEmailPageSkeleton],
    ["Verify2FAPageSkeleton", Verify2FAPageSkeleton],
    ["VerifyIdentityPageSkeleton", VerifyIdentityPageSkeleton],
    ["VerifyIdentityStartPageSkeleton", VerifyIdentityStartPageSkeleton],
    ["VerifyIdentityPendingPageSkeleton", VerifyIdentityPendingPageSkeleton],
    ["AuthPageSkeleton", AuthPageSkeleton],
  ])("%s renders a page with skeletons", (_name, Component) => {
    const { container } = render(<Component />);
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });

  it("signup profile has more fields than login", () => {
    expect(
      countSkeletons(<SignUpProfilePageSkeleton />)
    ).toBeGreaterThan(countSkeletons(<LoginPageSkeleton />));
  });

  it("verify identity renders a large avatar circle", () => {
    const { container } = render(<VerifyIdentityPageSkeleton />);
    const circle = Array.from(
      container.querySelectorAll<HTMLElement>(".skeleton")
    ).find((el) => el.style.width === "140px");
    expect(circle).toBeInTheDocument();
  });
});