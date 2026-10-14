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

-- 7. Nessun veicolo o intervento dimostrativo: il gestionale parte vuoto.

-- 8. Gestione veicoli e scadenze: migrazione additiva, dati esistenti conservati.
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT 'moto';
ALTER TABLE public.bikes ADD COLUMN IF NOT EXISTS plate TEXT;
UPDATE public.bikes SET vehicle_type = 'scooter' WHERE category = 'scooter' AND vehicle_type = 'moto';
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bikes_vehicle_type_check' AND conrelid = 'public.bikes'::regclass) THEN
        ALTER TABLE public.bikes ADD CONSTRAINT bikes_vehicle_type_check CHECK (vehicle_type IN ('moto', 'auto', 'furgone', 'scooter'));
    END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.vehicle_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id UUID NOT NULL REFERENCES public.bikes(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 150),
    category TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    due_date DATE,
    due_km NUMERIC CHECK (due_km >= 0),
    warning_days INTEGER NOT NULL DEFAULT 30 CHECK (warning_days BETWEEN 0 AND 365),
    warning_km NUMERIC NOT NULL DEFAULT 500 CHECK (warning_km BETWEEN 0 AND 100000),
    amount_cents BIGINT CHECK (amount_cents > 0 AND amount_cents <= 999999999),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (due_date IS NOT NULL OR due_km IS NOT NULL)
);
ALTER TABLE public.vehicle_reminders ADD COLUMN IF NOT EXISTS amount_cents BIGINT CHECK (amount_cents > 0 AND amount_cents <= 999999999);
CREATE INDEX IF NOT EXISTS idx_vehicle_reminders_bike ON public.vehicle_reminders(bike_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_reminders_due ON public.vehicle_reminders(due_date) WHERE completed_at IS NULL;
ALTER TABLE public.vehicle_reminders ENABLE ROW LEVEL SECURITY;
-- Stesso modello di accesso delle tabelle bikes e maintenance_logs esistenti.
DROP POLICY IF EXISTS "Garage access to vehicle_reminders" ON public.vehicle_reminders;
CREATE POLICY "Garage access to vehicle_reminders" ON public.vehicle_reminders
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Completamento atomico: impedisce doppie registrazioni e conserva lo storico tecnico.
CREATE OR REPLACE FUNCTION public.complete_vehicle_reminder(reminder_id UUID, performed_on DATE)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE r public.vehicle_reminders%ROWTYPE; meter NUMERIC;
BEGIN
    IF performed_on IS NULL THEN RAISE EXCEPTION 'Data intervento obbligatoria'; END IF;
    SELECT * INTO r FROM public.vehicle_reminders WHERE id = reminder_id AND completed_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN RETURN false; END IF;
    SELECT current_km_hours INTO meter FROM public.bikes WHERE id = r.bike_id;
    INSERT INTO public.maintenance_logs (bike_id, date, km_hours, category, description)
    VALUES (r.bike_id, performed_on, meter, r.category, r.title || CASE WHEN r.notes <> '' THEN E'\n' || r.notes ELSE '' END);
    UPDATE public.vehicle_reminders SET completed_at = now() WHERE id = r.id;
    RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.complete_vehicle_reminder(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_vehicle_reminder(UUID, DATE) TO anon, authenticated;

-- 9. Spese per veicolo
-- Registro spese indipendente: importi in centesimi, nessun dato dimostrativo.
CREATE TABLE IF NOT EXISTS public.vehicle_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id UUID REFERENCES public.bikes(id) ON DELETE SET NULL,
    vehicle_ref UUID NOT NULL,
    vehicle_label TEXT NOT NULL CHECK (length(trim(vehicle_label)) > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (length(trim(category)) > 0),
    description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 200),
    amount_cents INTEGER NOT NULL CHECK (amount_cents BETWEEN 1 AND 999999999),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (bike_id IS NULL OR bike_id = vehicle_ref)
);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_vehicle_date ON public.vehicle_expenses(vehicle_ref, date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_expenses_date ON public.vehicle_expenses(date DESC);
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;
-- Stesso modello di accesso del garage esistente.
DROP POLICY IF EXISTS "Garage access to vehicle_expenses" ON public.vehicle_expenses;
CREATE POLICY "Garage access to vehicle_expenses" ON public.vehicle_expenses
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
