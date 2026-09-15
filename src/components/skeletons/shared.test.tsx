import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import {
  SkeletonShell,
  SkeletonHeader,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonStatGrid,
  SkeletonTable,
  SkeletonField,
  SkeletonForm,
  SkeletonAvatar,
  SkeletonChart,
} from "./shared";

describe("SkeletonShell", () => {
  it("wraps children in the page scaffolding", () => {
    const { container } = render(
      <SkeletonShell className="custom-shell">
        <span>child</span>
      </SkeletonShell>
    );
    expect(screen.getByText("child")).toBeInTheDocument();
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("page-enter");
    expect(el.className).toContain("custom-shell");
  });
});

describe("SkeletonHeader", () => {
  it("renders title, subtitle and action by default", () => {
    const { container } = render(<SkeletonHeader />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(3);
  });

  it("hides subtitle and action when disabled", () => {
    const { container } = render(
      <SkeletonHeader subtitle={false} action={false} />
    );
    expect(container.querySelectorAll(".skeleton")).toHaveLength(1);
  });

  it("applies titleWidth to the title bar", () => {
    const { container } = render(<SkeletonHeader titleWidth={220} />);
    const title = container.querySelectorAll(".skeleton")[0] as HTMLElement;
    expect(title).toHaveStyle({ width: "220px" });
  });
});

describe("SkeletonCard", () => {
  it("renders a header row by default plus children", () => {
    const { container } = render(
      <SkeletonCard>
        <span>content</span>
      </SkeletonCard>
    );
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(container.querySelectorAll(".skeleton")).toHaveLength(2);
  });

  it("omits the header when header={false}", () => {
    const { container } = render(<SkeletonCard header={false} />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(0);
  });

  it("applies the card style and custom className", () => {
    const { container } = render(<SkeletonCard className="custom-card" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("rounded-2xl");
    expect(el.className).toContain("custom-card");
  });
});

describe("SkeletonStatCard", () => {
  it("renders a stat card with label and value bars", () => {
    const { container } = render(<SkeletonStatCard />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(2);
  });
});

describe("SkeletonStatGrid", () => {
  it("renders the default 4 stat cards", () => {
    const { container } = render(<SkeletonStatGrid />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(8);
  });

  it("renders the requested number of stat cards", () => {
    const { container } = render(<SkeletonStatGrid count={2} />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(4);
  });
});

describe("SkeletonTable", () => {
  it("renders header row plus rows x cols cells", () => {
    const { container } = render(<SkeletonTable rows={3} cols={2} />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(3 * 2 + 2);
  });

  it("uses defaults of 6 rows and 4 columns", () => {
    const { container } = render(<SkeletonTable />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(6 * 4 + 4);
  });
});

describe("SkeletonField", () => {
  it("renders a label bar and an input bar", () => {
    const { container } = render(<SkeletonField />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(2);
  });

  it("hides the label when label={false}", () => {
    const { container } = render(<SkeletonField label={false} />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(1);
  });

  it("applies the requested height to the input bar", () => {
    const { container } = render(<SkeletonField height={100} />);
    const input = container.querySelectorAll(".skeleton")[1] as HTMLElement;
    expect(input).toHaveStyle({ height: "100px" });
  });
});

describe("SkeletonForm", () => {
  it("renders fields plus a submit button by default", () => {
    const { container } = render(<SkeletonForm fields={2} />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(2 * 2 + 1);
  });

  it("omits the button when withButton={false}", () => {
    const { container } = render(<SkeletonForm fields={2} withButton={false} />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(2 * 2);
  });
});

describe("SkeletonAvatar", () => {
  it("renders a circle skeleton with the requested size", () => {
    const { container } = render(<SkeletonAvatar size={64} />);
    const el = container.querySelector(".skeleton") as HTMLElement;
    expect(el).toHaveStyle({ width: "64px", height: "64px" });
  });
});

describe("SkeletonChart", () => {
  it("renders a card header plus a chart panel with the requested height", () => {
    const { container } = render(<SkeletonChart height={250} />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(3);
    const chart = container.querySelectorAll(".skeleton")[2] as HTMLElement;
    expect(chart).toHaveStyle({ height: "250px" });
  });
});