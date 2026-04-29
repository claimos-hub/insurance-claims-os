-- ClaimPilot Database Schema
-- Run this in Supabase SQL Editor

-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  agent_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Claims table
CREATE TABLE claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('car', 'health', 'life', 'property', 'travel', 'other')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'waiting_customer_docs', 'waiting_insurance', 'in_review', 'approved', 'rejected', 'closed')),
  title TEXT NOT NULL,
  description TEXT,
  insurance_company TEXT NOT NULL,
  policy_number TEXT,
  incident_date DATE NOT NULL,
  claim_amount NUMERIC,
  approved_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents table
CREATE TABLE claim_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Missing documents checklist
CREATE TABLE missing_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_received BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Internal notes
CREATE TABLE claim_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity timeline
CREATE TABLE activity_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('status_change', 'note_added', 'document_uploaded', 'document_requested', 'claim_created', 'amount_updated')),
  description TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate claim numbers
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.claim_number := 'CLM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('claim_number_seq')::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS claim_number_seq START 1;

CREATE TRIGGER set_claim_number
  BEFORE INSERT ON claims
  FOR EACH ROW
  WHEN (NEW.claim_number IS NULL)
  EXECUTE FUNCTION generate_claim_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE missing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (agent sees only their own data)
CREATE POLICY "Agents can view their customers" ON customers FOR ALL USING (agent_id = auth.uid());
CREATE POLICY "Agents can view their claims" ON claims FOR ALL USING (agent_id = auth.uid());
CREATE POLICY "Agents can view claim documents" ON claim_documents FOR ALL USING (claim_id IN (SELECT id FROM claims WHERE agent_id = auth.uid()));
CREATE POLICY "Agents can view missing documents" ON missing_documents FOR ALL USING (claim_id IN (SELECT id FROM claims WHERE agent_id = auth.uid()));
CREATE POLICY "Agents can view claim notes" ON claim_notes FOR ALL USING (claim_id IN (SELECT id FROM claims WHERE agent_id = auth.uid()));
CREATE POLICY "Agents can view activity events" ON activity_events FOR ALL USING (claim_id IN (SELECT id FROM claims WHERE agent_id = auth.uid()));

-- Storage bucket for documents
-- Run in Supabase Dashboard > Storage > Create bucket: "claim-documents" (public: false)
