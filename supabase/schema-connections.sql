-- =============================================================================
-- Canvas Connections Table - Manual connections between elements
-- =============================================================================

CREATE TABLE IF NOT EXISTS canvas_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Connection endpoints (support both property names for backwards compatibility)
  source_element_id UUID REFERENCES canvas_elements(id) ON DELETE CASCADE NOT NULL,
  target_element_id UUID REFERENCES canvas_elements(id) ON DELETE CASCADE NOT NULL,
  
  -- Port sides (top, right, bottom, left)
  source_side       TEXT NOT NULL DEFAULT 'bottom' CHECK (source_side IN ('top','right','bottom','left')),
  target_side       TEXT NOT NULL DEFAULT 'top' CHECK (target_side IN ('top','right','bottom','left')),
  
  -- Connection styling
  connection_type   TEXT NOT NULL DEFAULT 'subProject',
  color             TEXT NOT NULL DEFAULT '#b55d3a',
  
  -- Metadata
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_canvas_connections_updated_at ON canvas_connections;
CREATE TRIGGER update_canvas_connections_updated_at
  BEFORE UPDATE ON canvas_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE canvas_connections ENABLE ROW LEVEL SECURITY;

-- Select: visible to anyone who can see the project
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

-- All operations: editors+ can manage connections
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
