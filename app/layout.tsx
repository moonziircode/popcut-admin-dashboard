import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Popcut.id — Admin Dashboard',
  description: 'Sistem manajemen operasional dan bisnis photobooth Popcut.id',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/icon-512x512.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Popcut Admin',
  },
};

export const viewport: Viewport = {
  themeColor: '#CCDE2A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-canvas text-content-primary antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
