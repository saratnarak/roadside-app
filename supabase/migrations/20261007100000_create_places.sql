CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

DO $$
BEGIN
    CREATE TYPE public.place_type AS ENUM ('repair_shop', 'gas_station');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.places (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type public.place_type NOT NULL,
    description text,
    phone text,
    location extensions.geography(Point, 4326) NOT NULL,
    address text,
    is_verified boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS places_location_gix
    ON public.places
    USING GIST (location);

CREATE INDEX IF NOT EXISTS places_active_type_idx
    ON public.places (type)
    WHERE is_active = true;

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
