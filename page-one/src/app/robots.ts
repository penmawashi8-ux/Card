import type { MetadataRoute } from 'next';

/**
 * このサブドメインは noindex（layout.tsx の metadata.robots を参照）。
 *
 * クロール自体は許可しておく必要がある。robots.txt で弾くと、
 * Google が noindex のメタタグを読めずインデックスが消えない。
 * noindex のページを載せるサイトマップは出さない。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/game', '/online/'],
    },
  };
}
