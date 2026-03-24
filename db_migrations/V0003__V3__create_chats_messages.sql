CREATE TABLE IF NOT EXISTS t_p3626951_support_pro_2_naviga.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT,
  subject TEXT NOT NULL DEFAULT 'Новое обращение',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','pending','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  operator_id UUID REFERENCES t_p3626951_support_pro_2_naviga.users(id),
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web','telegram','whatsapp','email')),
  client_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p3626951_support_pro_2_naviga.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES t_p3626951_support_pro_2_naviga.chats(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client','operator','system')),
  sender_id UUID REFERENCES t_p3626951_support_pro_2_naviga.users(id),
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_operator_id ON t_p3626951_support_pro_2_naviga.chats(operator_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON t_p3626951_support_pro_2_naviga.chats(status);
CREATE INDEX IF NOT EXISTS idx_chats_client_token ON t_p3626951_support_pro_2_naviga.chats(client_token);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON t_p3626951_support_pro_2_naviga.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON t_p3626951_support_pro_2_naviga.messages(created_at);