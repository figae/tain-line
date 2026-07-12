"use client";

import { useEffect, useState, useCallback } from "react";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string | null;
}

const ROLE_INFO: Record<AdminUser["role"], { label: string; hint: string }> = {
  admin:  { label: "Admin",  hint: "Review, Benutzerverwaltung, direkte Schreibrechte" },
  editor: { label: "Editor", hint: "Darf Daten vorschlagen (landen in der Review-Queue)" },
  viewer: { label: "Leser",  hint: "Nur Lesen — wie anonyme Besucher" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function changeRole(userId: number, role: AdminUser["role"]) {
    setSavingId(userId);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingId(null);
    if (!res.ok) {
      setError(data.error ?? "Änderung fehlgeschlagen.");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <h1 style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>Benutzerverwaltung</h1>
      <p style={{ color: "var(--mist)", margin: "0 0 1.5rem" }}>
        Rollen steuern den Schreibzugriff: Lesen ist für alle frei, Schreiben nur mit Editor- oder Admin-Rolle.
      </p>

      {/* Role explanation */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {(Object.keys(ROLE_INFO) as AdminUser["role"][]).map((r) => (
          <div key={r} className="card" style={{ padding: "0.6rem 1rem", flex: "1 1 220px" }}>
            <span className={`role-badge role-${r}`}>{ROLE_INFO[r].label}</span>
            <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
              {ROLE_INFO[r].hint}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {users.length === 0 ? (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--slate)" }}>
          Noch keine Benutzerkonten. Das erste registrierte Konto wird automatisch Admin.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {users.map((u) => (
            <div
              key={u.id}
              className="card"
              style={{
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <span className="user-avatar" aria-hidden>
                {u.name.slice(0, 1).toUpperCase()}
              </span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: "var(--cream)" }}>{u.name}</div>
                <div style={{ color: "var(--slate)", fontSize: "0.8rem" }}>{u.email}</div>
              </div>
              <span className={`role-badge role-${u.role}`}>{ROLE_INFO[u.role].label}</span>
              <select
                value={u.role}
                disabled={savingId === u.id}
                onChange={(e) => changeRole(u.id, e.target.value as AdminUser["role"])}
                style={{
                  background: "var(--peat)",
                  color: "var(--cream)",
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  padding: "5px 8px",
                  fontFamily: "Cinzel, serif",
                  fontSize: "0.72rem",
                }}
              >
                <option value="viewer">Leser</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
