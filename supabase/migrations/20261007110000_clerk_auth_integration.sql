-- Migration: 20261007110000_clerk_auth_integration.sql
-- Description: Transition user identity to Clerk (text user IDs) and add users & reports tables

-- 1. Update places.created_by to text to support Clerk user IDs (e.g., 'user_2...')
ALTER TABLE public.places DROP CONSTRAINT IF EXISTS places_created_by_fkey;
ALTER TABLE public.places ALTER COLUMN created_by TYPE text USING created_by::text;

-- 2. Create public.users table mapped to Clerk external identity
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id text UNIQUE NOT NULL,
    email text,
    display_name text,
    avatar_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_clerk_user_id_idx ON public.users (clerk_user_id);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create public.reports table for reporting inaccurate or closed places
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    reported_by text NOT NULL,
    reason text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_place_id_idx ON public.reports (place_id);
CREATE INDEX IF NOT EXISTS reports_reported_by_idx ON public.reports (reported_by);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
