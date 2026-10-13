-- ==============================================================================
-- MOTORBIKE MANAGEMENT SYSTEM - SUPABASE SCHEMA & STORAGE
-- ==============================================================================

-- 1. Enable pgcrypto / uuid extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create bikes table
CREATE TABLE IF NOT EXISTS public.bikes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    current_km_hours NUMERIC NOT NULL DEFAULT 0,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'naked', -- Valori supportati: 'naked', 'sport', 'adventure', 'enduro', 'cross', 'cruiser', 'scooter'
    primary_color TEXT NOT NULL DEFAULT '#f97316',
    accent_color TEXT NOT NULL DEFAULT '#18181b',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migration support for existing databases
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'naked'; -- 'naked', 'sport', 'adventure', 'enduro', 'cross', 'cruiser', 'scooter'
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#f97316';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#18181b';

-- Index for bikes
CREATE INDEX IF NOT EXISTS idx_bikes_created_at ON public.bikes(created_at DESC);

-- 3. Create maintenance_logs table
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id UUID NOT NULL REFERENCES public.bikes(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    km_hours NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    next_due_km_hours NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for maintenance_logs
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_bike_id ON public.maintenance_logs(bike_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON public.maintenance_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_category ON public.maintenance_logs(category);

-- 4. Automatic sync trigger: keep bike's current_km_hours updated if a higher log is recorded
CREATE OR REPLACE FUNCTION public.sync_bike_odometer()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.bikes
    SET current_km_hours = GREATEST(current_km_hours, NEW.km_hours)
    WHERE id = NEW.bike_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_bike_odometer ON public.maintenance_logs;
CREATE TRIGGER trigger_sync_bike_odometer
AFTER INSERT OR UPDATE ON public.maintenance_logs
FOR EACH ROW
EXECUTE FUNCTION public.sync_bike_odometer();

-- 5. Row Level Security (RLS)
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Permissive policies for personal / garage tracker use
DROP POLICY IF EXISTS "Allow all access to bikes" ON public.bikes;
CREATE POLICY "Allow all access to bikes"
    ON public.bikes
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to maintenance_logs" ON public.maintenance_logs;
CREATE POLICY "Allow all access to maintenance_logs"
    ON public.maintenance_logs
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Supabase Storage bucket 'receipts'
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies for 'receipts' bucket
DROP POLICY IF EXISTS "Public Access to receipts" ON storage.objects;
CREATE POLICY "Public Access to receipts"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Allow Upload to receipts" ON storage.objects;
CREATE POLICY "Allow Upload to receipts"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Allow Update to receipts" ON storage.objects;
CREATE POLICY "Allow Update to receipts"
    ON storage.objects FOR UPDATE
    TO anon, authenticated
    USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Allow Delete from receipts" ON storage.objects;
CREATE POLICY "Allow Delete from receipts"
    ON storage.objects FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'receipts');

-- 7. Seed Initial Sample Bike & Interventions (if table is empty)
DO $$
DECLARE
    default_bike_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.bikes LIMIT 1) THEN
        INSERT INTO public.bikes (id, name, model, year, current_km_hours, category, primary_color, accent_color)
        VALUES (gen_random_uuid(), 'Yamaha MT-07', 'MT-07 Pure', 2022, 14500, 'naked', '#0284c7', '#0f172a')
        RETURNING id INTO default_bike_id;

        INSERT INTO public.maintenance_logs (bike_id, date, km_hours, category, description, cost, next_due_km_hours)
        VALUES 
        (default_bike_id, CURRENT_DATE - INTERVAL '60 days', 10000, 'Tagliando', 'Tagliando 10.000 km: cambio olio Motul 7100 10W40, filtro olio originale Yamaha, serraggio bulloneria generale.', 145.00, 15000),
        (default_bike_id, CURRENT_DATE - INTERVAL '25 days', 12300, 'Gomme', 'Sostituzione treno gomme Pirelli Diablo Rosso IV. Pressione ant: 2.25, post: 2.50 bar.', 290.00, 22000),
        (default_bike_id, CURRENT_DATE - INTERVAL '5 days', 14200, 'Trasmissione/Catena', 'Pulizia profonda con petrolio bianco, ingrassaggio catena con spray Motorex e regolazione gioco (30mm).', 25.00, 15200);
    END IF;
END $$;
