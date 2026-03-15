-- Migration: Create clients table and link to appointments
-- Date: 2024

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  surname TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add client_id to appointments (can be NULL for backwards compatibility)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- 3. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);

-- 4. Migration: Import existing unique clients from appointments
-- This creates a client for each unique email that exists in appointments
INSERT INTO clients (name, surname, email, phone, created_at)
SELECT 
  SPLIT_PART(client_name, ' ', 1) as name,
  CASE 
    WHEN POSITION(' ' IN client_name) > 0 
    THEN SUBSTRING(client_name FROM POSITION(' ' IN client_name) + 1)
    ELSE NULL 
  END as surname,
  client_email,
  client_phone,
  MIN(appointment_date) as created_at
FROM appointments 
WHERE client_email IS NOT NULL AND client_email != ''
GROUP BY client_name, client_email, client_phone
ON CONFLICT DO NOTHING;

-- 5. Update appointments with client_id
-- Link appointments to clients based on email match
UPDATE appointments a
SET client_id = c.id
FROM clients c
WHERE a.client_email = c.email 
  AND a.client_id IS NULL
  AND c.email IS NOT NULL;

-- 6. Add unique constraint on clients (either email OR phone)
-- We can't have a true unique constraint on both, but we can prevent exact duplicates
-- This is handled at application level for flexibility
