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
