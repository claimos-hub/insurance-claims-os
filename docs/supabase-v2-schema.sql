-- ClaimPilot V2 Database Schema
-- Replaces the original schema with intake-focused tables
-- Run this in Supabase SQL Editor

-- 1. Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Intake Sessions
CREATE TABLE IF NOT EXISTS intake_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  phone TEXT NOT NULL,
  current_step TEXT NOT NULL DEFAULT 'START',
  status TEXT NOT NULL DEFAULT 'active',
  collected_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Intake Messages
CREATE TABLE IF NOT EXISTS intake_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES intake_sessions(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('user', 'bot')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Claims
CREATE TABLE IF NOT EXISTS claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id),
  intake_session_id UUID REFERENCES intake_sessions(id),
  claim_type TEXT NOT NULL DEFAULT 'car',
  status TEXT NOT NULL DEFAULT 'new',
  event_date TEXT,
  event_time TEXT,
  event_location TEXT,
  description TEXT,
  vehicle_number TEXT,
  policy_number TEXT,
  injuries BOOLEAN,
  third_party_involved BOOLEAN,
  third_party_details JSONB,
  missing_documents JSONB DEFAULT '[]',
  readiness_score INTEGER DEFAULT 0,
  ai_summary TEXT,
  inspector_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Claim Documents
CREATE TABLE IF NOT EXISTS claim_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'missing',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at for intake_sessions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intake_sessions_updated_at
  BEFORE UPDATE ON intake_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-generate claim numbers
CREATE SEQUENCE IF NOT EXISTS claim_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.claim_number := 'CLM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('claim_number_seq')::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_claim_number
  BEFORE INSERT ON claims
  FOR EACH ROW
  WHEN (NEW.claim_number IS NULL OR NEW.claim_number = '')
  EXECUTE FUNCTION generate_claim_number();

-- Disable RLS for now (server-side only access via service role key)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON customers FOR ALL USING (true);
CREATE POLICY "Service role full access" ON intake_sessions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON intake_messages FOR ALL USING (true);
CREATE POLICY "Service role full access" ON claims FOR ALL USING (true);
CREATE POLICY "Service role full access" ON claim_documents FOR ALL USING (true);
