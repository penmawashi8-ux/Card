import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ページワン – Page One',
  description:
    'Page One (ページワン) - A Japanese trick-taking card game for 3-4 players with 53 cards.',
  keywords: ['card game', 'page one', 'ページワン', 'Japanese card game', 'trick taking'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        {children}
      </body>
    </html>
  );
}
