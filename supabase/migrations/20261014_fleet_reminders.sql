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
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (due_date IS NOT NULL OR due_km IS NOT NULL)
);
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
