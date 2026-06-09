-- Persistent conversation memory for the Palante AI partner.
-- Run this once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS conversation_memories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  memory_text TEXT        NOT NULL
);

CREATE INDEX IF NOT EXISTS conversation_memories_user_created
  ON conversation_memories (user_id, created_at DESC);

ALTER TABLE conversation_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memories"
  ON conversation_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own memories"
  ON conversation_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own memories"
  ON conversation_memories FOR DELETE
  USING (auth.uid() = user_id);
