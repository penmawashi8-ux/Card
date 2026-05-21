import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UpdateBanner } from '@/components/UpdateBanner';

const inter = Inter({ subsets: ['latin'] });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ぶたのしっぽ – 無料トランプゲーム | CPU・オンライン対戦対応',
    template: '%s | ぶたのしっぽ',
  },
  description:
    'ぶたのしっぽ（Pig\'s Tail）を無料でブラウザプレイ！3〜6人対応、CPU 3段階難易度、オンライン対戦対応。スートが一致したらペナルティ──手札を最も少なく保てたプレイヤーの勝ち。スマホでもすぐ遊べます。',
  keywords: [
    'ぶたのしっぽ',
    '豚のしっぽ',
    'ぶたのしっぽ ゲーム',
    'Pig\'s Tail',
    'buta no shippo',
    'トランプゲーム',
    '無料カードゲーム',
    'オンラインカードゲーム',
    'CPU対戦',
    'ブラウザゲーム',
  ],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'ぶたのしっぽ',
    title: 'ぶたのしっぽ – 無料トランプゲーム | CPU・オンライン対戦',
    description:
      'ぶたのしっぽを無料でブラウザプレイ！3〜6人対応、CPU 3段階難易度、オンライン対戦対応。スマホでもすぐ遊べる本格トランプゲーム。',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'ぶたのしっぽ – 無料トランプゲーム',
      },
    ],
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ぶたのしっぽ – 無料トランプゲーム',
    description:
      'ぶたのしっぽを無料でブラウザプレイ！3〜6人対応、CPU 3段階難易度、オンライン対戦対応。',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
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
