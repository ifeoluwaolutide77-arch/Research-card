import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ResearchCard — research intelligence in under a minute",
  description:
    "Open-access paper discovery with transparent, abstract-grounded AI cards for biomedical and pharma research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-screen bg-slate-50 font-sans text-slate-900 antialiased`}>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <a href="/" className="text-xl font-bold tracking-tight text-violet-800">
              ResearchCard
            </a>
            <p className="hidden text-sm text-slate-600 sm:block">
              Abstract-grounded AI · Always link to sources · Uncertainty first
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
