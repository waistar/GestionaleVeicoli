import type { Bike, MaintenanceLog, VehicleReminder } from './supabase/types';
import { isExtraordinaryMaintenance, maintenanceCostCents } from './annual-costs';

export interface AutomaticExpense {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  date: string;
  category: string;
  description: string;
  notes: string;
  amountCents: number;
  source: 'recurring' | 'extraordinary';
}

const vehicleLabel = (bike: Bike) => `${bike.name} ${bike.model}${bike.plate ? ` · ${bike.plate}` : ''}`;

export function buildAutomaticExpenses(bikes: Bike[], reminders: VehicleReminder[], logs: MaintenanceLog[]) {
  const vehicles = new Map(bikes.map(bike => [bike.id, vehicleLabel(bike)]));
  const rows: AutomaticExpense[] = [];

  for (const reminder of reminders) {
    if (!reminder.due_date || reminder.amount_cents == null || !vehicles.has(reminder.bike_id)) continue;
    const amountCents = Number(reminder.amount_cents);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error('Importo ricorrente non valido.');
    rows.push({
      id: `reminder-${reminder.id}`,
      vehicleId: reminder.bike_id,
      vehicleLabel: vehicles.get(reminder.bike_id)!,
      date: reminder.due_date,
      category: reminder.category,
      description: reminder.title || reminder.category,
      notes: reminder.notes || '',
      amountCents,
      source: 'recurring',
    });
  }

  for (const log of logs) {
    if (!vehicles.has(log.bike_id) || !isExtraordinaryMaintenance(log)) continue;
    const amountCents = maintenanceCostCents(log.cost);
    rows.push({
      id: `log-${log.id}`,
      vehicleId: log.bike_id,
      vehicleLabel: vehicles.get(log.bike_id)!,
      date: log.date,
      category: log.category,
      description: log.description,
      notes: '',
      amountCents,
      source: 'extraordinary',
    });
  }

  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.description.localeCompare(b.description));
}
