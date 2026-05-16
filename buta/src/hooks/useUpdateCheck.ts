'use client';

import { useState, useEffect, useRef } from 'react';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5分ごとにチェック

export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const buildIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 現在のビルドIDを取得（Next.jsがwindow.__NEXT_DATAに埋め込む）
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buildIdRef.current = (window as any).__NEXT_DATA__?.buildId ?? null;
    } catch {
      return;
    }

    if (!buildIdRef.current) return;

    async function check() {
      try {
        // タイムスタンプ付きでフェッチしてCDNキャッシュをバイパス
        const res = await fetch(`/?_v=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const html = await res.text();
        const match = html.match(/"buildId":"([^"]+)"/);
        if (match && match[1] !== buildIdRef.current) {
          setUpdateAvailable(true);
        }
      } catch {
        // ネットワークエラーは無視
      }
    }

    const timer = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return updateAvailable;
}
