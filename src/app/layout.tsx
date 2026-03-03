import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ subsets: ["cyrillic", "latin"], weight: ["500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "BilimAI - Умная подготовка к экзаменам",
  description: "ЕНТ, НИШ, IELTS, SAT, ПДД с AI-репетитором",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BilimAI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={nunito.className}>
        <div className="max-w-[430px] mx-auto min-h-screen relative">{children}</div>
      </body>
    </html>
  );
}