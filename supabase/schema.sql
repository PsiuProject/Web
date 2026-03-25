-- =============================================================================
-- Earth Guardians Project Management - Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

-- 1. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',              -- 'active' | 'pipeline' | 'done'
  status_tag TEXT,                            -- display tag e.g. 'Em Execução / PNAB'
  privacy TEXT DEFAULT 'private',             -- 'public' | 'private' | 'link_only'
  size TEXT DEFAULT 'card-md',               -- 'card-sm' | 'card-md' | 'card-lg'
  territory TEXT DEFAULT 'Brasil',
  axis TEXT[] DEFAULT '{}',                  -- e.g. {'Arte', 'Tecnologia'}
  category TEXT,                              -- 'culture' | 'environmental' | 'climate' | 'restoration' | 'rights'
  year INTEGER,
  parent_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  connection_type TEXT,                       -- connection label key
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  kpi_label TEXT,
  kpi_value TEXT,
  kpi_detail TEXT,
  meta JSONB DEFAULT '[]',                   -- array of {labelKey, value}
  links JSONB DEFAULT '[]',                  -- array of {type, url}
  related_projects TEXT[] DEFAULT '{}',      -- array of project ids
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SUBPROJECTS TABLE
CREATE TABLE IF NOT EXISTS subprojects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PROJECT MEMBERS TABLE
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',                -- 'viewer' | 'editor' | 'owner'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, email)
);

-- 4. PROJECT CONTENT BLOCKS TABLE
CREATE TABLE IF NOT EXISTS project_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,                        -- 'text' | 'image' | 'link'
  content TEXT,
  url TEXT,                                  -- for image/link blocks
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CANVAS POSITIONS TABLE (per-user positions)
CREATE TABLE IF NOT EXISTS canvas_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- =============================================================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_blocks_updated_at
  BEFORE UPDATE ON project_content_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_positions_updated_at
  BEFORE UPDATE ON canvas_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subprojects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_positions ENABLE ROW LEVEL SECURITY;

-- ─── PROJECTS POLICIES ─────────────────────────────────────────────────────
-- Owner can do everything
CREATE POLICY "projects_owner_all" ON projects
  FOR ALL USING (auth.uid() = owner_id);

-- Members can SELECT projects they belong to
CREATE POLICY "projects_member_select" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
    )
  );

-- Editors can UPDATE projects they are members of
CREATE POLICY "projects_editor_update" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'editor'
    )
  );

-- Anyone can see public projects
CREATE POLICY "projects_public_select" ON projects
  FOR SELECT USING (privacy = 'public');

-- Anyone can see link_only projects (security through obscurity via UUID)
CREATE POLICY "projects_link_only_select" ON projects
  FOR SELECT USING (privacy = 'link_only');

-- ─── SUBPROJECTS POLICIES ───────────────────────────────────────────────────
-- Anyone can view subprojects of accessible projects
CREATE POLICY "subprojects_select" ON subprojects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = subprojects.project_id
        AND (
          projects.privacy = 'public'
          OR projects.privacy = 'link_only'
          OR projects.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = projects.id
              AND project_members.user_id = auth.uid()
          )
        )
    )
  );

-- Owner and editors can manage subprojects
CREATE POLICY "subprojects_owner_all" ON subprojects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = subprojects.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "subprojects_editor_manage" ON subprojects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = subprojects.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'editor'
    )
  );

-- ─── PROJECT MEMBERS POLICIES ───────────────────────────────────────────────
-- Owner can manage members
CREATE POLICY "members_owner_all" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Members can see other members of their projects
CREATE POLICY "members_member_select" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members AS pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- ─── CONTENT BLOCKS POLICIES ────────────────────────────────────────────────
-- Anyone can view content blocks of accessible projects
CREATE POLICY "content_blocks_select" ON project_content_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_content_blocks.project_id
        AND (
          projects.privacy = 'public'
          OR projects.privacy = 'link_only'
          OR projects.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = projects.id
              AND project_members.user_id = auth.uid()
          )
        )
    )
  );

-- Owner can manage content blocks
CREATE POLICY "content_blocks_owner_all" ON project_content_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_content_blocks.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Editors can manage content blocks
CREATE POLICY "content_blocks_editor_manage" ON project_content_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_content_blocks.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'editor'
    )
  );

-- ─── CANVAS POSITIONS POLICIES ──────────────────────────────────────────────
-- Users can manage their own canvas positions
CREATE POLICY "canvas_positions_own" ON canvas_positions
  FOR ALL USING (auth.uid() = user_id);

-- Users can see other users' positions for realtime collaboration
CREATE POLICY "canvas_positions_select" ON canvas_positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = canvas_positions.project_id
        AND project_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = canvas_positions.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- AUTO-LINK MEMBERS TO USERS ON SIGNUP/LOGIN
-- Trigger: when a user signs up with an email, find matching project_members rows
-- and set their user_id to the newly created user ID.
-- =============================================================================

CREATE OR REPLACE FUNCTION link_member_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Update any project_members rows with matching email where user_id is NULL
  UPDATE project_members
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert (signup)
CREATE TRIGGER on_user_signup_link_member
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_member_to_user();

-- Also trigger on login (in case user was invited before first signup)
CREATE TRIGGER on_user_login_link_member
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION link_member_to_user();

-- =============================================================================
-- ENABLE REALTIME on key tables
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE subprojects;
ALTER PUBLICATION supabase_realtime ADD TABLE project_content_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_positions;

-- =============================================================================
-- INDEXES for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_privacy ON projects(privacy);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_id);
CREATE INDEX IF NOT EXISTS idx_subprojects_project ON subprojects(project_id);
CREATE INDEX IF NOT EXISTS idx_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_project ON project_content_blocks(project_id);
CREATE INDEX IF NOT EXISTS idx_canvas_positions_project ON canvas_positions(project_id);
CREATE INDEX IF NOT EXISTS idx_canvas_positions_user ON canvas_positions(user_id);
