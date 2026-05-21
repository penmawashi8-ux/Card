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
    default: 'ページワン – 無料トリックテイキングカードゲーム | CPU・オンライン対戦対応',
    template: '%s | ページワン',
  },
  description:
    'ページワン（Page One）を無料でブラウザプレイ！53枚を使うトリックテイキングゲーム。3〜4人対応、CPU対戦、オンライン対戦対応。手札1枚で「ページワン！」宣言を忘れずに。スマホでもすぐ遊べます。',
  keywords: [
    'ページワン',
    'ページワン ゲーム',
    'Page One',
    'ページワン カードゲーム',
    'トリックテイキング',
    'トランプゲーム',
    '無料カードゲーム',
    'オンラインカードゲーム',
    'CPU対戦',
    'ブラウザゲーム',
  ],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'ページワン',
    title: 'ページワン – 無料トリックテイキングカードゲーム | CPU・オンライン対戦',
    description:
      'ページワンを無料でブラウザプレイ！53枚を使うトリックテイキングゲーム。3〜4人対応、CPU対戦、オンライン対戦対応。スマホでもすぐ遊べます。',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'ページワン – 無料トリックテイキングカードゲーム',
      },
    ],
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ページワン – 無料トリックテイキングカードゲーム',
    description:
      'ページワンを無料でブラウザプレイ！53枚を使うトリックテイキングゲーム。3〜4人対応、CPU対戦、オンライン対戦対応。',
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
