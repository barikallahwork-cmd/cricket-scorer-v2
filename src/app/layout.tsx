import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CricScore Pro — Live Cricket Scorer',
  description: 'Professional real-time cricket scoring with dual-screen display support',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#070d1a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#070d1a] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
