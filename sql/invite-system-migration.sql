-- ================================================
-- INVITE SYSTEM TABLES (تشغيل في SQL Editor)
-- ================================================

-- Project visibility: 'public' (default) or 'private'
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Project invites table
CREATE TABLE IF NOT EXISTS project_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    max_uses INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-project assignments (for private projects)
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- Function to join a project via invite token
CREATE OR REPLACE FUNCTION public.join_project_via_invite(invite_token TEXT)
RETURNS JSONB AS $$
DECLARE
    inv project_invites%ROWTYPE;
    result JSONB;
BEGIN
    SELECT * INTO inv FROM project_invites WHERE token = invite_token;

    IF inv.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invite_not_found');
    END IF;

    IF inv.expires_at IS NOT NULL AND inv.expires_at < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'invite_expired');
    END IF;

    IF inv.max_uses > 0 AND inv.use_count >= inv.max_uses THEN
        RETURN jsonb_build_object('success', false, 'error', 'invite_max_uses');
    END IF;

    INSERT INTO user_projects (user_id, project_id)
    VALUES (auth.uid(), inv.project_id)
    ON CONFLICT (user_id, project_id) DO NOTHING;

    UPDATE project_invites SET use_count = use_count + 1 WHERE id = inv.id;

    RETURN jsonb_build_object('success', true, 'project_id', inv.project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for project_invites
ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view invites by token" ON project_invites FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can manage invites" ON project_invites FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role))
);

-- RLS for user_projects
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project assignments" ON user_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all assignments" ON user_projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
);
CREATE POLICY "Anyone can insert own via RPC" ON user_projects FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update projects SELECT policy to filter private projects
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
CREATE POLICY "Anyone can view public projects" ON projects FOR SELECT USING (
    visibility IS DISTINCT FROM 'private'
    OR EXISTS (SELECT 1 FROM user_projects WHERE user_projects.project_id = projects.id AND user_projects.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role))
);

-- Trigger for updated_at on project_invites
DROP TRIGGER IF EXISTS update_project_invites_updated_at ON project_invites;
CREATE TRIGGER update_project_invites_updated_at BEFORE UPDATE ON project_invites FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_projects_updated_at ON user_projects;
CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
