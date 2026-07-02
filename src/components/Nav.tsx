"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

export interface NavUser {
  name: string;
  role: "admin" | "editor" | "viewer";
}

const links = [
  { href: "/",           label: "Übersicht"  },
  { href: "/timeline",   label: "Timeline"   },
  { href: "/characters", label: "Charaktere" },
  { href: "/events",     label: "Events"     },
  { href: "/artifacts",  label: "Artefakte"  },
  { href: "/places",     label: "Orte"       },
  { href: "/sources",    label: "Quellen"    },
  { href: "/search",     label: "Suche"      },
];

const ROLE_LABEL: Record<NavUser["role"], string> = {
  admin:  "Admin",
  editor: "Editor",
  viewer: "Leser",
};

export default function Nav({ user }: { user?: NavUser | null }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-inner max-w-7xl mx-auto px-4">
        {/* Logo / wordmark */}
        <Link href="/" className="wordmark">
          ᚈᚐᚔᚅ · LINE
        </Link>

        <div className="header-divider" />

        {/* Desktop nav */}
        <nav className="main-nav">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link${active ? " nav-link-active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`nav-link${path.startsWith("/admin") ? " nav-link-active" : ""}`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div style={{ flex: 1 }} />

        {/* User area */}
        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="user-chip"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="user-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="user-name">{user.name}</span>
              <span className={`role-badge role-${user.role}`}>{ROLE_LABEL[user.role]}</span>
            </button>
            {menuOpen && (
              <div className="user-menu" role="menu">
                <div className="user-menu-info">
                  Angemeldet als <strong>{user.name}</strong>
                  <br />
                  Rolle: {ROLE_LABEL[user.role]}
                  {user.role === "viewer" && (
                    <div style={{ marginTop: "0.4rem", color: "var(--slate)", fontSize: "0.72rem" }}>
                      Nur Lesen — ein Admin kann dir Schreibrechte geben.
                    </div>
                  )}
                </div>
                <button
                  className="user-menu-item"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  role="menuitem"
                >
                  Abmelden
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="btn-login">
            Anmelden
          </Link>
        )}

        {/* Mobile hamburger */}
        <button
          className="hamburger"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menü öffnen"
          aria-expanded={mobileOpen}
        >
          ☰
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="mobile-nav">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`nav-link${active ? " nav-link-active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="nav-link">
              Admin
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
