'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { expenseSchema, expenseVehicleLabel } from '@/lib/expenses';
import type { Bike, VehicleExpense } from '@/lib/supabase/types';

export async function getExpenses(): Promise<{ expenses: VehicleExpense[]; error?: string }> {
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !publicKey) return { expenses: [], error: 'Collega il database Supabase per consultare e salvare le spese.' };
  try {
    const db = await createClient();
    const { data, error } = await db.from('vehicle_expenses').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (error) return { expenses: [], error: 'Registro spese non disponibile. Verifica il collegamento e l’aggiornamento del database.' };
    return { expenses: (data || []) as VehicleExpense[] };
  } catch { return { expenses: [], error: 'Impossibile caricare le spese. Riprova tra poco.' }; }
}
export async function saveExpense(formData: FormData) {
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const id = formData.get('id');
  if (id && !z.string().uuid().safeParse(id).success) return { success: false, error: 'Spesa non valida.' };
  try {
    const db = await createClient();
    const values = parsed.data;
    const { data: vehicle, error: vehicleError } = await db.from('bikes').select('*').eq('id', values.bike_id).maybeSingle();
    if (vehicleError) return { success: false, error: 'Impossibile verificare il veicolo selezionato.' };
    let historical: VehicleExpense | null = null;
    if (!vehicle && id) {
      const { data } = await db.from('vehicle_expenses').select('*').eq('id', id).maybeSingle();
      if (data?.bike_id === null && data?.vehicle_ref === values.bike_id) historical = data as VehicleExpense;
    }
    if (!vehicle && !historical) return { success: false, error: 'Il veicolo non è più disponibile. Selezionane un altro.' };
    const payload = {
      bike_id: vehicle ? values.bike_id : null,
      vehicle_ref: values.bike_id,
      vehicle_label: vehicle ? expenseVehicleLabel(vehicle as Bike) : historical!.vehicle_label,
      date: values.date, category: values.category, description: values.description, amount_cents: values.amount, notes: values.notes,
    };
    const query = id ? db.from('vehicle_expenses').update(payload).eq('id', id) : db.from('vehicle_expenses').insert(payload);
    const { data, error } = await query.select('id').single();
    if (error || !data) return { success: false, error: 'Salvataggio non riuscito. Verifica che il registro spese sia configurato e riprova.' };
    revalidatePath('/spese'); revalidatePath('/'); return { success: true };
  } catch { return { success: false, error: 'Salvataggio non riuscito. Riprova tra poco.' }; }
}
export async function deleteExpense(id: string) {
  if (!z.string().uuid().safeParse(id).success) return { success: false, error: 'Spesa non valida.' };
  try {
    const db = await createClient();
    const { data, error } = await db.from('vehicle_expenses').delete().eq('id', id).select('id').single();
    if (error || !data) return { success: false, error: 'La spesa non è stata eliminata. Ricarica la pagina e riprova.' };
    revalidatePath('/spese'); revalidatePath('/'); return { success: true };
  } catch { return { success: false, error: 'Eliminazione non riuscita. Riprova tra poco.' }; }
}
