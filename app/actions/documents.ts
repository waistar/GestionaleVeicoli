'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { DOCUMENT_BUCKET, documentMetadataSchema } from '@/lib/documents';
import type { VehicleDocument } from '@/lib/supabase/types';

async function hasArchiveAccess(db: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: userError } = await db.auth.getUser();
  if (userError || !user) return false;
  const { data: member, error: memberError } = await db.from('archive_members').select('user_id').eq('user_id', user.id).maybeSingle();
  return !memberError && Boolean(member);
}

export async function getDocuments(): Promise<{ documents: VehicleDocument[]; error?: string }> {
  try {
    const db = await createClient();
    if (!await hasArchiveAccess(db)) return { documents: [], error: 'Accedi con un account autorizzato per consultare l’archivio.' };
    const { data, error } = await db.from('vehicle_documents').select('*').order('document_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
    if (error) return { documents: [], error: 'Archivio documenti non disponibile. Aggiorna lo schema Supabase e riprova.' };
    return { documents: (data || []) as VehicleDocument[] };
  } catch {
    return { documents: [], error: 'Impossibile caricare l’archivio documenti.' };
  }
}

export async function saveDocumentMetadata(formData: FormData) {
  const parsed = documentMetadataSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  try {
    const db = await createClient();
    if (!await hasArchiveAccess(db)) return { success: false, error: 'Accesso all’archivio non autorizzato.' };
    const { data: vehicle, error: vehicleError } = await db.from('bikes').select('id').eq('id', parsed.data.bike_id).maybeSingle();
    if (vehicleError || !vehicle) return { success: false, error: 'Il veicolo selezionato non è disponibile.' };
    const { data, error } = await db.from('vehicle_documents').insert(parsed.data).select('id').single();
    if (error || !data) return { success: false, error: 'Documento caricato, ma non registrato nell’archivio. Riprova.' };
    revalidatePath('/documenti');
    return { success: true };
  } catch {
    return { success: false, error: 'Registrazione del documento non riuscita.' };
  }
}

export async function deleteDocument(id: string) {
  if (!z.string().uuid().safeParse(id).success) return { success: false, error: 'Documento non valido.' };
  try {
    const db = await createClient();
    if (!await hasArchiveAccess(db)) return { success: false, error: 'Accesso all’archivio non autorizzato.' };
    const { data: document, error: findError } = await db.from('vehicle_documents').select('storage_path').eq('id', id).maybeSingle();
    if (findError || !document) return { success: false, error: 'Documento non trovato.' };
    const { error: deleteError } = await db.from('vehicle_documents').delete().eq('id', id);
    if (deleteError) return { success: false, error: 'Eliminazione non riuscita.' };
    await db.storage.from(DOCUMENT_BUCKET).remove([document.storage_path]);
    revalidatePath('/documenti');
    return { success: true };
  } catch {
    return { success: false, error: 'Eliminazione non riuscita.' };
  }
}
