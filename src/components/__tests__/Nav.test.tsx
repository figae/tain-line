import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Nav from "../Nav";

// Mock Next.js router hooks and Link
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { usePathname } from "next/navigation";

describe("Nav", () => {
  it("renders the wordmark", () => {
    render(<Nav />);
    expect(screen.getByText("ᚈᚐᚔᚅ · LINE")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<Nav />);
    expect(screen.getByText("Übersicht")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Charaktere")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Quellen")).toBeInTheDocument();
  });

  it("marks the root link as active on /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Nav />);
    const link = screen.getByText("Übersicht").closest("a");
    // Active links get background var(--gold), inactive are transparent
    expect(link).toHaveAttribute("href", "/");
    // The active style includes background: var(--gold)
    expect(link).toHaveStyle({ background: "var(--gold)" });
  });

  it("marks Timeline as active when on /timeline", () => {
    vi.mocked(usePathname).mockReturnValue("/timeline");
    render(<Nav />);
    const link = screen.getByText("Timeline").closest("a");
    expect(link).toHaveStyle({ background: "var(--gold)" });
  });

  it("does not mark Timeline as active on /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Nav />);
    const link = screen.getByText("Timeline").closest("a");
    expect(link).toHaveStyle({ background: "transparent" });
  });
});
