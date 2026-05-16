'use client';

import { useState } from 'react';

const FIELDS = [
  { key: 'apiKey',            env: 'NEXT_PUBLIC_FIREBASE_API_KEY' },
  { key: 'authDomain',        env: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN' },
  { key: 'databaseURL',       env: 'NEXT_PUBLIC_FIREBASE_DATABASE_URL' },
  { key: 'projectId',         env: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' },
  { key: 'storageBucket',     env: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET' },
  { key: 'messagingSenderId', env: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID' },
  { key: 'appId',             env: 'NEXT_PUBLIC_FIREBASE_APP_ID' },
];

function parseConfig(input: string): Record<string, string> | null {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`
      var firebaseConfig, config;
      ${input.replace(/\bconst\b|\blet\b|\bvar\b/g, 'var')}
      if (typeof firebaseConfig !== 'undefined') return firebaseConfig;
      if (typeof config !== 'undefined') return config;
      return null;
    `);
    const result = fn();
    if (result && result.apiKey) return result;
  } catch {
    // fall through
  }
  return null;
}

export default function SetupPage() {
  const [input, setInput] = useState('');
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  function handleParse() {
    setError('');
    const result = parseConfig(input);
    if (!result) {
      setError('パースできませんでした。Firebase コンソールの firebaseConfig をそのまま貼り付けてください。');
      setValues(null);
      return;
    }
    setValues(result);
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleCopyAll() {
    if (!values) return;
    const lines = FIELDS.map(f => `${f.env}=${values[f.key] ?? ''}`).join('\n');
    await navigator.clipboard.writeText(lines);
    setCopied('ALL');
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-felt p-4 flex flex-col gap-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white text-center pt-4">Firebase セットアップ</h1>
      <p className="text-green-200 text-sm text-center">
        Firebase コンソール →「プロジェクトの設定」→「マイアプリ」→「SDK の設定と構成」から<br />
        <span className="font-mono text-xs">firebaseConfig</span> オブジェクトをコピーして貼り付けてください
      </p>

      <textarea
        className="w-full h-48 rounded-xl p-3 font-mono text-xs bg-black/40 text-green-200 border border-green-800 focus:outline-none focus:border-green-400 resize-none"
        placeholder={'const firebaseConfig = {\n  apiKey: "...",\n  ...\n};'}
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <button
        onClick={handleParse}
        className="btn-primary w-full py-3 rounded-xl font-bold text-lg"
      >
        変換する
      </button>

      {error && (
        <p className="text-red-400 text-sm text-center bg-black/30 rounded-xl p-3">{error}</p>
      )}

      {values && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-green-300 text-sm font-bold">Vercel の Environment Variables に追加：</p>
            <button
              onClick={handleCopyAll}
              className="text-xs bg-green-800 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
            >
              {copied === 'ALL' ? '✅ コピー済み' : '全部コピー'}
            </button>
          </div>

          {FIELDS.map(({ key, env }) => {
            const value = values[key] ?? '';
            const isMissing = !value;
            return (
              <div
                key={key}
                className={`rounded-xl p-3 ${isMissing ? 'bg-red-900/40 border border-red-700' : 'bg-black/40 border border-green-900'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-green-400 break-all flex-1">{env}</span>
                  {!isMissing && (
                    <button
                      onClick={() => handleCopy(value, key)}
                      className="text-xs bg-green-800 hover:bg-green-700 text-white px-2 py-1 rounded-lg shrink-0"
                    >
                      {copied === key ? '✅' : 'コピー'}
                    </button>
                  )}
                </div>
                <div className="font-mono text-xs text-white/80 mt-1 break-all">
                  {isMissing ? (
                    <span className="text-red-400">
                      {key === 'databaseURL'
                        ? '⚠️ 未設定 — Firebase コンソールで Realtime Database を作成してください'
                        : '⚠️ 値が見つかりませんでした'}
                    </span>
                  ) : value}
                </div>
              </div>
            );
          })}

          <p className="text-green-400 text-xs text-center mt-2">
            ぶたのしっぽ・ページワン 両方のVercelプロジェクトに同じ値を設定してください
          </p>
        </div>
      )}
    </div>
  );
}
