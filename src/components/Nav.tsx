"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",            label: "Übersicht"    },
  { href: "/timeline",    label: "Timeline"     },
  { href: "/characters",  label: "Charaktere"   },
  { href: "/events",      label: "Events"       },
  { href: "/sources",     label: "Quellen"      },
  { href: "/search",      label: "Suche"        },
  { href: "/admin",       label: "Admin"        },
];

export default function Nav() {
  const path = usePathname();

  return (
    <header
      style={{
        background: "var(--bark)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="max-w-7xl mx-auto px-4"
        style={{ display: "flex", alignItems: "center", gap: "2rem", height: "60px" }}
      >
        {/* Logo / wordmark */}
        <Link
          href="/"
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--amber)",
            letterSpacing: "0.2em",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          ᚈᚐᚔᚅ · LINE
        </Link>

        <div
          style={{ height: "24px", width: "1px", background: "var(--border)" }}
        />

        <nav style={{ display: "flex", gap: "0.25rem", flex: 1 }}>
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "6px 14px",
                  borderRadius: "2px",
                  textDecoration: "none",
                  color: active ? "var(--stone)" : "var(--mist)",
                  background: active ? "var(--gold)" : "transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
