#!/usr/bin/env node
/**
 * Firebase config setup script.
 *
 * Usage:
 *   node setup-firebase.mjs
 *
 * Paste the Firebase config object from the Firebase console when prompted:
 *
 *   const firebaseConfig = {
 *     apiKey: "...",
 *     authDomain: "...",
 *     databaseURL: "...",
 *     projectId: "...",
 *     storageBucket: "...",
 *     messagingSenderId: "...",
 *     appId: "..."
 *   };
 *
 * The script writes .env.local to both buta/ and page-one/.
 */

import { createInterface } from 'readline';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FIELD_MAP = {
  apiKey:            'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain:        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  databaseURL:       'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
  projectId:         'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket:     'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId:             'NEXT_PUBLIC_FIREBASE_APP_ID',
};

function parseFirebaseConfig(input) {
  try {
    // Wrap in a function and return the config object via eval
    const wrapped = `(() => { ${input.replace(/\bconst\b/g, 'var')}
      // try common variable names
      if (typeof firebaseConfig !== 'undefined') return firebaseConfig;
      if (typeof config !== 'undefined') return config;
      // last resort: extract the object literal directly
      return undefined;
    })()`;
    const result = eval(wrapped); // eslint-disable-line no-eval
    if (result && typeof result === 'object' && result.apiKey) return result;
  } catch {
    // fall through to object literal extraction
  }

  // Try to extract a bare object literal { ... }
  const match = input.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      // Quote bare keys for JSON.parse
      const json = match[0]
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([:,{]\s*)'([^']*)'/g, '$1"$2"')
        .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      return JSON.parse(json);
    } catch {
      // fall through
    }
  }

  throw new Error('Firebase config のパースに失敗しました。コンソールからそのままコピーしてください。');
}

function buildEnvContent(config) {
  const lines = Object.entries(FIELD_MAP)
    .map(([jsKey, envKey]) => {
      const value = config[jsKey] ?? '';
      return `${envKey}=${value}`;
    });
  return lines.join('\n') + '\n';
}

async function readMultilineInput() {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  console.log('Firebase コンソールの「プロジェクトの設定 → マイアプリ → SDK の設定と構成」から');
  console.log('firebaseConfig オブジェクトをコピーして貼り付け、最後に Enter を2回押してください:\n');

  const lines = [];
  let blankCount = 0;

  return new Promise((resolve) => {
    rl.on('line', (line) => {
      if (line.trim() === '') {
        blankCount++;
        if (blankCount >= 2) {
          rl.close();
        }
      } else {
        blankCount = 0;
        lines.push(line);
      }
    });
    rl.on('close', () => resolve(lines.join('\n')));
  });
}

async function main() {
  const input = await readMultilineInput();

  let config;
  try {
    config = parseFirebaseConfig(input);
  } catch (e) {
    console.error('\n❌', e.message);
    process.exit(1);
  }

  const missing = Object.keys(FIELD_MAP).filter((k) => !config[k]);
  if (missing.length > 0) {
    console.warn('\n⚠️  以下のフィールドが見つかりませんでした:', missing.join(', '));
    console.warn('   databaseURL が無い場合は Firebase Realtime Database を作成してください。\n');
  }

  const envContent = buildEnvContent(config);
  const targets = ['buta', 'page-one'];

  for (const dir of targets) {
    const path = resolve(__dirname, dir, '.env.local');
    writeFileSync(path, envContent, 'utf8');
    console.log(`✅ ${dir}/.env.local を作成しました`);
  }

  console.log('\n🎉 完了！ローカル開発は npm run dev でそのまま動きます。');
  console.log('   Vercel にデプロイする場合は、プロジェクト設定の Environment Variables に');
  console.log('   同じ値を追加してください（.env.local はデプロイされません）。');
}

main();
