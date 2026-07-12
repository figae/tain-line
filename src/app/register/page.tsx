"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(data.error ?? "Registrierung fehlgeschlagen.");
      return;
    }

    // Auto-login after successful registration
    await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem 1rem" }}>
      <div className="auth-card celtic-border page-enter">
        <div className="auth-ogham">᚛ᚑᚌᚐᚋ᚜</div>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.25rem", textAlign: "center" }}>Konto erstellen</h1>
        <p style={{ color: "var(--mist)", fontSize: "0.9rem", textAlign: "center", margin: "0 0 1.5rem" }}>
          Neue Konten starten mit Leserechten. Ein Admin kann dir die
          Editor-Rolle geben, damit du Wissen beitragen kannst.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <label className="auth-label">
            Name
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="Dein Name"
            />
          </label>

          <label className="auth-label">
            E-Mail
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="du@beispiel.de"
            />
          </label>

          <label className="auth-label">
            Passwort <span style={{ color: "var(--slate)", fontWeight: 400 }}>(mind. 10 Zeichen)</span>
            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••••"
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={busy} className="btn-primary" style={{ marginTop: "0.25rem" }}>
            {busy ? "Erstelle Konto …" : "Registrieren"}
          </button>
        </form>

        <div className="rune-divider" style={{ margin: "1.25rem 0" }}>᚛᚜</div>

        <p style={{ color: "var(--slate)", fontSize: "0.85rem", textAlign: "center", margin: 0 }}>
          Bereits ein Konto?{" "}
          <Link href="/login" style={{ color: "var(--gold)" }}>
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
