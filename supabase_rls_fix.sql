-- PSIU Supabase RLS Fix - Infinite Recursion in project_members policy
-- Run this in your Supabase SQL Editor to fix the 42P17 error
-- 
-- The error "infinite recursion detected in policy for relation 'project_members'"
-- occurs when RLS policies have circular dependencies. This script fixes it.

-- ============================================================
-- STEP 1: Drop existing problematic policies
-- ============================================================

-- Drop policies on project_members if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON project_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON project_members;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON project_members;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON project_members;

-- Drop policies on projects if they reference project_members recursively
DROP POLICY IF EXISTS "Enable read access based on membership" ON projects;
DROP POLICY IF EXISTS "Allow public read access" ON projects;
DROP POLICY IF EXISTS "Enable insert for owners" ON projects;
DROP POLICY IF EXISTS "Enable update for owners" ON projects;
DROP POLICY IF EXISTS "Enable delete for owners" ON projects;

-- ============================================================
-- STEP 2: Create fixed policies WITHOUT circular dependencies
-- ============================================================

-- Projects table policies
-- Allow anyone to view projects (public read)
CREATE POLICY "Allow public read access to projects"
ON projects FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert projects they own
CREATE POLICY "Allow project creation by owner"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Allow project owners or members to update
CREATE POLICY "Allow owner/member update of projects"
ON projects FOR UPDATE
TO authenticated
USING (
  auth.uid() = owner_id OR 
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = id AND pm.user_id = auth.uid()
  )
);

-- Allow project owners to delete
CREATE POLICY "Allow owner delete of projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- ============================================================
-- STEP 3: Project Members table policies (simplified)
-- ============================================================

-- Allow authenticated users to view project memberships
CREATE POLICY "Allow authenticated read of project_members"
ON project_members FOR SELECT
TO authenticated
USING (true);

-- Allow project owners to add members
CREATE POLICY "Allow owner to add project_members"
ON project_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  )
);

-- Allow project owners to update member roles
CREATE POLICY "Allow owner to update project_members"
ON project_members FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  )
);

-- Allow project owners to remove members
CREATE POLICY "Allow owner to delete project_members"
ON project_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_id AND p.owner_id = auth.uid()
  )
);

-- Allow users to remove themselves
CREATE POLICY "Allow self-removal from project_members"
ON project_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- STEP 4: Verify policies are created
-- ============================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('projects', 'project_members')
ORDER BY tablename, policyname;

-- ============================================================
-- NOTES:
-- ============================================================
-- 1. The key fix is avoiding recursive calls between projects and project_members
-- 2. We use simple EXISTS checks instead of complex permission lookups
-- 3. Owner-based checks are direct (auth.uid() = owner_id)
-- 4. Member checks use simple EXISTS without nested policy evaluations
-- 
-- If you still have issues, check:
-- - That the 'projects' table has an 'owner_id' column
-- - That the 'project_members' table has 'project_id' and 'user_id' columns
-- - That no triggers are causing recursive updates
