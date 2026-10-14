'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { todayISO } from '@/lib/reminders';

import { reminderSchema } from '@/lib/reminder-schema';

function refresh() { revalidatePath('/', 'layout'); }
export async function saveReminder(formData: FormData) {
  const parsed = reminderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const id = formData.get('id');
  if (id && !z.string().uuid().safeParse(id).success) return { success: false, error: 'Scadenza non valida.' };
  try {
    const db = await createClient();
    const { amount_cents, ...reminder } = parsed.data;
    const payload = { ...reminder, amount_cents, completed_at: null };
    const query = id ? db.from('vehicle_reminders').update(payload).eq('id', id) : db.from('vehicle_reminders').insert(payload);
    let { data, error } = await query.select('id').single();
    if (error?.message.includes('amount_cents') && amount_cents == null) {
      const legacyPayload = { ...reminder, completed_at: null };
      const retry = id ? db.from('vehicle_reminders').update(legacyPayload).eq('id', id) : db.from('vehicle_reminders').insert(legacyPayload);
      ({ data, error } = await retry.select('id').single());
    }
    if (error || !data) return { success: false, error: error?.message.includes('amount_cents') ? 'Aggiorna il database per poter salvare l’importo della scadenza.' : error?.message || 'Scadenza non trovata.' };
    refresh(); return { success: true };
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Salvataggio non riuscito.' }; }
}
export async function completeReminder(id: string) {
  if (!z.string().uuid().safeParse(id).success) return { success: false, error: 'Scadenza non valida.' };
  try {
    const db = await createClient();
    const { data, error } = await db.rpc('complete_vehicle_reminder', { reminder_id: id, performed_on: todayISO() });
    if (error || !data) return { success: false, error: error?.message || 'Scadenza già completata o non trovata.' };
    refresh(); return { success: true };
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Operazione non riuscita.' }; }
}
export async function deleteReminder(id: string) {
  if (!z.string().uuid().safeParse(id).success) return { success: false, error: 'Scadenza non valida.' };
  try {
    const db = await createClient();
    const { error } = await db.from('vehicle_reminders').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    refresh(); return { success: true };
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Eliminazione non riuscita.' }; }
}
