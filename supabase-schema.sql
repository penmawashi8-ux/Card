-- ぶたのしっぽ: Supabase テーブル定義
-- Supabase の SQL Editor に貼り付けて実行してください

CREATE TABLE IF NOT EXISTS rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  host_id     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'waiting',
  game_state  JSONB,
  settings    JSONB NOT NULL,
  players     JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Realtime を有効化
ALTER TABLE rooms REPLICA IDENTITY FULL;

-- RLS（Row Level Security）を無効化 ※本番では要検討
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
