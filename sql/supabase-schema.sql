-- ================================================
-- أوراد أحلى شباب - Supabase Database Schema (Complete)
-- Run this entire file in Supabase SQL Editor for a fresh DB
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- ENUMS (Custom Types for Dropdowns)
-- ================================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('volunteer', 'supervisor', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_gender AS ENUM ('male', 'female'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ================================================
-- PROFILES TABLE (User profiles)
-- ================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    gender user_gender NOT NULL,
    role user_role DEFAULT 'volunteer'::user_role,
    status user_status DEFAULT 'pending'::user_status,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- PROJECTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'book',
    color TEXT DEFAULT '#10B981',
    target_gender TEXT CHECK (target_gender IN ('male', 'female', 'both')) DEFAULT 'both',
    image_url TEXT,
    visibility TEXT DEFAULT 'public',
    is_archived BOOLEAN DEFAULT false,
    original_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    modules JSONB DEFAULT '{"forms": true, "curriculum": false}',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- FORMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    target_gender TEXT CHECK (target_gender IN ('male', 'female', 'both')) DEFAULT 'both',
    is_active BOOLEAN DEFAULT true,
    time_limit INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    allow_delete_responses BOOLEAN DEFAULT false,
    randomize_questions BOOLEAN DEFAULT false,
    allow_multiple BOOLEAN DEFAULT false,
    max_attempts INTEGER DEFAULT 1,
    show_results BOOLEAN DEFAULT true,
    pass_score DECIMAL(5,2) DEFAULT 0.00,
    image_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- QUESTIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    type TEXT CHECK (type IN ('text', 'textarea', 'single_choice', 'multiple_choice', 'scale', 'ranking', 'matrix', 'dropdown', 'date', 'time', 'file_upload')) DEFAULT 'text',
    order_index INTEGER DEFAULT 0,
    required BOOLEAN DEFAULT false,
    points DECIMAL(10,2) DEFAULT 0,
    options JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- FORM_RESPONSES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    score DECIMAL(10,2) DEFAULT 0,
    max_score DECIMAL(10,2) DEFAULT 0,
    answers JSONB DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- CURRICULA TABLE (Educational content per project)
-- ================================================
CREATE TABLE IF NOT EXISTS curricula (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_sequential BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- LESSONS TABLE (Individual lessons within a curriculum)
-- ================================================
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'video',
    youtube_url TEXT,
    audio_url TEXT,
    content TEXT,
    allow_comments BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- LESSON_PROGRESS TABLE (Tracks user completion per lesson)
-- ================================================
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- ================================================
-- LESSON_COMMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS lesson_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- PROJECT INVITES (Private project access via invite links)
-- ================================================
CREATE TABLE IF NOT EXISTS project_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    max_uses INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- USER PROJECTS (Direct user-project assignments)
-- ================================================
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- ================================================
-- PROJECT SUPERVISORS (Additional supervisors)
-- ================================================
CREATE TABLE IF NOT EXISTS project_supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- ================================================
-- PROJECT BANS (Blocked users)
-- ================================================
CREATE TABLE IF NOT EXISTS project_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- ================================================
-- NOTIFICATION PREFERENCES (opt-out per user)
-- ================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- ================================================
-- NOTIFICATIONS
-- ================================================
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

-- ================================================
-- FUNCTIONS
-- ================================================

-- Helper function to check if current user is admin (avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, gender, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'مستخدم جديد'),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'gender', ''), 'male')::user_gender,
        'volunteer'::user_role,
        'pending'::user_status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "View Profiles Policy" ON public.profiles FOR SELECT USING ( auth.uid() = id OR public.is_admin() );
CREATE POLICY "Insert Profiles Policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Update Profiles Policy" ON public.profiles FOR UPDATE USING ( auth.uid() = id OR public.is_admin() );
CREATE POLICY "Allow public read for email check" ON public.profiles FOR SELECT USING ( true );

-- PROJECTS POLICIES
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
CREATE POLICY "Admins can view archived" ON projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Supervisors and admins can create projects" ON projects FOR INSERT WITH CHECK ( EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role) AND status = 'approved' ) );
CREATE POLICY "Supervisors can update their projects" ON projects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM project_supervisors WHERE project_supervisors.project_id = projects.id AND project_supervisors.user_id = auth.uid())
);
CREATE POLICY "Admins manage projects" ON projects FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- FORMS POLICIES
CREATE POLICY "Anyone can view forms" ON forms FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can create forms" ON forms FOR INSERT WITH CHECK ( EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role) ) );
CREATE POLICY "Supervisors and admins can update forms" ON forms FOR UPDATE USING ( EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role) ) );

-- QUESTIONS POLICIES
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can manage questions" ON questions FOR ALL USING ( EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role) ) );

-- FORM_RESPONSES POLICIES
CREATE POLICY "Users can view own responses" ON form_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own responses" ON form_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Supervisors can view responses in their gender" ON form_responses FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p1
        JOIN profiles p2 ON p2.id = form_responses.user_id
        WHERE p1.id = auth.uid() 
        AND p1.role IN ('supervisor'::user_role, 'admin'::user_role)
        AND ( p1.role = 'admin'::user_role OR p1.gender = p2.gender )
    )
);

-- CURRICULA POLICIES
CREATE POLICY "Anyone can view curricula" ON curricula FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can manage curricula" ON curricula FOR ALL USING ( EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role) ) );

-- LESSONS POLICIES
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can manage lessons" ON lessons FOR ALL USING ( EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role) ) );

-- LESSON_PROGRESS POLICIES
CREATE POLICY "Users can view own progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON lesson_progress FOR SELECT USING ( EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role ) );

-- LESSON_COMMENTS POLICIES
CREATE POLICY "Anyone can view comments" ON lesson_comments FOR SELECT USING (true);
CREATE POLICY "Users can create own comments" ON lesson_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can delete comments" ON lesson_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
);

-- PROJECT_INVITES POLICIES
CREATE POLICY "Anyone can view invites by token" ON project_invites FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can manage invites" ON project_invites FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor'::user_role, 'admin'::user_role))
);

-- USER_PROJECTS POLICIES
CREATE POLICY "Users can view own project assignments" ON user_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all assignments" ON user_projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
);
CREATE POLICY "Anyone can insert own via RPC" ON user_projects FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PROJECT_SUPERVISORS POLICIES
CREATE POLICY "Anyone can view supervisors" ON project_supervisors FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can manage supervisors" ON project_supervisors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- PROJECT_BANS POLICIES
CREATE POLICY "Anyone can view bans" ON project_bans FOR SELECT USING (true);
CREATE POLICY "Supervisors and admins can manage bans" ON project_bans FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
);

-- NOTIFICATION PREFERENCES POLICIES
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "System can read preferences" ON notification_preferences FOR SELECT USING (true);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ================================================
-- TRIGGERS
-- ================================================

-- Auth trigger: auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_curricula_updated_at ON curricula;
CREATE TRIGGER update_curricula_updated_at BEFORE UPDATE ON curricula FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_project_invites_updated_at ON project_invites;
CREATE TRIGGER update_project_invites_updated_at BEFORE UPDATE ON project_invites FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_projects_updated_at ON user_projects;
CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- SEED DATA (Sample Projects)
-- ================================================
INSERT INTO projects (name, description, icon, color, target_gender)
VALUES 
    ('المدرسة الإيمانية', 'مشروع لتعليم وتعميق المفاهيم الإيمانية', 'mosque', '#10B981', 'both'),
    ('أوراد الصباح', 'أوراد وأذكار الصباح', 'sun', '#F59E0B', 'both'),
    ('حلقات التحفيظ', 'حلقات لتحفيظ القرآن الكريم', 'quran', '#6366F1', 'both')
ON CONFLICT DO NOTHING;

-- ================================================
-- STORAGE BUCKET (avatars + project images)
-- ================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT DO NOTHING;

-- Avatar policies
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Project images policies
CREATE POLICY "Public can view project images" ON storage.objects FOR SELECT USING (bucket_id = 'project-images');
CREATE POLICY "Authenticated users can upload project images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'project-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'supervisor') AND profiles.status = 'approved')
);
CREATE POLICY "Authenticated users can delete project images" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'project-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'supervisor') AND profiles.status = 'approved')
);
