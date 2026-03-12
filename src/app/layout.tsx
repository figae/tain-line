import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Tain Line — Irish Celtic Mythology",
  description:
    "A living knowledge base and timeline of Irish-Celtic mythology. Characters, events, family trees, and sources — all interconnected.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        <footer
          style={{
            borderTop: "1px solid var(--border)",
            marginTop: "4rem",
            padding: "2rem",
            textAlign: "center",
            color: "var(--slate)",
            fontSize: "0.85rem",
            fontFamily: "Cinzel, serif",
            letterSpacing: "0.15em",
          }}
        >
          TAIN LINE · IRISH CELTIC MYTHOLOGY · KNOWLEDGE BASE
        </footer>
      </body>
    </html>
  );
}
