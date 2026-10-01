import type { Metadata, Viewport } from 'next';
import { Figtree, Marcellus } from 'next/font/google';
import './globals.css';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree' });
const marcellus = Marcellus({ subsets: ['latin'], weight: '400', variable: '--font-marcellus' });

export const metadata: Metadata = {
  title: { default: 'KINZ Fidélité', template: '%s · KINZ Fidélité' },
  description: 'La carte de fidélité de la boutique KINZ',
  robots: { index: false, follow: false },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#20411E', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${figtree.variable} ${marcellus.variable}`}>
      <body className="min-h-dvh bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
