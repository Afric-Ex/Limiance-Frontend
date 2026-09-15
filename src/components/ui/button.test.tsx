import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders children with default type button", () => {
    render(<Button>Submit</Button>);
    const btn = screen.getByRole("button", { name: "Submit" });
    expect(btn).toHaveAttribute("type", "button");
  });

  it("honours an explicit type", () => {
    render(<Button type="submit">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute(
      "type",
      "submit"
    );
  });

  it("applies variant, size classes and disabled state", () => {
    render(
      <Button variant="sell" size="small" disabled>
        X
      </Button>
    );
    const btn = screen.getByRole("button", { name: "X" });
    expect(btn.className).toContain("bg-sell");
    expect(btn.className).toContain("h-8 px-3 text-xs");
    expect(btn).toBeDisabled();
  });

  it("small and compact sizes do not expand full width", () => {
    const small = render(<Button size="small">S</Button>).getByRole("button", {
      name: "S",
    });
    const compact = render(<Button size="compact">C</Button>).getByRole(
      "button",
      { name: "C" }
    );
    expect(small.className).not.toContain("w-full");
    expect(compact.className).not.toContain("w-full");
  });

  it("primary and secondary sizes expand full width", () => {
    const primary = render(<Button>P</Button>).getByRole("button", {
      name: "P",
    });
    const secondary = render(<Button size="secondary">S</Button>).getByRole(
      "button",
      { name: "S" }
    );
    expect(primary.className).toContain("w-full");
    expect(secondary.className).toContain("w-full");
  });

  it("merges a custom className", () => {
    render(<Button className="custom-cls">C</Button>);
    expect(screen.getByRole("button").className).toContain("custom-cls");
  });

  it("spreads arbitrary attributes", () => {
    render(<Button aria-label="custom" title="tooltip">T</Button>);
    expect(screen.getByRole("button", { name: "custom" })).toHaveAttribute(
      "title",
      "tooltip"
    );
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Click" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});