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

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("Nav", () => {
  it("renders the wordmark", () => {
    render(<Nav />);
    expect(screen.getByText("ᚈᚐᚔᚅ · LINE")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<Nav />);
    // Links appear in desktop nav (mobile drawer is closed by default)
    expect(screen.getByText("Übersicht")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Charaktere")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Artefakte")).toBeInTheDocument();
    expect(screen.getByText("Orte")).toBeInTheDocument();
    expect(screen.getByText("Quellen")).toBeInTheDocument();
  });

  it("marks the root link as active on /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Nav />);
    const link = screen.getByText("Übersicht").closest("a");
    expect(link).toHaveAttribute("href", "/");
    expect(link?.className).toContain("nav-link-active");
  });

  it("marks Timeline as active when on /timeline", () => {
    vi.mocked(usePathname).mockReturnValue("/timeline");
    render(<Nav />);
    const link = screen.getByText("Timeline").closest("a");
    expect(link?.className).toContain("nav-link-active");
  });

  it("does not mark Timeline as active on /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Nav />);
    const link = screen.getByText("Timeline").closest("a");
    expect(link?.className).not.toContain("nav-link-active");
  });

  it("shows login button when logged out", () => {
    render(<Nav />);
    expect(screen.getByText("Anmelden")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows user chip and role for a logged-in editor", () => {
    render(<Nav user={{ name: "Brigid", role: "editor" }} />);
    expect(screen.getByText("Brigid")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows the admin link only for admins", () => {
    render(<Nav user={{ name: "Lugh", role: "admin" }} />);
    // "Admin" appears both as the role badge and as the nav link — we
    // specifically want the link to /admin
    const adminLink = screen
      .getAllByText("Admin")
      .map((el) => el.closest("a"))
      .find((a) => a?.getAttribute("href") === "/admin");
    expect(adminLink).toBeTruthy();
  });
});
