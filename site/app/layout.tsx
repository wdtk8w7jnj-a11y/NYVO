import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYVO",
  description: "NYVO — football, démonstration et pilote API.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
