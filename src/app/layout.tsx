import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResearchCard BioIntel — interactive pharma research discovery",
  description:
    "Explore open-access biomedical papers with an interactive biotech interface, transparent AI summaries, and source-grounded research signals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="hero-orb hero-orb-a" />
          <div className="hero-orb hero-orb-b" />
          <div className="hero-orb hero-orb-c" />
          <div className="tech-grid" />
        </div>

        <header className="sticky top-0 z-20 border-b border-cyan-100/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <a href="/" className="text-xl font-bold tracking-tight text-cyan-50">
              ResearchCard <span className="text-cyan-300">BioIntel</span>
            </a>
            <p className="hidden text-sm text-cyan-100/75 sm:block">
              Transparent AI synthesis · Source-first science · Uncertainty visible
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:py-10">{children}</main>
      </body>
    </html>
  );
}
