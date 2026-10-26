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
//
// ただし、ボドゲ広場の iframe から直接開いたタブへの引き継ぎはこれでは足りない。
// iframe（buta.boardgamecat.com）と親（boardgamecat.com）は別オリジンで、
// ブラウザによっては埋め込みの保存領域を親サイトごとに切り分けるため、
// localStorage ごと見えないことがある。そのため親ページがリンクに付けてくれる
// ?sid=... を保存領域より先に見る。送り出す側は components/HandoffBridge.tsx。

const KEY = 'online_player_id';

/** 親ページからの引き継ぎが載ってくるクエリ。 */
const HANDOFF_PARAMS = ['sid', 'name'];

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

/** URLに載ってきた識別子。無ければ null。 */
function fromUrl(): string | null {
  try {
    const sid = new URLSearchParams(window.location.search).get('sid');
    // 発行しているのは useId() 由来か player-xxxxxxx 形式。
    // 見慣れない形のものは受け取らない
    return sid && /^[\w:«»-]{1,64}$/.test(sid) ? sid : null;
  } catch {
    return null;
  }
}

/**
 * 覚えている識別子を返す。無ければ null。
 * URLの引き継ぎ → このタブのもの → ブラウザ全体のもの、の順に探す。
 *
 * URLを最優先にするのは、親ページから渡された時点でそちらが本人だから。
 * 保存領域が共有されているブラウザでは同じ値が来るので何も変わらない。
 */
export function recallPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  const handedOver = fromUrl();
  if (handedOver) {
    // このあとURLは掃除されるので、見つけた時点で控えておく
    rememberPlayerId(handedOver);
    return handedOver;
  }
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

/**
 * 受け取り終わった引き継ぎをURLから消す。
 * ルームのURLをそのまま人に送ったとき、相手が同じ席を名乗ってしまうのを避ける。
 */
export function clearHandoffParams(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!HANDOFF_PARAMS.some(p => url.searchParams.has(p))) return;
  HANDOFF_PARAMS.forEach(p => url.searchParams.delete(p));
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}
