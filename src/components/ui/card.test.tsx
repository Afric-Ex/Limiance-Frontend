import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Hello Card</Card>);
    expect(screen.getByText("Hello Card")).toBeInTheDocument();
  });

  it("renders title and actions", () => {
    render(
      <Card title="Balance" actions={<span>action</span>}>
        body
      </Card>
    );
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("action")).toBeInTheDocument();
  });

  it("does not render header when no title or actions", () => {
    const { container } = render(<Card>body</Card>);
    expect(container.querySelector(".mb-4")).not.toBeInTheDocument();
  });

  it("applies padding classes", () => {
    const box = render(<Card padding="sm">x</Card>).getByText("x");
    expect(box.className).toContain("p-4");
    expect(box.className).toContain("bg-elevated");
    expect(box.className).toContain("rounded-xl");
  });

  it("omits padding when padding is none", () => {
    const box = render(<Card padding="none">x</Card>).getByText("x");
    expect(box.className).not.toContain("p-4");
    expect(box.className).not.toContain("p-6");
  });

  it("applies explicit class name", () => {
    render(<Card className="custom">x</Card>);
    expect(screen.getByText("x").className).toContain("custom");
  });

  it("spreads DOM attributes", () => {
    render(<Card data-testid="card">x</Card>);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });
});