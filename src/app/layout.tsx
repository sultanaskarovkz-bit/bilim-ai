import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ subsets: ["cyrillic", "latin"], weight: ["500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "BilimAI - Умная подготовка к экзаменам",
  description: "ЕНТ, НИШ, IELTS, SAT, ПДД с AI-репетитором",
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={nunito.className}>
        <div className="max-w-[430px] mx-auto min-h-screen relative">{children}</div>
      </body>
    </html>
  );
}
