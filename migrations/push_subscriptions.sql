-- Create table for push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Policies: only admins can manage their own subscriptions
CREATE POLICY "Admins can view their own subscriptions" ON public.push_subscriptions FOR
SELECT TO authenticated USING (auth.uid() = admin_id);
CREATE POLICY "Admins can insert their own subscriptions" ON public.push_subscriptions FOR
INSERT TO authenticated WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admins can update their own subscriptions" ON public.push_subscriptions FOR
UPDATE TO authenticated USING (auth.uid() = admin_id);
CREATE POLICY "Admins can delete their own subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = admin_id);