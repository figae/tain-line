"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setBusy(false);
    if (res?.error) {
      setError("E-Mail oder Passwort ist falsch.");
      return;
    }
    router.push(callbackUrl.startsWith("/") ? callbackUrl : "/");
    router.refresh();
  }

  return (
    <div className="auth-card celtic-border page-enter">
      <div className="auth-ogham">᚛ᚑᚌᚐᚋ᚜</div>
      <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.25rem", textAlign: "center" }}>Anmelden</h1>
      <p style={{ color: "var(--mist)", fontSize: "0.9rem", textAlign: "center", margin: "0 0 1.5rem" }}>
        Lesen ist frei — Schreiben erfordert ein Konto mit Rechten.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
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
          Passwort
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="••••••••••"
          />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={busy} className="btn-primary" style={{ marginTop: "0.25rem" }}>
          {busy ? "Prüfe …" : "Anmelden"}
        </button>
      </form>

      <div className="rune-divider" style={{ margin: "1.25rem 0" }}>᚛᚜</div>

      <p style={{ color: "var(--slate)", fontSize: "0.85rem", textAlign: "center", margin: 0 }}>
        Noch kein Konto?{" "}
        <Link href="/register" style={{ color: "var(--gold)" }}>
          Registrieren
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem 1rem" }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
