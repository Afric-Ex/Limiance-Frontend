import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { PageSuspense } from "./page-suspense";

describe("PageSuspense", () => {
  it("renders children with the given className", () => {
    const { container } = render(
      <PageSuspense fallback={<span>loading</span>} className="page-cls">
        <span>loaded</span>
      </PageSuspense>
    );
    expect(screen.getByText("loaded")).toBeInTheDocument();
    expect(container.querySelector(".page-cls")).toBeInTheDocument();
  });

  it("renders the fallback while suspended", () => {
    const Never = () => {
      throw new Promise(() => {});
    };
    render(
      <PageSuspense fallback={<span>loading</span>}>
        <Never />
      </PageSuspense>
    );
    expect(screen.getByText("loading")).toBeInTheDocument();
  });
});