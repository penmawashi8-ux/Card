import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ページワン – 無料トリックテイキングカードゲーム';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2040 60%, #070f20 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative card suits */}
        {['♠', '♥', '♦', '♣'].map((suit, i) => (
          <div
            key={suit}
            style={{
              position: 'absolute',
              fontSize: 180,
              opacity: 0.06,
              color: i % 2 === 0 ? '#ffffff' : '#ff6666',
              top: i < 2 ? -20 : undefined,
              bottom: i >= 2 ? -20 : undefined,
              left: i === 0 || i === 2 ? 40 : undefined,
              right: i === 1 || i === 3 ? 40 : undefined,
            }}
          >
            {suit}
          </div>
        ))}

        {/* main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 80, lineHeight: 1 }}>🃏</div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-1px',
              textShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}
          >
            ページワン
          </div>
          <div style={{ fontSize: 28, color: '#93c5fd', letterSpacing: 2 }}>
            Page One · トリックテイキングカードゲーム
          </div>
          <div
            style={{
              display: 'flex',
              gap: 24,
              marginTop: 8,
            }}
          >
            {['3〜4人対応', 'CPU対戦', 'オンライン対戦'].map((tag) => (
              <div
                key={tag}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 999,
                  padding: '6px 20px',
                  color: '#bfdbfe',
                  fontSize: 22,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* bottom label */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 20,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: 1,
          }}
        >
          無料ブラウザゲーム · スマホ対応
        </div>
      </div>
    ),
    { ...size },
  );
}
