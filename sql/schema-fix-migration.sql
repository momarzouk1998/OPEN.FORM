-- ================================================
-- Fix: youtube_url NOT NULL → allow NULL (audio/text lessons)
-- Fix: missing updated_at columns on project_invites & user_projects
-- تشغيل بعد كل migrations الأخرى
-- ================================================

-- Fix 1: Allow NULL youtube_url for non-video lesson types
ALTER TABLE lessons ALTER COLUMN youtube_url DROP NOT NULL;

-- Fix 2: Add missing updated_at columns for trigger compatibility
ALTER TABLE project_invites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================================
-- Notification Preferences (opt-out per user)
-- ================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view/update their own preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "System can read preferences" ON notification_preferences FOR SELECT USING (true);

-- Seed default preferences for all existing users (assignment type enabled by default)
INSERT INTO notification_preferences (user_id, notification_type, enabled)
SELECT p.id, 'assignment', true
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np WHERE np.user_id = p.id AND np.notification_type = 'assignment'
);
