-- =============================================================================
-- COMPLETE SCHEMA UPDATE - All Missing Tables and Policies
-- Run this to ensure database is fully up to date
-- =============================================================================

-- 1. CANVAS CONNECTIONS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS canvas_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  source_element_id UUID REFERENCES canvas_elements(id) ON DELETE CASCADE NOT NULL,
  target_element_id UUID REFERENCES canvas_elements(id) ON DELETE CASCADE NOT NULL,
  source_side       TEXT NOT NULL DEFAULT 'bottom' CHECK (source_side IN ('top','right','bottom','left')),
  target_side       TEXT NOT NULL DEFAULT 'top' CHECK (target_side IN ('top','right','bottom','left')),
  connection_type   TEXT NOT NULL DEFAULT 'subProject',
  color             TEXT NOT NULL DEFAULT '#b55d3a',
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_canvas_connections_updated_at ON canvas_connections;
CREATE TRIGGER update_canvas_connections_updated_at
  BEFORE UPDATE ON canvas_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for canvas_connections
ALTER TABLE canvas_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connections_select" ON canvas_connections;
CREATE POLICY "connections_select" ON canvas_connections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = canvas_connections.project_id 
    AND (
      privacy IN ('public','link_only') 
      OR owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "connections_editor_all" ON canvas_connections;
CREATE POLICY "connections_editor_all" ON canvas_connections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = canvas_connections.project_id 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('editor','owner'))
    )
  )
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_connections;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connections_project ON canvas_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_connections_source ON canvas_connections(source_element_id);
CREATE INDEX IF NOT EXISTS idx_connections_target ON canvas_connections(target_element_id);

-- 2. AUDIT LOGS POLICIES
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id::text = audit_logs.record_id 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('editor','owner'))
    )
  )
);

DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 3. CONNECTION TYPES POLICIES
ALTER TABLE connection_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connection_types_select" ON connection_types;
CREATE POLICY "connection_types_select" ON connection_types FOR SELECT USING (
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "connection_types_owner_all" ON connection_types;
CREATE POLICY "connection_types_owner_all" ON connection_types FOR ALL USING (
  auth.uid() IS NOT NULL
);

-- 4. CANVAS HISTORY POLICIES (ensure completeness)
ALTER TABLE canvas_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "canvas_history_select" ON canvas_history;
CREATE POLICY "canvas_history_select" ON canvas_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = canvas_history.project_id 
    AND (
      privacy IN ('public','link_only') 
      OR owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "canvas_history_insert" ON canvas_history;
CREATE POLICY "canvas_history_insert" ON canvas_history FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE id = canvas_history.project_id 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
    )
  )
);

-- 5. CUSTOM FONTS POLICIES (ensure completeness)
ALTER TABLE custom_fonts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_fonts_select_own" ON custom_fonts;
CREATE POLICY "custom_fonts_select_own" ON custom_fonts FOR SELECT USING (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "custom_fonts_insert_own" ON custom_fonts;
CREATE POLICY "custom_fonts_insert_own" ON custom_fonts FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "custom_fonts_update_own" ON custom_fonts;
CREATE POLICY "custom_fonts_update_own" ON custom_fonts FOR UPDATE USING (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "custom_fonts_delete_own" ON custom_fonts;
CREATE POLICY "custom_fonts_delete_own" ON custom_fonts FOR DELETE USING (
  auth.uid() = user_id
);

-- 6. COMMENT NOTIFICATIONS POLICIES (ensure completeness)
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_notifications_select_own" ON comment_notifications;
CREATE POLICY "comment_notifications_select_own" ON comment_notifications FOR SELECT USING (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "comment_notifications_insert" ON comment_notifications;
CREATE POLICY "comment_notifications_insert" ON comment_notifications FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "comment_notifications_update_own" ON comment_notifications;
CREATE POLICY "comment_notifications_update_own" ON comment_notifications FOR UPDATE USING (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "comment_notifications_delete_own" ON comment_notifications;
CREATE POLICY "comment_notifications_delete_own" ON comment_notifications FOR DELETE USING (
  auth.uid() = user_id
);

-- 7. CANVAS COMMENTS POLICIES (ensure completeness)
ALTER TABLE canvas_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_update_own" ON canvas_comments;
CREATE POLICY "comments_update_own" ON canvas_comments FOR UPDATE USING (
  auth.uid() = user_id
);

-- 8. CREATE STORAGE BUCKET FOR UPLOADS (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket
DROP POLICY IF EXISTS "uploads_public_read" ON storage.objects;
CREATE POLICY "uploads_public_read" ON storage.objects FOR SELECT USING (
  bucket_id = 'uploads'
);

DROP POLICY IF EXISTS "uploads_authenticated_insert" ON storage.objects;
CREATE POLICY "uploads_authenticated_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'uploads' AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "uploads_owner_delete" ON storage.objects;
CREATE POLICY "uploads_owner_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'uploads' AND owner = auth.uid()
);
