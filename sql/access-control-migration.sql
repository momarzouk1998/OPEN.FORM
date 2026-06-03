-- ================================================
-- Access Control: supervisors, bans, notifications, archive, clone
-- ================================================

-- Add archive + owner columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS original_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add expires_at to user_projects
ALTER TABLE user_projects ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Project supervisors (additional supervisors beyond creator)
CREATE TABLE IF NOT EXISTS project_supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Project bans (blocked users)
CREATE TABLE IF NOT EXISTS project_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE project_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- project_supervisors policies
CREATE POLICY "Anyone can view supervisors" ON project_supervisors FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can manage supervisors" ON project_supervisors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- project_bans policies
CREATE POLICY "Anyone can view bans" ON project_bans FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can manage bans" ON project_bans FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Update projects SELECT policy
DROP POLICY IF EXISTS "Anyone can view public projects" ON projects;
CREATE POLICY "Anyone can view public projects" ON projects FOR SELECT USING (
    is_archived = false
    AND (
        visibility IS DISTINCT FROM 'private'
        OR EXISTS (SELECT 1 FROM user_projects WHERE user_projects.project_id = projects.id AND user_projects.user_id = auth.uid() AND (user_projects.expires_at IS NULL OR user_projects.expires_at > NOW()))
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
        OR EXISTS (SELECT 1 FROM project_supervisors WHERE project_supervisors.project_id = projects.id AND project_supervisors.user_id = auth.uid())
    )
    AND NOT EXISTS (SELECT 1 FROM project_bans WHERE project_bans.project_id = projects.id AND project_bans.user_id = auth.uid())
);

-- Admins can see archived projects
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
CREATE POLICY "Admins manage projects" ON projects FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can view archived" ON projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update supervisor/volunteer policies for created_by OR project_supervisors
DROP POLICY IF EXISTS "Supervisors and admins can update projects" ON projects;
CREATE POLICY "Supervisors can update their projects" ON projects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM project_supervisors WHERE project_supervisors.project_id = projects.id AND project_supervisors.user_id = auth.uid())
);
