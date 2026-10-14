import { z } from 'zod';
import type { Bike, VehicleExpense } from './supabase/types';

export const EXPENSE_CATEGORIES = ['Carburante', 'Ricarica elettrica', 'Manutenzione', 'Ricambi', 'Pneumatici', 'Assicurazione', 'Bollo e tasse', 'Revisione', 'Pedaggi', 'Parcheggi', 'Noleggio e leasing', 'Accessori', 'Pulizia', 'Altro'] as const;
// Parse decimal strings directly into cents: totals never accumulate binary decimals.
export const amountSchema = z.string().trim().regex(/^\d{1,7}(?:[.,]\d{1,2})?$/, 'Inserisci un importo positivo con al massimo due decimali, es. 1234,56.')
  .transform(value => { const [whole, decimal = ''] = value.replace(',', '.').split('.'); return Number(whole) * 100 + Number(decimal.padEnd(2, '0')); })
  .refine(value => value > 0 && value <= 999999999, 'L’importo deve essere maggiore di zero e non superare 9.999.999,99 €.');
export const expenseSchema = z.object({
  bike_id: z.string().uuid('Seleziona un veicolo.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida.').refine(value => { const date = new Date(value + 'T00:00:00Z'); return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; }, 'Data non valida.'),
  category: z.enum(EXPENSE_CATEGORIES), description: z.string().trim().min(1, 'Inserisci una descrizione.').max(200),
  amount: amountSchema, notes: z.string().trim().max(3000),
});
export const formatCurrency = (cents: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export const expenseVehicleLabel = (vehicle: Bike) => `${vehicle.name} ${vehicle.model}${vehicle.plate ? ` · ${vehicle.plate}` : ''}`;
export interface ExpenseFilters { vehicle: string; category: string; from: string; to: string; search: string }
export function filterExpenses(expenses: VehicleExpense[], filters: ExpenseFilters) {
  const query = filters.search.trim().toLocaleLowerCase('it-IT');
  return expenses.filter(expense =>
    (filters.vehicle === 'all' || expense.vehicle_ref === filters.vehicle) &&
    (filters.category === 'all' || expense.category === filters.category) &&
    (!filters.from || expense.date >= filters.from) && (!filters.to || expense.date <= filters.to) &&
    (!query || `${expense.description} ${expense.notes} ${expense.vehicle_label}`.toLocaleLowerCase('it-IT').includes(query))
  );
}
export function summarizeExpenses(expenses: VehicleExpense[], vehicles: Bike[]) {
  const currentVehicles = new Map(vehicles.map(vehicle => [vehicle.id, expenseVehicleLabel(vehicle)]));
  const byVehicle = new Map<string, { id: string; label: string; removed: boolean; cents: number; count: number }>();
  const byCategory = new Map<string, number>();
  let total = 0;
  for (const expense of expenses) {
    const cents = Number(expense.amount_cents);
    if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Importo non valido nell’archivio spese.');
    total += cents;
    if (!Number.isSafeInteger(total)) throw new Error('Il totale supera il limite supportato.');
    const row = byVehicle.get(expense.vehicle_ref) || { id: expense.vehicle_ref, label: currentVehicles.get(expense.vehicle_ref) || expense.vehicle_label, removed: !currentVehicles.has(expense.vehicle_ref), cents: 0, count: 0 };
    row.cents += cents; row.count++; byVehicle.set(row.id, row);
    byCategory.set(expense.category, (byCategory.get(expense.category) || 0) + cents);
  }
  return { total, count: expenses.length, byVehicle: [...byVehicle.values()].sort((a,b) => b.cents - a.cents || a.label.localeCompare(b.label)), byCategory: [...byCategory.entries()].map(([category, cents]) => ({category, cents})).sort((a,b) => b.cents - a.cents) };
}
