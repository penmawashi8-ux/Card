/**
 * 公開ドメイン。canonical / og:url / robots.txt の基準になる。
 *
 * 以前は VERCEL_URL をフォールバックにしていたが、これはデプロイごとに変わる
 * xxx.vercel.app を返すため、本番の canonical が実際に配信しているホストを
 * 指さなくなる（ローカルでは http://localhost:3000 になっていた）。
 * 環境変数が無いときは公開ドメインを使う。
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pageone.boardgamecat.com';
