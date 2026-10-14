import { categoryUsesMileage } from './vehicle-catalog';
import { amountSchema } from './expenses';

export const INITIAL_DEADLINE_FIELDS = [
  { key: 'road_tax', label: 'Bollo', category: 'Bollo', hint: 'Termine di pagamento o rinnovo', primary: true },
  { key: 'insurance', label: 'Assicurazione RCA', category: 'Assicurazione RCA', hint: 'Data indicata sulla polizza', primary: true },
  { key: 'inspection', label: 'Revisione', category: 'Revisione', hint: 'Data della prossima revisione', primary: true },
  { key: 'service', label: 'Tagliando', category: 'Tagliando', hint: 'Data e/o chilometraggio previsto', primary: true, supportsKm: true },
  { key: 'oil_change', label: 'Cambio olio', category: 'Cambio olio', hint: 'Data e/o chilometraggio previsto', primary: true, supportsKm: true },
  { key: 'parking_subscription', label: 'Abbonamento parcheggio / sosta blu', category: 'Abbonamento parcheggio / sosta blu', hint: 'Scadenza dell’abbonamento' },
  { key: 'tyre_change', label: 'Cambio gomme', category: 'Cambio gomme', hint: 'Data del prossimo cambio gomme' },
] as const;

type DeadlinePayload = {
  bike_id: string;
  title: string;
  category: string;
  notes: string;
  due_date: string | null;
  due_km: number | null;
  warning_days: number;
  warning_km: number;
  amount_cents: number | null;
};

type DeadlineParseResult =
  | { success: true; reminders: DeadlinePayload[] }
  | { success: false; error: string };

function text(values: Record<string, unknown>, key: string) {
  const value = values[key];
  return typeof value === 'string' ? value.trim() : '';
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseInitialDeadlines(values: Record<string, unknown>, bikeId: string): DeadlineParseResult {
  const warningRaw = text(values, 'deadline_warning_days') || '30';
  const warningDays = Number(warningRaw);
  if (!Number.isInteger(warningDays) || warningDays < 0 || warningDays > 365) {
    return { success: false, error: 'L’anticipo delle scadenze deve essere compreso tra 0 e 365 giorni.' };
  }

  const reminders: DeadlinePayload[] = [];
  for (const field of INITIAL_DEADLINE_FIELDS) {
    const dueDate = text(values, `${field.key}_due_date`);
    const dueKmText = 'supportsKm' in field && field.supportsKm ? text(values, `${field.key}_due_km`) : '';
    const amountText = text(values, `${field.key}_amount`);
    if (dueDate && !validDate(dueDate)) return { success: false, error: `La data di ${field.label} non è valida.` };
    const dueKm = dueKmText ? Number(dueKmText) : null;
    if (dueKmText && (!Number.isFinite(dueKm) || dueKm! < 0)) return { success: false, error: `Il chilometraggio di ${field.label} non è valido.` };
    const amount = amountText ? amountSchema.safeParse(amountText) : null;
    if (amount && !amount.success) return { success: false, error: `L’importo di ${field.label} non è valido.` };
    if (amountText && !dueDate && dueKm === null) return { success: false, error: `Per ${field.label} inserisci anche una data o un chilometraggio.` };
    if (!dueDate && dueKm === null) continue;
    reminders.push({
      bike_id: bikeId,
      title: field.label,
      category: field.category,
      notes: 'Inserita durante la registrazione del veicolo.',
      due_date: dueDate || null,
      due_km: dueKm,
      warning_days: warningDays,
      warning_km: categoryUsesMileage(field.category) ? (field.category === 'Tagliando' ? 1000 : 500) : 0,
      amount_cents: amount?.success ? amount.data : null,
    });
  }

  return { success: true, reminders };
}
