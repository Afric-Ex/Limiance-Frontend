import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { UserAvatar } from "./user-avatar";
import { useUserStore } from "@/src/stores/user-store";

describe("UserAvatar", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null });
  });

  it("renders the generated avatar when no photo is set", () => {
    useUserStore.setState({
      user: { id: 7, username: "alice", email: "a@b.com" } as any,
    });
    const { container } = render(<UserAvatar />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the user's photo when available", () => {
    useUserStore.setState({
      user: { id: 7, email: "a@b.com", photo: "https://x/y.png" } as any,
    });
    render(<UserAvatar />);
    const img = screen.getByAltText("User Avatar");
    expect(img).toHaveAttribute("src", "https://x/y.png");
  });

  it("falls back to the generated avatar when the photo errors", () => {
    useUserStore.setState({
      user: { id: 7, email: "a@b.com", photo: "https://x/y.png" } as any,
    });
    const { container } = render(<UserAvatar />);
    fireEvent.error(screen.getByAltText("User Avatar"));
    expect(screen.queryByAltText("User Avatar")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies the requested size and className", () => {
    useUserStore.setState({ user: { email: "a@b.com" } as any });
    const { container } = render(<UserAvatar size={48} className="avatar-cls" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: "48px", height: "48px" });
    expect(wrapper.className).toContain("avatar-cls");
  });
});