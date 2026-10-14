'use server'

import { VEHICLE_TYPES, type VehicleType } from '@/lib/vehicle-catalog';
import { parseInitialDeadlines } from '@/lib/initial-deadlines';
import { createClient } from '@/lib/supabase/server';
import { Bike } from '@/lib/supabase/types';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const ACTIVE_BIKE_COOKIE = 'active_bike_id';

/** Reads the fleet without inserting or synthesizing vehicles. */
export async function getAllBikes(): Promise<{
  bikes: Bike[]; activeBikeId: string; isFallback: boolean; error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const activeId = cookieStore.get(ACTIVE_BIKE_COOKIE)?.value;
    const db = await createClient();
    const { data, error } = await db.from('bikes').select('*').order('created_at', { ascending: false });
    if (error) return { bikes: [], activeBikeId: '', isFallback: true, error: error.message };
    const bikes = (data || []) as Bike[];
    return { bikes, activeBikeId: bikes.find(b => b.id === activeId)?.id || bikes[0]?.id || '', isFallback: false };
  } catch (e) {
    return { bikes: [], activeBikeId: '', isFallback: true, error: e instanceof Error ? e.message : 'Database non disponibile.' };
  }
}
export async function getActiveBike(preferredId?: string): Promise<{
  bike: Bike | null; isFallback: boolean; error?: string;
}> {
  const { bikes, activeBikeId, isFallback, error } = await getAllBikes();
  return { bike: bikes.find(b => b.id === (preferredId || activeBikeId)) || bikes[0] || null, isFallback, error };
}

/**
 * Switch the currently active bike in the garage.
 */
export async function setActiveBike(bikeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_BIKE_COOKIE, bikeId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });

    revalidatePath('/', 'layout');
    revalidatePath('/garage');
    revalidatePath('/interventi');
    revalidatePath('/promemoria');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Create a vehicle with profile photo and registry data.
 */
export async function createBike(formData: FormData): Promise<{
  success: boolean;
  bike?: Bike;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const name = (formData.get('name') as string)?.trim();
    const model = (formData.get('model') as string)?.trim();
    const yearRaw = formData.get('year') as string;
    const year = yearRaw && !isNaN(parseInt(yearRaw)) ? parseInt(yearRaw) : null;
    const kmHoursRaw = formData.get('current_km_hours') as string;
    const kmHours = kmHoursRaw && !isNaN(parseFloat(kmHoursRaw)) ? parseFloat(kmHoursRaw) : 0;
    const vehicleType = String(formData.get('vehicle_type') || 'auto') as VehicleType;
    const plate = String(formData.get('plate') || '').trim().toUpperCase();
    if (!VEHICLE_TYPES.some(t => t.value === vehicleType) || plate.length > 20 || !Number.isFinite(kmHours) || kmHours < 0 || !name || !model) return { success: false, error: 'Controlla tipo, nome, modello, targa e chilometraggio.' };
    const primaryColor = (formData.get('primary_color') as string)?.trim() || '#f97316';
    const accentColor = (formData.get('accent_color') as string)?.trim() || '#18181b';
    const initialDeadlines = parseInitialDeadlines(Object.fromEntries(formData), 'pending');
    if (!initialDeadlines.success) return { success: false, error: initialDeadlines.error };

    if (!name) {
      return { success: false, error: 'La marca o il nome del veicolo è obbligatorio.' };
    }
    if (!model) {
      return { success: false, error: 'Il modello è obbligatorio.' };
    }

    let imageUrl: string | null = null;
    const photoFile = formData.get('image') as File | null;

    if (photoFile && photoFile.size > 0 && typeof photoFile.name === 'string') {
      try {
        const fileExt = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const sanitized = photoFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `bikes/${Date.now()}_${sanitized}.${fileExt}`;

        const buffer = await photoFile.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, buffer, {
            contentType: photoFile.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);
          imageUrl = publicUrlData.publicUrl;
        } else {
          console.warn('Storage upload error for bike profile:', uploadError.message);
        }
      } catch (uploadErr) {
        console.warn('Profile image upload exception:', uploadErr);
      }
    }

    // Insert new bike record
    const { data: newBike, error: insertError } = await supabase
      .from('bikes')
      .insert({
        vehicle_type: vehicleType,
        plate: plate || null,
        name,
        model,
        year,
        current_km_hours: kmHours,
        primary_color: primaryColor,
        accent_color: accentColor,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    const createdBike = newBike as Bike;

    if (initialDeadlines.reminders.length > 0) {
      const { error: remindersError } = await supabase
        .from('vehicle_reminders')
        .insert(initialDeadlines.reminders.map(reminder => {
          const { amount_cents, ...values } = reminder;
          return { ...values, ...(amount_cents == null ? {} : { amount_cents }), bike_id: createdBike.id };
        }));
      if (remindersError) {
        await supabase.from('bikes').delete().eq('id', createdBike.id);
        return { success: false, error: remindersError.message.includes('amount_cents') ? 'Veicolo non registrato: aggiorna il database per poter salvare gli importi delle scadenze.' : `Veicolo non registrato: impossibile salvare le scadenze iniziali. ${remindersError.message}` };
      }
    }

    // Set this newly created bike as active
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_BIKE_COOKIE, createdBike.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });

    revalidatePath('/', 'layout');
    revalidatePath('/garage');
    revalidatePath('/interventi');
    revalidatePath('/promemoria');

    return { success: true, bike: createdBike };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Update an existing bike's profile and specifications.
 */
export async function updateBike(bikeId: string, formData: FormData): Promise<{
  success: boolean;
  bike?: Bike;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const name = (formData.get('name') as string)?.trim();
    const model = (formData.get('model') as string)?.trim();
    const yearRaw = formData.get('year') as string;
    const year = yearRaw && !isNaN(parseInt(yearRaw)) ? parseInt(yearRaw) : null;
    const kmHoursRaw = formData.get('current_km_hours') as string;
    const kmHours = kmHoursRaw && !isNaN(parseFloat(kmHoursRaw)) ? parseFloat(kmHoursRaw) : 0;
    const vehicleType = String(formData.get('vehicle_type') || 'auto') as VehicleType;
    const plate = String(formData.get('plate') || '').trim().toUpperCase();
    if (!VEHICLE_TYPES.some(t => t.value === vehicleType) || plate.length > 20 || !Number.isFinite(kmHours) || kmHours < 0 || !name || !model) return { success: false, error: 'Controlla tipo, nome, modello, targa e chilometraggio.' };
    const primaryColor = (formData.get('primary_color') as string)?.trim() || '#f97316';
    const accentColor = (formData.get('accent_color') as string)?.trim() || '#18181b';

    const updates: Partial<Bike> = {
      vehicle_type: vehicleType,
      plate: plate || null,
      name,
      model,
      year,
      current_km_hours: kmHours,
      primary_color: primaryColor,
      accent_color: accentColor,
    };

    const photoFile = formData.get('image') as File | null;
    if (photoFile && photoFile.size > 0 && typeof photoFile.name === 'string') {
      try {
        const fileExt = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const sanitized = photoFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `bikes/${Date.now()}_${sanitized}.${fileExt}`;

        const buffer = await photoFile.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, buffer, {
            contentType: photoFile.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);
          updates.image_url = publicUrlData.publicUrl;
        }
      } catch (uploadErr) {
        console.warn('Profile image update upload exception:', uploadErr);
      }
    }

    const { data: updatedBike, error: updateError } = await supabase
      .from('bikes')
      .update(updates)
      .eq('id', bikeId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/', 'layout');
    revalidatePath('/garage');
    revalidatePath('/interventi');
    revalidatePath('/promemoria');

    return { success: true, bike: updatedBike as Bike };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Remove a bike from the garage.
 */
export async function deleteBike(bikeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Check count of bikes
    const { data: allBikes } = await supabase
      .from('bikes')
      .select('id')
      .order('created_at', { ascending: true });

    const { error: deleteError } = await supabase
      .from('bikes')
      .delete()
      .eq('id', bikeId);

    if (deleteError) {
      return { success: false, error: deleteError.code === '23503' ? 'Elimina prima i documenti PDF associati a questo veicolo.' : deleteError.message };
    }

    // If deleted bike was the active one, switch active cookie to remaining bike
    const cookieStore = await cookies();
    const currentActive = cookieStore.get(ACTIVE_BIKE_COOKIE)?.value;
    if (currentActive === bikeId) {
      const remaining = allBikes?.filter((b) => b.id !== bikeId) || [];
      if (remaining.length > 0) {
        cookieStore.set(ACTIVE_BIKE_COOKIE, remaining[0].id, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        });
      } else {
        cookieStore.delete(ACTIVE_BIKE_COOKIE);
      }
    }

    revalidatePath('/', 'layout');
    revalidatePath('/garage');
    revalidatePath('/interventi');
    revalidatePath('/promemoria');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function updateBikeKm(bikeId: string, km: number): Promise<{ success: boolean; error?: string }> {
  if (!bikeId || !Number.isFinite(km) || km < 0) {
    return { success: false, error: 'Veicolo o chilometraggio non valido.' };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bikes')
      .update({ current_km_hours: km })
      .eq('id', bikeId)
      .select('id')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Veicolo non trovato.' };
    }

    revalidatePath('/', 'layout');
    revalidatePath('/garage');
    revalidatePath('/interventi');
    revalidatePath('/promemoria');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
