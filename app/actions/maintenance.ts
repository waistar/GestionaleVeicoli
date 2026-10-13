'use server'

import { createClient } from '@/lib/supabase/server';
import { Bike, MaintenanceLog } from '@/lib/supabase/types';
import { FALLBACK_BIKE, FALLBACK_LOGS } from '@/lib/demo-data';
import { revalidatePath } from 'next/cache';

import { getActiveBike } from '@/app/actions/bikes';

export async function getMainData(preferredBikeId?: string): Promise<{
  bike: Bike;
  logs: MaintenanceLog[];
  isFallback: boolean;
  error?: string;
}> {
  try {
    const { bike, isFallback: bikeFallback, error: bikeError } = await getActiveBike(preferredBikeId);

    if (bikeFallback) {
      const filteredLogs = FALLBACK_LOGS.filter((l) => l.bike_id === bike.id);
      return {
        bike,
        logs: filteredLogs.length > 0 ? filteredLogs : FALLBACK_LOGS,
        isFallback: true,
        error: bikeError,
      };
    }

    const supabase = await createClient();
    const { data: logs, error: logsError } = await supabase
      .from('maintenance_logs')
      .select('*')
      .eq('bike_id', bike.id)
      .order('date', { ascending: false });

    if (logsError) {
      return {
        bike,
        logs: [],
        isFallback: false,
        error: logsError.message,
      };
    }

    return {
      bike,
      logs: (logs || []) as MaintenanceLog[],
      isFallback: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      bike: FALLBACK_BIKE,
      logs: FALLBACK_LOGS,
      isFallback: true,
      error: msg,
    };
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
    const cost = parseFloat((formData.get('cost') as string) || '0');
    const nextDueRaw = formData.get('next_due_km_hours') as string;
    const nextDue = nextDueRaw && nextDueRaw.trim() !== '' ? parseFloat(nextDueRaw) : null;

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
        cost: isNaN(cost) ? 0 : cost,
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

    return { success: true, id: newLog?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteMaintenanceLog(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('maintenance_logs')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/garage');
    revalidatePath('/interventi');
    revalidatePath('/promemoria');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
