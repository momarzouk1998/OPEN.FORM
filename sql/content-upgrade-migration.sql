-- ================================================
-- تطوير المحتوى: أنواع دروس متعددة + تعليقات
-- ================================================

-- Add new columns to lessons table
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'video';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true;

-- Add is_sequential to curricula
ALTER TABLE curricula ADD COLUMN IF NOT EXISTS is_sequential BOOLEAN DEFAULT true;

-- Create lesson_comments table
CREATE TABLE IF NOT EXISTS lesson_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for lesson_comments
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON lesson_comments FOR SELECT USING (true);
CREATE POLICY "Users can create own comments" ON lesson_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can delete comments" ON lesson_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)
);
