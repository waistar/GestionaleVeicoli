'use server'

import { createClient } from '@/lib/supabase/server';
import { Bike } from '@/lib/supabase/types';
import { FALLBACK_BIKE } from '@/lib/demo-data';
import { revalidatePath } from 'next/cache';

export async function getActiveBike(): Promise<{ bike: Bike; isFallback: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      return { bike: FALLBACK_BIKE, isFallback: true, error: error.message };
    }

    if (!data || data.length === 0) {
      // Auto seed default bike
      const { data: inserted, error: insertErr } = await supabase
        .from('bikes')
        .insert({
          name: FALLBACK_BIKE.name,
          model: FALLBACK_BIKE.model,
          year: FALLBACK_BIKE.year,
          current_km_hours: FALLBACK_BIKE.current_km_hours,
        })
        .select()
        .single();

      if (insertErr || !inserted) {
        return { bike: FALLBACK_BIKE, isFallback: true };
      }
      return { bike: inserted as Bike, isFallback: false };
    }

    return { bike: data[0] as Bike, isFallback: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { bike: FALLBACK_BIKE, isFallback: true, error: msg };
  }
}

export async function updateBikeKm(bikeId: string, km: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('bikes')
      .update({ current_km_hours: km })
      .eq('id', bikeId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/interventi');
    revalidatePath('/promemoria');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
