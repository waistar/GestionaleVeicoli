import type { MaintenanceLog, VehicleReminder } from './supabase/types';

export interface AnnualVehicleCosts {
  year: number;
  recurringCents: number;
  extraordinaryCents: number;
  totalCents: number;
  recurringCount: number;
  extraordinaryCount: number;
}

function isInYear(date: string | null | undefined, year: number) {
  return Boolean(date && date.startsWith(`${year}-`));
}

export function maintenanceCostCents(value: MaintenanceLog['cost']) {
  if (value == null || value === '') return 0;
  const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
  const euros = Number(normalized);
  if (!Number.isFinite(euros) || euros < 0) throw new Error('Costo intervento non valido.');
  const cents = Math.round(euros * 100);
  if (!Number.isSafeInteger(cents)) throw new Error('Costo intervento troppo elevato.');
  return cents;
}

export function isExtraordinaryMaintenance(log: MaintenanceLog) {
  return maintenanceCostCents(log.cost) > 0;
}

export function summarizeAnnualVehicleCosts(
  year: number,
  reminders: VehicleReminder[],
  logs: MaintenanceLog[],
): AnnualVehicleCosts {
  let recurringCents = 0;
  let extraordinaryCents = 0;
  let recurringCount = 0;
  let extraordinaryCount = 0;

  for (const reminder of reminders) {
    if (!isInYear(reminder.due_date, year) || reminder.amount_cents == null) continue;
    const cents = Number(reminder.amount_cents);
    if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Importo ricorrente non valido.');
    recurringCents += cents;
    recurringCount++;
  }

  for (const log of logs) {
    if (!isInYear(log.date, year)) continue;
    const cents = maintenanceCostCents(log.cost);
    if (!cents) continue;
    extraordinaryCents += cents;
    extraordinaryCount++;
  }

  const totalCents = recurringCents + extraordinaryCents;
  if (!Number.isSafeInteger(totalCents)) throw new Error('Il totale annuale supera il limite supportato.');
  return { year, recurringCents, extraordinaryCents, totalCents, recurringCount, extraordinaryCount };
}
