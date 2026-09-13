// Global metadata, theme, and prototype state shared by all application pages.
import type { Metadata } from "next";
import localFont from "next/font/local";
import { WorkspaceProvider } from "@/lib/stores/workspaceStore";
import "./globals.css";
// Self-hosted variable fonts: Inter for reading, Paper Mono for identifiers and data.
const inter = localFont({
  src: [
    {
      path: "../public/fonts/inter-variable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../public/fonts/inter-variable-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});
const paperMono = localFont({
  src: "../public/fonts/paper-mono-variable.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-paper-mono",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Courier New", "monospace"],
});
export const metadata: Metadata = {
  title: "AI Listing Agent — Seller Workspace",
  description:
    "Create, refine, and review marketplace listings in one brand-aware workspace.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${paperMono.variable}`}>
      <body>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}
