-- Add payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL,
  property_id UUID NOT NULL,
  tenant_email TEXT,
  tenant_name TEXT,
  amount INTEGER NOT NULL, -- in cents
  due_date DATE,
  status TEXT DEFAULT 'pending', -- pending, paid, failed
  stripe_payment_intent_id TEXT,
  stripe_payment_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Add payment_requests to properties table reference (if not exists)
ALTER TABLE payment_requests ADD CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES properties(id);
ALTER TABLE payment_requests ADD CONSTRAINT fk_landlord FOREIGN KEY (landlord_id) REFERENCES landlords(id);