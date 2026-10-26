'use client';

// ボドゲ広場の「別タブで大きく開く」を押したとき、iframe で遊んでいた続きから
// 始められるようにするための橋渡し。
//
// このゲームは boardgamecat.com のページに iframe で埋め込まれている。
// iframe は pageone.boardgamecat.com、親は boardgamecat.com で別オリジンになるため、
// ブラウザによっては埋め込みの保存領域を親サイトごとに切り分ける。その場合
// iframe で保存した識別子は、同じURLを直接開いたタブからは見えない。
// さらに「別タブで大きく開く」のリンク先はトップページなので、
// iframe の中でルームに入っていても、新しいタブはルームの外から始まる。
//
// そこで今いるページと自分の識別子を親ページへ知らせ、親はそれを
// リンクのURLに載せる。受け取り側は lib/playerId.ts の recallPlayerId()。
//
//   親 → こちら : { type: 'bodoge:whoami' }
//   こちら → 親 : { type: 'bodoge:session', sessionId, path }

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { clearHandoffParams, recallPlayerId } from '@/lib/playerId';

/** 親ページへ知らせるときの合図。ボドゲ広場側と揃えること。 */
const TELL = 'bodoge:session';
/** 親ページから「今だれ？どこ？」と聞かれるときの合図。 */
const ASK = 'bodoge:whoami';

/**
 * 別タブで開き直しても成り立つページだけを渡す。
 *
 * /game（CPU対戦）は盤面の設定を localStorage に置いているだけで
 * サーバーには何も無い。保存領域が共有されないブラウザでそこを開くと
 * 「ゲーム設定が見つかりません」になってしまうので渡さない。
 * 渡さなければリンクは今までどおりトップページを開く。
 */
function handoffPath(pathname: string): string {
  return pathname.startsWith('/online') ? pathname : '';
}

function inIframe(): boolean {
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

export function HandoffBridge() {
  const pathname = usePathname();

  // URLに載ってきた識別子は recallPlayerId() が受け取るので、
  // ここでは受け取ったあとのURLを掃除するだけ。
  // ルームのURLをそのまま人に送ったとき、相手が同じ席を名乗ってしまうのを避ける。
  useEffect(() => {
    clearHandoffParams();
  }, []);

  useEffect(() => {
    if (!inIframe()) return;

    const tell = () => {
      // 宛先オリジンは絞らない（'*'）。ボドゲ広場は www 付きでも開けるため。
      // 渡すのは自分の識別子と今いるページだけで、
      // 親の受け取り側はこちらのオリジンを確認してから使う。
      try {
        window.parent.postMessage({
          type: TELL,
          sessionId: recallPlayerId() ?? '',
          path: handoffPath(pathname),
        }, '*');
      } catch {
        // 親に届かなくても遊ぶぶんには支障がない
      }
    };

    tell();

    // 親から聞かれたときにも答える。iframe の読み込みが終わった合図は
    // 親側のほうが確実に取れるため。
    const onMessage = (ev: MessageEvent) => {
      if (ev.data && typeof ev.data === 'object' && ev.data.type === ASK) tell();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pathname]);

  return null;
}
