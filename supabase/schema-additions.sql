-- =============================================================================
-- Schema additions for: soft-delete comments, reply_to_id, custom fonts
-- Run after schema-canvas.sql
-- =============================================================================

-- Add soft-delete and reply_to_id to canvas_comments
ALTER TABLE canvas_comments
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES canvas_comments(id) ON DELETE SET NULL;

-- Custom fonts table
CREATE TABLE IF NOT EXISTS custom_fonts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  font_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, font_name)
);

ALTER TABLE custom_fonts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fonts_own" ON custom_fonts;
CREATE POLICY "fonts_own" ON custom_fonts FOR ALL USING (auth.uid() = user_id);

-- Update comments select policy to include soft-deleted (show grayed)
-- (existing policy already selects all, soft-delete is handled in app layer)

-- Index for reply_to_id
CREATE INDEX IF NOT EXISTS idx_comments_reply_to ON canvas_comments(reply_to_id);

-- Update RLS: only owner can hard-delete; commenters can soft-delete their own
-- (app uses UPDATE deleted=true, not DELETE, so existing policies work)
