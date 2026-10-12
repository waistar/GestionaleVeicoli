import { Bike, MaintenanceLog, ReminderItem, ReminderStatus } from './supabase/types';

export function calculateReminders(bike: Bike, logs: MaintenanceLog[]): ReminderItem[] {
  const reminders: ReminderItem[] = [];
  const currentKm = Number(bike.current_km_hours) || 0;

  // 1. Group logs with explicit next_due_km_hours by category
  // Take the most recent one for each category
  const logsWithDue = logs.filter(
    (log) => log.next_due_km_hours !== null && log.next_due_km_hours !== undefined && Number(log.next_due_km_hours) > 0
  );

  const seenCategories = new Set<string>();

  for (const log of logsWithDue) {
    if (seenCategories.has(log.category)) continue;
    seenCategories.add(log.category);

    const nextDue = Number(log.next_due_km_hours);
    const lastDone = Number(log.km_hours);
    const kmRemaining = nextDue - currentKm;

    let status: ReminderStatus = 'ok';
    if (kmRemaining <= 0) {
      status = 'expired';
    } else if (kmRemaining <= 500) {
      status = 'warning';
    }

    reminders.push({
      id: log.id,
      bikeId: bike.id,
      bikeName: `${bike.name} (${bike.model})`,
      category: log.category,
      description: log.description,
      lastDoneKm: lastDone,
      currentKm,
      nextDueKm: nextDue,
      kmRemaining,
      status,
    });
  }

  // Sort: expired first (most overdue), then warning (closest), then ok (furthest)
  return reminders.sort((a, b) => {
    const priority = { expired: 0, warning: 1, ok: 2 };
    if (priority[a.status] !== priority[b.status]) {
      return priority[a.status] - priority[b.status];
    }
    return a.kmRemaining - b.kmRemaining;
  });
}

export function calculateStats(bike: Bike, logs: MaintenanceLog[]) {
  const currentKm = Number(bike.current_km_hours) || 0;
  const totalCost = logs.reduce((acc, log) => acc + (Number(log.cost) || 0), 0);
  const totalInterventions = logs.length;
  const reminders = calculateReminders(bike, logs);
  
  const expiredCount = reminders.filter(r => r.status === 'expired').length;
  const warningCount = reminders.filter(r => r.status === 'warning').length;

  return {
    currentKm,
    totalCost,
    totalInterventions,
    reminders,
    expiredCount,
    warningCount,
    alertsTotal: expiredCount + warningCount,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatKm(value: number): string {
  return new Intl.NumberFormat('it-IT').format(Math.round(value)) + ' km';
}
