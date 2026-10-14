'use server'

import { createClient } from '@/lib/supabase/server';
import { Bike, MaintenanceLog, VehicleReminder } from '@/lib/supabase/types';
import { revalidatePath } from 'next/cache';

import { getActiveBike } from '@/app/actions/bikes';
import { amountSchema } from '@/lib/expenses';

export async function getMainData(preferredBikeId?: string): Promise<{
  bike: Bike | null; logs: MaintenanceLog[]; scheduled: VehicleReminder[]; isFallback: boolean; error?: string;
}> {
  const { bike, isFallback, error } = await getActiveBike(preferredBikeId);
  if (!bike) return { bike: null, logs: [], scheduled: [], isFallback, error };
  try {
    const db = await createClient();
    const [history, plans] = await Promise.all([
      db.from('maintenance_logs').select('*').eq('bike_id', bike.id).order('date', {ascending:false}),
      db.from('vehicle_reminders').select('*').eq('bike_id', bike.id),
    ]);
    return { bike, logs: history.data || [], scheduled: plans.data || [], isFallback: false, error: history.error?.message || plans.error?.message };
  } catch (e) {
    return { bike, logs: [], scheduled: [], isFallback: true, error: e instanceof Error ? e.message : 'Database non disponibile.' };
  }
}

export async function createMaintenanceLog(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  id?: string;
}> {
  try {
    const supabase = await createClient();

    const bikeId = formData.get('bike_id') as string;
    const date = (formData.get('date') as string) || new Date().toISOString().split('T')[0];
    const kmHours = parseFloat(formData.get('km_hours') as string);
    const category = formData.get('category') as string;
    const description = (formData.get('description') as string) || '';
    const nextDueRaw = formData.get('next_due_km_hours') as string;
    const nextDue = nextDueRaw && nextDueRaw.trim() !== '' ? parseFloat(nextDueRaw) : null;
    const costRaw = String(formData.get('cost') || '').trim();
    const parsedCost = costRaw ? amountSchema.safeParse(costRaw) : null;

    if (!bikeId) {
      return { success: false, error: 'ID Moto non specificato.' };
    }
    if (isNaN(kmHours) || kmHours < 0) {
      return { success: false, error: 'Chilometraggio o ore non validi.' };
    }
    if (!category) {
      return { success: false, error: 'Categoria obbligatoria.' };
    }
    if (!description.trim()) {
      return { success: false, error: 'Descrizione dell\'intervento obbligatoria.' };
    }
    if (parsedCost && !parsedCost.success) {
      return { success: false, error: parsedCost.error.issues[0].message };
    }

    let imageUrl: string | null = null;
    const file = formData.get('image') as File | null;

    if (file && file.size > 0 && typeof file.name === 'string') {
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const sanitizedBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${Date.now()}_${sanitizedBase}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        const buffer = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(filePath);

          imageUrl = publicUrlData.publicUrl;
        } else {
          console.warn('Supabase storage upload warning:', uploadError.message);
        }
      } catch (storageErr) {
        console.warn('Storage processing error:', storageErr);
      }
    }

    // Insert log record
    const { data: newLog, error: insertError } = await supabase
      .from('maintenance_logs')
      .insert({
        bike_id: bikeId,
        date,
        km_hours: kmHours,
        category,
        description,
        cost: parsedCost?.success ? parsedCost.data / 100 : 0,
        image_url: imageUrl,
        next_due_km_hours: nextDue,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Keep bike odometer synced if km is greater
    try {
      const { data: currentBike } = await supabase
        .from('bikes')
        .select('current_km_hours')
        .eq('id', bikeId)
        .single();

      if (currentBike && kmHours > Number(currentBike.current_km_hours)) {
        await supabase
          .from('bikes')
          .update({ current_km_hours: kmHours })
          .eq('id', bikeId);
      }
    } catch (syncErr) {
      console.warn('Odometer sync check error:', syncErr);
    }

    revalidatePath('/');
    revalidatePath('/garage');
    revalidatePath('/interventi');
    revalidatePath('/promemoria');
    revalidatePath(`/veicoli/${bikeId}`);

    return { success: true, id: newLog?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteMaintenanceLog(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('maintenance_logs')
      .delete()
      .eq('id', id)
      .select('id, bike_id')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Intervento non trovato.' };
    }

    revalidatePath('/');
    revalidatePath('/garage');
    revalidatePath('/interventi');
    revalidatePath('/promemoria');
    revalidatePath(`/veicoli/${data.bike_id}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
