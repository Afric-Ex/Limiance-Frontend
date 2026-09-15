import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { WithImageBorder } from "./with-image-border";

vi.mock("next/image", () => ({
  default: (props: any) => <img src={props.src ?? ""} alt={props.alt ?? ""} />,
}));

describe("WithImageBorder", () => {
  it("renders children above a border image", () => {
    render(
      <WithImageBorder>
        <span>content</span>
      </WithImageBorder>
    );
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByAltText("margin bottom")).toBeInTheDocument();
  });
});