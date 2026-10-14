import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(v + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0,10) === v;
}, 'Data non valida');
const optionalNumber = z.preprocess(v => v === '' || v == null ? null : Number(v), z.number().finite().nonnegative().nullable());
export const reminderSchema = z.object({
  bike_id: z.string().uuid(), title: z.string().trim().min(1).max(150), category: z.string().trim().min(1).max(100), notes: z.string().trim().max(3000),
  due_date: z.preprocess(v => v === '' ? null : v, date.nullable()), due_km: optionalNumber,
  warning_days: z.coerce.number().int().min(0).max(365), warning_km: z.coerce.number().min(0).max(100000),
}).refine(v => v.due_date != null || v.due_km != null, { message: 'Inserisci almeno una data o una soglia chilometrica.' });
