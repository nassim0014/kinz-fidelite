import type { Metadata, Viewport } from 'next';
import { Lato, Playfair_Display } from 'next/font/google';
import './globals.css';

const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: { default: 'KINZ Fidélité', template: '%s · KINZ Fidélité' },
  description: 'La carte de fidélité de la boutique KINZ',
  robots: { index: false, follow: false },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#4A5530', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${lato.variable} ${playfair.variable}`}>
      <body className="min-h-dvh bg-sand font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
