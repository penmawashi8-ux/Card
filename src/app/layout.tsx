import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UpdateBanner } from '@/components/UpdateBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ぶたのしっぽ',
  description: 'ブタのしっぽ – 3〜6人用トランプゲーム',
  keywords: ['card game', 'buta no shippo', 'pig tail', 'Japanese card game', 'party game'],
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
        <UpdateBanner />
      </body>
    </html>
  );
}
