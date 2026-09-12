import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Listing',
  description: 'AI-powered e-commerce listing management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
