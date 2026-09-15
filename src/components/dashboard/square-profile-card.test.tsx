import React from "react";
(globalThis as any).React = React;
import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { useUserStore } from "@/src/stores/user-store";
import { SquareProfileCard } from "./square-profile-card";

describe("SquareProfileCard", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null });
  });

  it("renders fallback name and loading id when no user is set", () => {
    renderWithProviders(<SquareProfileCard />);
    expect(screen.getByText("Daniel T")).toBeInTheDocument();
    expect(screen.getByText("User ID: Loading...")).toBeInTheDocument();
  });

  it("renders the user display name and id when user is set", () => {
    useUserStore.setState({
      user: {
        id: "usr-12345",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@limiance.test",
        username: "adalov",
        photo: "",
      } as any,
    });
    renderWithProviders(<SquareProfileCard />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("User ID: 12345")).toBeInTheDocument();
  });

  it("renders a Follow button", () => {
    renderWithProviders(<SquareProfileCard />);
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
  });
});