-- ==============================================================
-- MIGRATION: Add payment_proof_url and pending_payment status
-- ==============================================================
-- Adds payment proof URL column and new 'pending_payment' status
-- for appointments that require payment verification.
-- ==============================================================

-- Add payment_proof_url column to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Update status check constraint to include 'pending_payment'
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_status_check
CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'cancelled', 'completed'));