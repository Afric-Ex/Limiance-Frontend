import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { TablePagination } from "./table-pagination";
import { installTestGlobals, renderWithProviders } from "@/src/test/utils";

const searchParamsMock = vi.hoisted(() => vi.fn(() => new URLSearchParams()));

vi.mock("next/navigation", () => ({
  useSearchParams: searchParamsMock,
}));

installTestGlobals();

describe("TablePagination", () => {
  beforeEach(() => {
    searchParamsMock.mockReturnValue(new URLSearchParams());
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  it("renders nothing when totalCount is 0", () => {
    const { container } = renderWithProviders(
      <TablePagination totalCount={0} page={1} setPage={vi.fn()} />
    );
    expect(container.querySelector(".pagination")).not.toBeInTheDocument();
  });

  it("renders pagination controls when there is data", () => {
    renderWithProviders(
      <TablePagination totalCount={50} page={1} setPage={vi.fn()} />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls setPage and updates the url param on change", () => {
    const setPage = vi.fn();
    renderWithProviders(
      <TablePagination totalCount={50} page={1} setPage={setPage} />
    );
    fireEvent.click(screen.getByText("2"));
    expect(setPage).toHaveBeenCalledWith(2);
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "?page=2");
  });

  it("honours the url page param on mount", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("page=3"));
    const setPage = vi.fn();
    renderWithProviders(
      <TablePagination totalCount={50} page={1} setPage={setPage} />
    );
    expect(setPage).toHaveBeenCalledWith(3);
  });

  it("respects a custom limit", () => {
    renderWithProviders(
      <TablePagination totalCount={50} page={1} setPage={vi.fn()} limit={25} />
    );
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });
});