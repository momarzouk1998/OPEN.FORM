-- Forms.OpenappO - Daily Cron Job to release pending balances
-- Run this in Supabase SQL Editor after creating the tables

-- Function to release pending points and commissions
CREATE OR REPLACE FUNCTION release_pending_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Release template points
  UPDATE template_points
  SET status = 'available'
  WHERE status = 'pending' AND available_at <= NOW();

  -- Update profiles: move points from pending to balance
  UPDATE profiles p
  SET
    points_balance = p.points_balance + tp.released_points,
    points_pending = p.points_pending - tp.released_points
  FROM (
    SELECT template_owner_id, SUM(points) AS released_points
    FROM template_points
    WHERE status = 'available'
      AND available_at <= NOW()
      AND available_at > NOW() - INTERVAL '1 day'
    GROUP BY template_owner_id
  ) tp
  WHERE p.id = tp.template_owner_id;

  -- Release agent commissions
  UPDATE agent_commissions
  SET status = 'available'
  WHERE status = 'pending' AND available_at <= NOW();

  -- Update profiles: move commissions from pending to balance
  UPDATE profiles p
  SET
    commission_balance = p.commission_balance + ac.released_commission,
    commission_pending = p.commission_pending - ac.released_commission
  FROM (
    SELECT agent_id, SUM(net_commission) AS released_commission
    FROM agent_commissions
    WHERE status = 'available'
      AND available_at <= NOW()
      AND available_at > NOW() - INTERVAL '1 day'
    GROUP BY agent_id
  ) ac
  WHERE p.id = ac.agent_id;
END;
$$;

-- To set up a daily cron job in Supabase:
-- 1. Go to Database → Extensions and enable 'pg_cron'
-- 2. Run:
--    SELECT cron.schedule('daily-release', '0 0 * * *', 'SELECT release_pending_balances()');
--
-- This will run daily at midnight.
-- To view scheduled jobs: SELECT * FROM cron.job;
-- To remove: SELECT cron.unschedule('daily-release');
