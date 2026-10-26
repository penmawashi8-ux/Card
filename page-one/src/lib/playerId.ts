// オンライン対戦で「自分が部屋の中の誰なのか」を表す識別子の置き場所。
//
// もともと sessionStorage だけに入れていた。sessionStorage はタブごとに
// 独立する仕様なので、同じ部屋のURLを別のタブで開くと識別子が無く、
// 新しい人として扱われて自分の席に戻れなかった。
// （ボドゲ広場の「別タブで大きく開く」を押したときも同じことが起きる）
//
// そこで localStorage にも控えておき、タブに無ければそちらから拾う。
// 書き込みは両方に行う。sessionStorage を先に見るのは、
// 2つのタブでそれぞれ別の部屋に入っている場合に取り違えないため。

const KEY = 'pageone_my_player_id';

function safeGet(store: Storage | undefined, key: string): string | null {
  try {
    return store ? store.getItem(key) : null;
  } catch {
    // プライベートウィンドウ等では例外が出る
    return null;
  }
}

function safeSet(store: Storage | undefined, key: string, value: string): void {
  try {
    store?.setItem(key, value);
  } catch {
    // 保存できなくても、このタブで遊ぶぶんには支障がない
  }
}

/** 新しく決めた識別子を覚える。タブにも、ブラウザ全体にも。 */
export function rememberPlayerId(playerId: string): void {
  if (typeof window === 'undefined') return;
  safeSet(window.sessionStorage, KEY, playerId);
  safeSet(window.localStorage, KEY, playerId);
}

/**
 * 覚えている識別子を返す。無ければ null。
 * このタブのもの → ブラウザ全体のもの、の順に探す。
 */
export function recallPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  const fromTab = safeGet(window.sessionStorage, KEY);
  if (fromTab) return fromTab;
  const fromBrowser = safeGet(window.localStorage, KEY);
  if (fromBrowser) {
    // 別タブから引き継いだので、このタブのものとしても覚えておく
    safeSet(window.sessionStorage, KEY, fromBrowser);
    return fromBrowser;
  }
  return null;
}
