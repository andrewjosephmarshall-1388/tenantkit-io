-- Chat messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('landlord', 'tenant')),
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow landlords to see messages for their applications
CREATE POLICY "Landlords can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE a.id = messages.application_id AND p.landlord_id = auth.uid()
    )
  );

-- Allow tenants to see their own messages
CREATE POLICY "Tenants can view own messages" ON messages
  FOR SELECT USING (sender_id = auth.uid()::TEXT);

-- Allow landlords to insert
CREATE POLICY "Landlords can insert" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE a.id = messages.application_id AND p.landlord_id = auth.uid()
    )
  );

-- Allow tenants to insert
CREATE POLICY "Tenants can insert" ON messages
  FOR INSERT WITH CHECK (sender_role = 'tenant');
