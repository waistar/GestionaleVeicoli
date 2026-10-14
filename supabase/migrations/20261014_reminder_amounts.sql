-- Importo facoltativo associato a una scadenza, memorizzato in centesimi.
ALTER TABLE public.vehicle_reminders
ADD COLUMN IF NOT EXISTS amount_cents BIGINT
CHECK (amount_cents > 0 AND amount_cents <= 999999999);
