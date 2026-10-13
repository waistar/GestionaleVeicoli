'use server'

import { createClient } from '@/lib/supabase/server';
import { Bike } from '@/lib/supabase/types';
import { FALLBACK_BIKE, FALLBACK_GARAGE_BIKES } from '@/lib/demo-data';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const ACTIVE_BIKE_COOKIE = 'active_bike_id';

/**
 * Retrieves the currently active bike.
 * Checks cookie 'active_bike_id', then database, or fallback demo bikes.
 */
export async function getActiveBike(preferredId?: string): Promise<{
  bike: Bike;
  isFallback: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const activeIdFromCookie = preferredId || cookieStore.get(ACTIVE_BIKE_COOKIE)?.value;

    const supabase = await createClient();

    // If an ID is requested/stored, try to fetch it first
    if (activeIdFromCookie) {
      const { data: specificBike, error: specificError } = await supabase
        .from('bikes')
        .select('*')
        .eq('id', activeIdFromCookie)
        .maybeSingle();

      if (specificBike && !specificError) {
        return { bike: specificBike as Bike, isFallback: false };
      }
    }

    // Default to the first bike in the garage
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      // Supabase error or table not yet configured, use demo data
      const matchedFallback = activeIdFromCookie
        ? FALLBACK_GARAGE_BIKES.find((b) => b.id === activeIdFromCookie) || FALLBACK_BIKE
        : FALLBACK_BIKE;
      return { bike: matchedFallback, isFallback: true, error: error.message };
    }

    if (!data || data.length === 0) {
      // Auto seed default bike into database
      const { data: inserted, error: insertErr } = await supabase
        .from('bikes')
        .insert({
          name: FALLBACK_BIKE.name,
          model: FALLBACK_BIKE.model,
          year: FALLBACK_BIKE.year,
          current_km_hours: FALLBACK_BIKE.current_km_hours,
          category: FALLBACK_BIKE.category || 'naked',
          primary_color: FALLBACK_BIKE.primary_color || '#0284c7',
          accent_color: FALLBACK_BIKE.accent_color || '#0f172a',
          image_url: FALLBACK_BIKE.image_url,
        })
        .select()
        .single();

      if (insertErr || !inserted) {
        return { bike: FALLBACK_BIKE, isFallback: true };
      }

      cookieStore.set(ACTIVE_BIKE_COOKIE, inserted.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });

      return { bike: inserted as Bike, isFallback: false };
    }

    const firstBike = data[0] as Bike;
    // Persist as cookie if not set
    if (!activeIdFromCookie) {
      cookieStore.set(ACTIVE_BIKE_COOKIE, firstBike.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }

    return { bike: firstBike, isFallback: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const cookieStore = await cookies().catch(() => null);
    const activeIdFromCookie = cookieStore?.get(ACTIVE_BIKE_COOKIE)?.value;
    const matchedFallback = activeIdFromCookie
      ? FALLBACK_GARAGE_BIKES.find((b) => b.id === activeIdFromCookie) || FALLBACK_BIKE
      : FALLBACK_BIKE;

    return { bike: matchedFallback, isFallback: true, error: msg };
  }
}

/**
 * Returns all bikes registered in the user's garage.
 */
export async function getAllBikes(): Promise<{
  bikes: Bike[];
  activeBikeId: string;
  isFallback: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const activeBikeId = cookieStore.get(ACTIVE_BIKE_COOKIE)?.value;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return {
        bikes: FALLBACK_GARAGE_BIKES,
        activeBikeId: activeBikeId || FALLBACK_BIKE.id,
        isFallback: true,
        error: error?.message,
      };
    }

    const bikesList = data as Bike[];
    const resolvedActiveId =
      bikesList.find((b) => b.id === activeBikeId)?.id || bikesList[0].id;

    return {
      bikes: bikesList,
      activeBikeId: resolvedActiveId,
      isFallback: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      bikes: FALLBACK_GARAGE_BIKES,
      activeBikeId: FALLBACK_BIKE.id,
      isFallback: true,
      error: msg,
    };
  }
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
 * Create a new bike in the garage with initial profile photo & 3D attributes.
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
    const category = (formData.get('category') as string)?.trim() || 'naked';
    const primaryColor = (formData.get('primary_color') as string)?.trim() || '#f97316';
    const accentColor = (formData.get('accent_color') as string)?.trim() || '#18181b';

    if (!name) {
      return { success: false, error: 'Il nome della moto è obbligatorio (es. Ducati Monster).' };
    }
    if (!model) {
      return { success: false, error: 'Il modello è obbligatorio (es. 937 SP).' };
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
        name,
        model,
        year,
        current_km_hours: kmHours,
        category,
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
    const category = (formData.get('category') as string)?.trim() || 'naked';
    const primaryColor = (formData.get('primary_color') as string)?.trim() || '#f97316';
    const accentColor = (formData.get('accent_color') as string)?.trim() || '#18181b';

    const updates: Partial<Bike> = {
      name,
      model,
      year,
      current_km_hours: kmHours,
      category,
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

    if (allBikes && allBikes.length <= 1) {
      return {
        success: false,
        error: 'Non puoi eliminare l\'unica moto presente nel garage. Aggiungine prima un\'altra.',
      };
    }

    const { error: deleteError } = await supabase
      .from('bikes')
      .delete()
      .eq('id', bikeId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
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
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('bikes')
      .update({ current_km_hours: km })
      .eq('id', bikeId);

    if (error) {
      return { success: false, error: error.message };
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
