import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: { default: "A Cicatriz — Filme", template: "%s | A Cicatriz" },
  description:
    "Site oficial de A Cicatriz, um curta-metragem escolar sobre as marcas do bullying.",
  applicationName: "A Cicatriz",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "A Cicatriz",
    description: "Algumas marcas não aparecem na pele.",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/api/capa", width: 960, height: 1685 }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#07080a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
