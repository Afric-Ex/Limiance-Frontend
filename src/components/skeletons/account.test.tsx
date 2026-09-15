import React from "react";
(globalThis as any).React = React;
import { render } from "@testing-library/react";
import {
  AccountSettingsSkeleton,
  AccountSecuritySkeleton,
  AccountProfileSkeleton,
  AccountPaymentMethodsSkeleton,
  AccountKycSkeleton,
  AccountApiKeysSkeleton,
  AccountCreateApiKeySkeleton,
  AccountPageSkeleton,
} from "./account";

function renderSkeleton(Component: React.ComponentType) {
  const view = render(<Component />);
  const container = view.container;
  const skeletonCount = container.querySelectorAll(".skeleton").length;
  return { view, container, skeletonCount };
}

describe("AccountSettingsSkeleton", () => {
  it("renders a page shell with a header and form fields", () => {
    const { container, skeletonCount } = renderSkeleton(
      AccountSettingsSkeleton
    );
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(skeletonCount).toBe(14);
  });
});

describe("AccountSecuritySkeleton", () => {
  it("renders header plus settings card and two table cards", () => {
    const { container, skeletonCount } = renderSkeleton(
      AccountSecuritySkeleton
    );
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(skeletonCount).toBe(64);
  });
});

describe("AccountProfileSkeleton", () => {
  it("renders an avatar circle sized for the profile layout", () => {
    const { container } = render(<AccountProfileSkeleton />);
    const circle = Array.from(
      container.querySelectorAll<HTMLElement>(".skeleton")
    ).find((el) => el.style.width === "96px");
    expect(circle).toBeInTheDocument();
  });
});

describe("AccountPaymentMethodsSkeleton", () => {
  it("renders a narrower page shell", () => {
    const { container } = render(<AccountPaymentMethodsSkeleton />);
    const main = container.querySelector("main") as HTMLElement;
    expect(main.className).toContain("max-w-3xl");
  });
});

describe("AccountKycSkeleton", () => {
  it("renders header plus identity card and document upload cards", () => {
    const { container, skeletonCount } = renderSkeleton(AccountKycSkeleton);
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(skeletonCount).toBe(14);
  });
});

describe("AccountApiKeysSkeleton", () => {
  it("renders a table-heavy page", () => {
    const { container, skeletonCount } = renderSkeleton(
      AccountApiKeysSkeleton
    );
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(skeletonCount).toBe(40);
  });
});

describe("AccountCreateApiKeySkeleton", () => {
  it("renders a form with a tall textarea field", () => {
    const { container } = render(<AccountCreateApiKeySkeleton />);
    const tall = Array.from(
      container.querySelectorAll<HTMLElement>(".skeleton")
    ).find((el) => el.style.height === "100px");
    expect(tall).toBeInTheDocument();
  });
});

describe("AccountPageSkeleton", () => {
  it("renders the generic fallback with header, card and table", () => {
    const { container, skeletonCount } = renderSkeleton(AccountPageSkeleton);
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(skeletonCount).toBe(22);
  });
});