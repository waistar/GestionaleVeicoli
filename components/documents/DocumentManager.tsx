'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileArchive, FileText, LogOut, Plus, Trash2, Upload } from 'lucide-react';
import type { Bike, VehicleDocument } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';
import { deleteDocument, saveDocumentMetadata } from '@/app/actions/documents';
import { DOCUMENT_BUCKET, DOCUMENT_CATEGORIES, formatFileSize, MAX_DOCUMENT_SIZE } from '@/lib/documents';
import { formatDate } from '@/lib/reminders';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const input = 'w-full min-h-11 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900';
const secondaryButton = 'min-h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold disabled:opacity-50';

export function DocumentManager({ bikes, documents, error, initialVehicle, accountEmail }: { bikes: Bike[]; documents: VehicleDocument[]; error?: string; initialVehicle?: string; accountEmail?: string }) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(initialVehicle || 'all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const vehicleMap = useMemo(() => new Map(bikes.map(bike => [bike.id, `${bike.name} ${bike.model}${bike.plate ? ` · ${bike.plate}` : ''}`])), [bikes]);
  const filtered = documents.filter(document => {
    const query = search.trim().toLocaleLowerCase('it-IT');
    return (vehicle === 'all' || document.bike_id === vehicle)
      && (category === 'all' || document.category === category)
      && (!query || `${document.title} ${document.file_name} ${document.notes} ${vehicleMap.get(document.bike_id) || ''}`.toLocaleLowerCase('it-IT').includes(query));
  });

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = event.currentTarget;
    const values = new FormData(form);
    const file = values.get('file');
    const bikeId = String(values.get('bike_id') || '');
    let uploadedPath = '';
    try {
      if (!(file instanceof File) || file.size === 0) throw new Error('Seleziona un file PDF.');
      if (file.size > MAX_DOCUMENT_SIZE) throw new Error('Il PDF non può superare 20 MB.');
      const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
      if (!file.name.toLocaleLowerCase('it-IT').endsWith('.pdf') || signature !== '%PDF-') throw new Error('Il file selezionato non è un PDF valido.');
      uploadedPath = `${bikeId}/${crypto.randomUUID()}.pdf`;
      const db = createClient();
      const { error: uploadError } = await db.storage.from(DOCUMENT_BUCKET).upload(uploadedPath, file, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw new Error('Caricamento del PDF non riuscito. Verifica la configurazione Supabase.');
      values.delete('file');
      values.set('file_name', file.name.slice(0, 255));
      values.set('storage_path', uploadedPath);
      values.set('mime_type', 'application/pdf');
      values.set('size_bytes', String(file.size));
      const result = await saveDocumentMetadata(values);
      if (!result.success) {
        await db.storage.from(DOCUMENT_BUCKET).remove([uploadedPath]);
        throw new Error(result.error || 'Registrazione del documento non riuscita.');
      }
      setMessage('PDF caricato nell’archivio.');
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (uploadError) {
      setMessage(uploadError instanceof Error ? uploadError.message : 'Caricamento non riuscito.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadDocument(document: VehicleDocument) {
    setBusy(true);
    setMessage('');
    try {
      const db = createClient();
      const { data, error: downloadError } = await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(document.storage_path, 60, { download: document.file_name });
      if (downloadError || !data?.signedUrl) throw new Error('Download non disponibile. Riprova.');
      window.location.assign(data.signedUrl);
    } catch (downloadError) {
      setMessage(downloadError instanceof Error ? downloadError.message : 'Download non riuscito.');
    } finally {
      setBusy(false);
    }
  }

  async function removeDocument(document: VehicleDocument) {
    if (!confirm(`Eliminare definitivamente “${document.title}”?`)) return;
    setBusy(true);
    setMessage('');
    const result = await deleteDocument(document.id);
    setMessage(result.success ? 'Documento eliminato.' : result.error || 'Eliminazione non riuscita.');
    if (result.success) router.refresh();
    setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.refresh();
    setBusy(false);
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm"><p className="text-emerald-900">Archivio protetto · <strong>{accountEmail}</strong></p><button onClick={signOut} disabled={busy} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 font-semibold text-emerald-800 disabled:opacity-50"><LogOut className="w-4 h-4" />Esci</button></div>
    {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-lg">Cerca nell’archivio</h2><p className="text-xs text-zinc-600">{documents.length} PDF archiviati</p></div><button onClick={() => { setMessage(''); setOpen(true); }} disabled={busy || Boolean(error)} className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 font-semibold text-white disabled:opacity-50"><Plus className="w-4 h-4" />Carica PDF</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs text-zinc-600">Veicolo<select value={vehicle} onChange={event => setVehicle(event.target.value)} className={input}><option value="all">Tutti i veicoli</option>{bikes.map(bike => <option key={bike.id} value={bike.id}>{vehicleMap.get(bike.id)}</option>)}</select></label>
        <label className="text-xs text-zinc-600">Categoria<select value={category} onChange={event => setCategory(event.target.value)} className={input}><option value="all">Tutte le categorie</option>{DOCUMENT_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs text-zinc-600">Ricerca<input value={search} onChange={event => setSearch(event.target.value)} className={input} placeholder="Titolo, file, note…" /></label>
      </div>
    </section>

    {message && !open && <p role="status" className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">{message}</p>}
    {!error && (filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center"><FileArchive className="w-10 h-10 text-zinc-400 mx-auto" /><p className="mt-3 font-semibold">{documents.length ? 'Nessun documento corrisponde ai filtri' : 'Archivio ancora vuoto'}</p><p className="mt-1 text-sm text-zinc-600">Carica assicurazioni, libretti e PDF degli interventi.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map(document => <article key={document.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3"><span className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0"><FileText className="w-6 h-6" /></span><div className="min-w-0"><p className="text-xs text-zinc-500">{document.category}{document.document_date ? ` · ${formatDate(document.document_date)}` : ''}</p><h3 className="font-bold text-zinc-900 break-words">{document.title}</h3><p className="text-xs text-zinc-600 mt-1 break-words">{vehicleMap.get(document.bike_id) || 'Veicolo rimosso'}</p></div></div>
      <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600"><p className="truncate" title={document.file_name}>{document.file_name}</p><p className="mt-1 font-mono">PDF · {formatFileSize(document.size_bytes)}</p></div>
      {document.notes && <p className="text-sm text-zinc-600 whitespace-pre-wrap break-words">{document.notes}</p>}
      <div className="flex gap-2 border-t border-zinc-100 pt-3"><button disabled={busy} onClick={() => downloadDocument(document)} className={`${secondaryButton} flex-1 text-orange-700`}><Download className="w-4 h-4" />Scarica</button><button disabled={busy} onClick={() => removeDocument(document)} className={`${secondaryButton} text-rose-700`} aria-label={`Elimina ${document.title}`}><Trash2 className="w-4 h-4" /></button></div>
    </article>)}</div>)}

    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white"><DialogHeader><DialogTitle>Carica un documento PDF</DialogTitle><DialogDescription>Il file viene salvato nell’archivio online e sarà scaricabile dagli altri dispositivi.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={uploadDocument}>
        <label className="block text-sm">Veicolo<select name="bike_id" required defaultValue={vehicle !== 'all' ? vehicle : bikes[0]?.id} className={input}>{bikes.map(bike => <option key={bike.id} value={bike.id}>{vehicleMap.get(bike.id)}</option>)}</select></label>
        <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Categoria<select name="category" required defaultValue="Assicurazione" className={input}>{DOCUMENT_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label><label className="text-sm">Data documento<input type="date" name="document_date" className={input} /></label></div>
        <label className="block text-sm">Titolo<input name="title" required maxLength={150} className={input} placeholder="Es. Polizza RCA 2027" /></label>
        <label className="block text-sm">File PDF<input name="file" required type="file" accept="application/pdf,.pdf" className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:font-semibold file:text-orange-700`} /><span className="mt-1 block text-xs text-zinc-500">Solo PDF, massimo 20 MB.</span></label>
        <label className="block text-sm">Note<textarea name="notes" maxLength={2000} rows={3} className={input} placeholder="Numero polizza, compagnia o riferimenti utili" /></label>
        {message && <p role="alert" className="text-sm text-rose-700">{message}</p>}
        <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setOpen(false)} className={secondaryButton}>Annulla</button><button type="submit" disabled={busy || Boolean(error)} className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 font-semibold text-white disabled:opacity-50"><Upload className="w-4 h-4" />{busy ? 'Caricamento…' : 'Carica PDF'}</button></div>
      </form>
    </DialogContent></Dialog>
  </div>;
}
