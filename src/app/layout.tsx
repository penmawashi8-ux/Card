import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Buta no Shippo – 豚のしっぽ',
  description:
    'A Japanese card game for 3-6 players. Flip cards around the pig\'s tail circle and avoid matching suits!',
  keywords: ['card game', 'buta no shippo', 'pig tail', 'Japanese card game', 'party game'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        {children}
      </body>
    </html>
  );
}
