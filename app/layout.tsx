import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import favicon from "@/assets/logo/favicon-16x16.png";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Breathy Chatbot",
    template: "%s | Breathy",
  },
  description: "Breathy membantu pasien TB menceritakan gejala dan menyiapkan data untuk dokter.",
  icons: {
    icon: favicon.src,
    shortcut: favicon.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
