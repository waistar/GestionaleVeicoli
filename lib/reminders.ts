import { Bike, MaintenanceLog, ReminderItem, VehicleReminder } from './supabase/types';

export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000);
}
export function calculateReminders(bike: Bike, logs: MaintenanceLog[], scheduled: VehicleReminder[] = [], today = todayISO()): ReminderItem[] {
  const currentKm = Number(bike.current_km_hours) || 0;
  const base = { bikeId: bike.id, bikeName: `${bike.name} ${bike.model}${bike.plate ? ` · ${bike.plate}` : ''}`, currentKm };
  const reminders: ReminderItem[] = [];
  const seen = new Set<string>();
  // Latest intervention defines the target, including clearing an old target.
  for (const log of [...logs].filter(l => l.bike_id === bike.id).sort((a,b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))) {
    if (seen.has(log.category)) continue;
    seen.add(log.category);
    if (log.next_due_km_hours == null || Number(log.next_due_km_hours) <= 0) continue;
    const nextDueKm = Number(log.next_due_km_hours);
    const kmRemaining = nextDueKm - currentKm;
    reminders.push({ ...base, id: `log:${log.id}`, category: log.category, description: log.description, lastDoneKm: Number(log.km_hours), nextDueKm, kmRemaining, source: 'log', status: kmRemaining <= 0 ? 'expired' : kmRemaining <= 500 ? 'warning' : 'ok' });
  }
  for (const item of scheduled.filter(r => r.bike_id === bike.id && !r.completed_at)) {
    const nextDueKm = item.due_km == null ? null : Number(item.due_km);
    const kmRemaining = nextDueKm == null ? null : nextDueKm - currentKm;
    const daysRemaining = item.due_date ? daysBetween(today, item.due_date) : null;
    const expired = (kmRemaining != null && kmRemaining <= 0) || (daysRemaining != null && daysRemaining < 0);
    const warning = (kmRemaining != null && kmRemaining <= item.warning_km) || (daysRemaining != null && daysRemaining <= item.warning_days);
    reminders.push({ ...base, id: `schedule:${item.id}`, category: item.category, title: item.title, description: item.notes, lastDoneKm: currentKm, nextDueKm, kmRemaining, dueDate: item.due_date, daysRemaining, source: 'schedule', scheduled: item, status: expired ? 'expired' : warning ? 'warning' : 'ok' });
  }
  return sortReminders(reminders);
}
export function sortReminders(reminders: ReminderItem[]) {
  const priority = { expired: 0, warning: 1, ok: 2 };
  const urgency = (r: ReminderItem) => Math.min(r.kmRemaining == null ? Infinity : r.kmRemaining / 500, r.daysRemaining == null ? Infinity : r.daysRemaining / 30);
  return reminders.sort((a,b) => priority[a.status] - priority[b.status] || urgency(a) - urgency(b) || a.id.localeCompare(b.id));
}
export function calculateStats(bike: Bike, logs: MaintenanceLog[], scheduled: VehicleReminder[] = []) {
  const reminders = calculateReminders(bike, logs, scheduled);
  const expiredCount = reminders.filter(r => r.status === 'expired').length;
  const warningCount = reminders.filter(r => r.status === 'warning').length;
  return { currentKm: Number(bike.current_km_hours) || 0, totalInterventions: logs.length, reminders, expiredCount, warningCount, alertsTotal: expiredCount + warningCount };
}
export const formatKm = (value: number) => new Intl.NumberFormat('it-IT').format(Math.round(value)) + ' km';
export const formatDate = (value: string) => new Date(value + 'T12:00:00').toLocaleDateString('it-IT');
export function reminderTarget(item: ReminderItem) {
  return [item.dueDate ? formatDate(item.dueDate) : null, item.nextDueKm != null ? formatKm(item.nextDueKm) : null].filter(Boolean).join(' · ');
}
export function reminderRemaining(item: ReminderItem) {
  return [item.daysRemaining == null ? null : item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)} giorni di ritardo` : item.daysRemaining === 0 ? 'Scade oggi' : `Tra ${item.daysRemaining} giorni`, item.kmRemaining == null ? null : item.kmRemaining <= 0 ? `Soglia raggiunta${item.kmRemaining < 0 ? ` da ${formatKm(-item.kmRemaining)}` : ''}` : `Tra ${formatKm(item.kmRemaining)}`].filter(Boolean).join(' · ');
}
