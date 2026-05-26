-- Forms.OpenappO - Points & Referrals System
-- Phase 1: Database tables for points, commissions, subscriptions, withdrawals

-- 1. subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'pro',
  plan_price_gross NUMERIC NOT NULL DEFAULT 500,
  plan_price_net NUMERIC NOT NULL DEFAULT 438.60,
  tax_amount NUMERIC NOT NULL DEFAULT 61.40,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  renewed_at TIMESTAMPTZ,
  referred_by UUID REFERENCES profiles(id),
  renewal_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_referred ON subscriptions(referred_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 2. agent_commissions table
CREATE TABLE IF NOT EXISTS agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  renewal_number INT NOT NULL,
  gross_commission NUMERIC NOT NULL,
  tax_deducted NUMERIC NOT NULL,
  net_commission NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
  available_at TIMESTAMPTZ,
  type TEXT NOT NULL DEFAULT 'commission'
    CHECK (type IN ('commission', 'refund_deduction')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_agent ON agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON agent_commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_available ON agent_commissions(available_at);

-- 3. template_points table
CREATE TABLE IF NOT EXISTS template_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES user_templates(id) ON DELETE CASCADE,
  copied_by_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  points INT NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
  available_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, copied_by_id)
);

CREATE INDEX IF NOT EXISTS idx_template_points_owner ON template_points(template_owner_id);
CREATE INDEX IF NOT EXISTS idx_template_points_status ON template_points(status);

-- 4. withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('points', 'commission')),
  amount_requested NUMERIC NOT NULL,
  amount_after_tax NUMERIC NOT NULL,
  tax_deducted NUMERIC NOT NULL,
  points_used INT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash')),
  payment_account TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  admin_id UUID REFERENCES profiles(id),
  admin_note TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);

-- 5. admin_action_log table
CREATE TABLE IF NOT EXISTS admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_log_admin ON admin_action_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_target ON admin_action_log(target_id);

-- 6. Add columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS points_balance INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_pending INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_pending NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_referrals INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_referrals INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_earned INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_commission_earned NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_points_withdrawn INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_commission_withdrawn NUMERIC DEFAULT 0;

-- 7. RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_log ENABLE ROW LEVEL SECURITY;

-- Users see their own data
CREATE POLICY "users_view_own_subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_view_own_commissions_agent" ON agent_commissions FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "users_view_own_commissions_client" ON agent_commissions FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "users_view_own_template_points" ON template_points FOR SELECT USING (template_owner_id = auth.uid() OR copied_by_id = auth.uid());
CREATE POLICY "users_view_own_withdrawals" ON withdrawal_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_withdrawals" ON withdrawal_requests FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins see everything
CREATE POLICY "admins_all_subscriptions" ON subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admins_all_commissions" ON agent_commissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admins_all_template_points" ON template_points FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admins_all_withdrawals" ON withdrawal_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admins_all_action_log" ON admin_action_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admins_insert_action_log" ON admin_action_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Service role: allow all (RPC functions use service role)
-- Note: service_role bypasses RLS, but these policies ensure regular users
-- can only see their own data
