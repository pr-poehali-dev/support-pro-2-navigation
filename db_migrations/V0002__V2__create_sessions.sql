CREATE TABLE IF NOT EXISTS t_p3626951_support_pro_2_naviga.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES t_p3626951_support_pro_2_naviga.users(id),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON t_p3626951_support_pro_2_naviga.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON t_p3626951_support_pro_2_naviga.sessions(user_id);