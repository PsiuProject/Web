-- =============================================================================
-- Canvas Elements & Comments Schema
-- Run this after the main schema.sql
-- =============================================================================

-- CANVAS ELEMENTS (unified element system)
CREATE TABLE IF NOT EXISTS canvas_elements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('card','text','image','link','button')),
  
  -- Position & Size
  position_x      FLOAT DEFAULT 0,
  position_y      FLOAT DEFAULT 0,
  width           FLOAT DEFAULT 200,
  height          FLOAT DEFAULT 150,
  rotation        FLOAT DEFAULT 0,
  z_index         INTEGER DEFAULT 0,
  
  -- Content (JSONB for i18n)
  content         JSONB DEFAULT '{}',
  
  -- Styling
  background      TEXT,
  border_color    TEXT,
  text_color      TEXT,
  font_size       INTEGER,
  
  -- Relations
  parent_id       UUID REFERENCES canvas_elements(id) ON DELETE CASCADE,
  connection_type TEXT,
  
  -- Metadata
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- CANVAS COMMENTS (Google Docs style)
CREATE TABLE IF NOT EXISTS canvas_comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  element_id        UUID REFERENCES canvas_elements(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES canvas_comments(id) ON DELETE CASCADE,
  
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  content           TEXT NOT NULL,
  
  -- Attachments
  attachment_type   TEXT CHECK (attachment_type IN ('image','doc','link')),
  attachment_url    TEXT,
  
  -- Position (if not attached to element)
  position_x        FLOAT,
  position_y        FLOAT,
  
  -- Status
  resolved          BOOLEAN DEFAULT false,
  
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- COMMENT NOTIFICATIONS
CREATE TABLE IF NOT EXISTS comment_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_id      UUID REFERENCES canvas_comments(id) ON DELETE CASCADE NOT NULL,
  read            BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Triggers
CREATE OR REPLACE FUNCTION update_canvas_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_canvas_elements_updated_at ON canvas_elements;
CREATE TRIGGER update_canvas_elements_updated_at
  BEFORE UPDATE ON canvas_elements FOR EACH ROW EXECUTE FUNCTION update_canvas_updated_at();

DROP TRIGGER IF EXISTS update_canvas_comments_updated_at ON canvas_comments;
CREATE TRIGGER update_canvas_comments_updated_at
  BEFORE UPDATE ON canvas_comments FOR EACH ROW EXECUTE FUNCTION update_canvas_updated_at();

-- Notification trigger
CREATE OR REPLACE FUNCTION notify_comment_mentions()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify project members when new comment is added
  INSERT INTO comment_notifications (user_id, comment_id)
  SELECT DISTINCT pm.user_id, NEW.id
  FROM project_members pm
  WHERE pm.project_id = NEW.project_id
    AND pm.user_id != NEW.user_id
    AND pm.user_id IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_create_notify ON canvas_comments;
CREATE TRIGGER on_comment_create_notify
  AFTER INSERT ON canvas_comments
  FOR EACH ROW EXECUTE FUNCTION notify_comment_mentions();

-- RLS
ALTER TABLE canvas_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

-- Elements: visible to anyone who can see the project
DROP POLICY IF EXISTS "elements_select" ON canvas_elements;
CREATE POLICY "elements_select" ON canvas_elements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = canvas_elements.project_id 
    AND (
      privacy IN ('public','link_only') 
      OR owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
    )
  )
);

-- Elements: editors can modify
DROP POLICY IF EXISTS "elements_editor_all" ON canvas_elements;
CREATE POLICY "elements_editor_all" ON canvas_elements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = canvas_elements.project_id 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('editor','owner'))
    )
  )
);

-- Comments: visible to project members
DROP POLICY IF EXISTS "comments_select" ON canvas_comments;
CREATE POLICY "comments_select" ON canvas_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = canvas_comments.project_id 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
    )
  )
);

-- Comments: commenters+ can create
DROP POLICY IF EXISTS "comments_insert" ON canvas_comments;
CREATE POLICY "comments_insert" ON canvas_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = canvas_comments.project_id 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('commenter','editor','owner'))
    )
  )
);

-- Comments: owner can delete any, users can delete their own
DROP POLICY IF EXISTS "comments_delete" ON canvas_comments;
CREATE POLICY "comments_delete" ON canvas_comments FOR DELETE USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM projects 
    WHERE id = canvas_comments.project_id 
    AND owner_id = auth.uid()
  )
);

-- Notifications: users see their own
DROP POLICY IF EXISTS "notifications_own" ON comment_notifications;
CREATE POLICY "notifications_own" ON comment_notifications FOR ALL USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_elements;
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_notifications;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_elements_project ON canvas_elements(project_id);
CREATE INDEX IF NOT EXISTS idx_elements_parent ON canvas_elements(parent_id);
CREATE INDEX IF NOT EXISTS idx_elements_type ON canvas_elements(type);
CREATE INDEX IF NOT EXISTS idx_comments_project ON canvas_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_element ON canvas_comments(element_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON canvas_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON comment_notifications(user_id, read);
