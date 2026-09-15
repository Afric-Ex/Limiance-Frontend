import React from "react";
(globalThis as any).React = React;
import { render } from "@testing-library/react";
import { Skeleton, SkeletonGroup } from "./skeleton";

describe("Skeleton", () => {
  it("renders a default rect", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("skeleton");
    expect(el).toHaveStyle({ width: "100%", height: "20px" });
  });

  it("renders text variant with defaults", () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.firstChild).toHaveStyle({ width: "80%", height: "14px" });
  });

  it("renders balance variant with two bars", () => {
    const { container } = render(<Skeleton variant="balance" />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(2);
  });

  it("renders circle variant with the requested size", () => {
    const { container } = render(<Skeleton variant="circle" size={40} />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveStyle({ width: "40px", height: "40px" });
  });

  it("renders chart variant with the requested height", () => {
    const { container } = render(<Skeleton variant="chart" height="200px" />);
    const inner = container.querySelector(".skeleton") as HTMLElement;
    expect(inner).toHaveStyle({ height: "200px" });
  });

  it("renders the requested number of table rows and columns", () => {
    const { container } = render(
      <Skeleton variant="table-row" count={3} columns={2} />
    );
    expect(container.querySelectorAll(".skeleton")).toHaveLength(6);
  });

  it("applies custom width/height and className for rect", () => {
    const { container } = render(
      <Skeleton width="50%" height="10px" className="custom" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveStyle({ width: "50%", height: "10px" });
    expect(el.className).toContain("custom");
  });
});

describe("SkeletonGroup", () => {
  it("renders children with fade-in", () => {
    const { container } = render(
      <SkeletonGroup>
        <Skeleton />
      </SkeletonGroup>
    );
    expect(container.firstChild?.classList.contains("animate-fade-in")).toBe(
      true
    );
  });
});