import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "週報",
  description: "中文摘要簡報",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" className={`${dmSerif.variable} ${dmSans.variable}`}>
      <body className="min-h-screen flex flex-col font-body">
        {/* Navbar */}
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
          <nav className="max-w-[800px] mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-display text-[20px] text-[var(--text-primary)] tracking-tight"
            >
              週報
            </Link>
            <div className="flex gap-6 text-[14px] font-body text-[var(--text-secondary)]">
              <Link
                href="/archive"
                className="hover:text-[var(--text-primary)] transition-colors duration-200"
              >
                歷史週報
              </Link>
              <Link
                href="/about"
                className="hover:text-[var(--text-primary)] transition-colors duration-200"
              >
                關於
              </Link>
            </div>
          </nav>
        </header>

        {/* Main */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border)]">
          <div className="max-w-[800px] mx-auto px-6 py-8 text-center text-[13px] text-[var(--text-secondary)]">
             {new Date().getFullYear()} 週報
          </div>
        </footer>
      </body>
    </html>
  );
}
