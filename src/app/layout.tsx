import type { Metadata } from "next";
import "./globals.css";
import Nav, { type NavUser } from "@/components/Nav";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Tain Line — Irisch-keltische Mythologie",
  description:
    "Ein lebendiger Wissensgraph der irisch-keltischen Mythologie. Charaktere, Ereignisse, Stammbäume, Artefakte und Quellen — alles verknüpft.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  // Only a real login (non-empty user id) counts as signed in
  const user: NavUser | null = session?.user?.id
    ? { name: session.user.name ?? "Unbekannt", role: session.user.role ?? "viewer" }
    : null;

  return (
    <html lang="de">
      <body className="min-h-screen">
        <Nav user={user} />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        <footer className="site-footer">
          <span className="footer-ogham">᚛ᚈᚐᚔᚅ ᛚᚔᚅᚓ᚜</span>
          <span>TAIN LINE · IRISCH-KELTISCHE MYTHOLOGIE · WISSENSGRAPH</span>
        </footer>
      </body>
    </html>
  );
}
