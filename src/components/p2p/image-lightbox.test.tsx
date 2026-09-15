import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { ImageLightbox } from "./image-lightbox";

describe("ImageLightbox", () => {
  it("renders the image when open", () => {
    renderWithProviders(
      <ImageLightbox isOpen={true} onClose={vi.fn()} imageUrl="https://test.com/img.png" />
    );
    const img = screen.getByAltText("Full screen preview");
    expect(img).toHaveAttribute("src", "https://test.com/img.png");
  });

  it("does not render content when closed", () => {
    renderWithProviders(
      <ImageLightbox isOpen={false} onClose={vi.fn()} imageUrl="https://test.com/img.png" />
    );
    expect(screen.queryByAltText("Full screen preview")).not.toBeInTheDocument();
  });
});
