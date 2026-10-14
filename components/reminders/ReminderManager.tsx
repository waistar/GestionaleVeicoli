'use client';
import { useState, useTransition } from 'react';
import { Bike, ReminderItem, VehicleReminder } from '@/lib/supabase/types';
import { catalogFor, categoryUsesMileage, SERVICE_CATALOG, vehicleType, vehicleTypeLabel } from '@/lib/vehicle-catalog';
import { completeReminder, deleteReminder, saveReminder } from '@/app/actions/reminders';
import { formatDate } from '@/lib/reminders';
import { RemindersList } from './RemindersList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const input = 'w-full min-h-11 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900';
export function ReminderManager({ bikes, reminders, scheduled, isFallback, error, initialVehicle, openNew = false }: { bikes: Bike[]; reminders: ReminderItem[]; scheduled: VehicleReminder[]; isFallback: boolean; error?: string; initialVehicle?: string; openNew?: boolean }) {
  const requestedVehicle = bikes.some(b => b.id === initialVehicle) ? initialVehicle! : bikes[0]?.id || '';
  const [vehicle, setVehicle] = useState(initialVehicle && requestedVehicle ? requestedVehicle : 'all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [catalogVehicle, setCatalogVehicle] = useState(requestedVehicle);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [draft, setDraft] = useState<Partial<VehicleReminder> | null>(openNew && requestedVehicle ? { bike_id: requestedVehicle, category: 'Assicurazione RCA', title: 'Assicurazione RCA', warning_days: 30, warning_km: 500 } : null);
  const [draftCategory, setDraftCategory] = useState(openNew && requestedVehicle ? 'Assicurazione RCA' : '');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const selectedBike = bikes.find(b => b.id === catalogVehicle);
  const list = reminders.filter(r => (vehicle === 'all' || r.bikeId === vehicle) && (status === 'all' || r.status === status) && `${r.title || ''} ${r.category} ${r.description} ${r.bikeName}`.toLowerCase().includes(search.toLowerCase()));
  const counts = { expired: reminders.filter(r => r.status === 'expired').length, warning: reminders.filter(r => r.status === 'warning').length, all: reminders.length };
  const newDraft = (category = 'Tagliando') => { setMessage(''); setDraftCategory(category); setDraft({ bike_id: catalogVehicle, category, title: category, warning_days: 30, warning_km: 500 }); };
  const usesMileage = categoryUsesMileage(draftCategory);
  const execute = (action: () => Promise<{success: boolean; error?: string}>) => startTransition(async () => {
    try { const result = await action(); setMessage(result.success ? 'Operazione salvata.' : result.error || 'Operazione non riuscita.'); if (result.success) setDraft(null); }
    catch { setMessage('Operazione non riuscita. Riprova.'); }
  });
  return <div className="space-y-6">
    {isFallback && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Anteprima con veicoli e scadenze dimostrativi. Configura il database per salvare i dati.</p>}
    {error && !isFallback && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Scadenzario non disponibile: aggiornare il database con lo schema del progetto. {error}</p>}
    <div className="grid grid-cols-3 gap-3">{[['Scadute', counts.expired, 'text-rose-700'], ['In scadenza', counts.warning, 'text-amber-700'], ['Programmate', counts.all, 'text-zinc-900']].map(([label, count, color]) => <div key={String(label)} className="rounded-2xl border border-zinc-200 bg-white p-4"><p className="text-xs text-zinc-600">{label}</p><p className={`text-3xl font-bold ${color}`}>{count}</p></div>)}</div>
    <div className="flex flex-col md:flex-row gap-3">
      <label className="flex-1 text-xs text-zinc-600">Veicolo<select aria-label="Filtra per veicolo" className={input} value={vehicle} onChange={e => setVehicle(e.target.value)}><option value="all">Tutti i veicoli</option>{bikes.map(b => <option key={b.id} value={b.id}>{vehicleTypeLabel(b)} · {b.name} {b.model} {b.plate}</option>)}</select></label>
      <label className="text-xs text-zinc-600">Stato<select className={input} value={status} onChange={e => setStatus(e.target.value)}><option value="all">Tutti gli stati</option><option value="expired">Scadute</option><option value="warning">In scadenza</option><option value="ok">Programmate</option></select></label>
      <label className="flex-1 text-xs text-zinc-600">Ricerca<input className={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Bollo, targa, assicurazione…" /></label>
      <button onClick={() => newDraft()} className="self-end min-h-11 rounded-xl bg-orange-600 px-4 text-white font-semibold">+ Nuova scadenza</button>
    </div>
    {message && !draft && <p role="status" className="rounded-xl border border-zinc-200 p-3 text-sm">{message}</p>}
    <RemindersList reminders={list} disabled={pending || isFallback || Boolean(error)} onEdit={item => { setMessage(''); setDraftCategory(item.scheduled?.category || ''); setDraft(item.scheduled || null); }} onComplete={item => { if (confirm('Confermi il completamento? Verrà registrato nello storico del veicolo.')) execute(() => completeReminder(item.scheduled!.id)); }} />
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
      <div><h2 className="text-lg font-bold text-zinc-900">Catalogo controlli e adempimenti</h2><p className="text-sm text-zinc-600">Scegli cosa pianificare per ciascun veicolo. Le voci non pianificate non vengono considerate in regola. Date e intervalli vanno verificati sui documenti e sul piano del costruttore.</p></div>
      <div className="flex flex-col sm:flex-row gap-3"><label className="flex-1 text-xs text-zinc-600">Pianifica per<select className={input} value={catalogVehicle} onChange={e => setCatalogVehicle(e.target.value)}>{bikes.map(b => <option key={b.id} value={b.id}>{b.name} {b.model} · {vehicleTypeLabel(b)}</option>)}</select></label><label className="flex-1 text-xs text-zinc-600">Cerca nel catalogo<input className={input} value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Bollo, assicurazione, cambio gomme…" /></label></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[32rem] overflow-y-auto pr-1">{catalogFor(selectedBike ? vehicleType(selectedBike) : 'moto').filter(c => `${c.label} ${c.group}`.toLowerCase().includes(catalogSearch.toLowerCase())).map(c => {
        const planned = reminders.some(r => r.bikeId === catalogVehicle && r.category === c.label);
        return <div key={c.label} className="rounded-xl border border-zinc-200 p-3 flex items-center justify-between gap-2"><div><p className="text-[11px] text-zinc-500">{c.group}</p><h3 className="text-sm font-semibold">{c.label}</h3><span className={`text-xs ${planned ? 'text-emerald-700' : 'text-zinc-500'}`}>{planned ? 'Pianificata' : 'Da valutare'}</span></div><button onClick={() => newDraft(c.label)} className="min-h-11 px-2 text-sm font-semibold text-orange-700">Pianifica</button></div>;
      })}</div>
    </section>
    {scheduled.some(r => r.completed_at && (vehicle === 'all' || r.bike_id === vehicle)) && <details className="rounded-2xl border border-zinc-200 bg-white p-5"><summary className="font-semibold cursor-pointer">Scadenze completate · rinnova con una nuova data</summary><div className="mt-3 space-y-3">{scheduled.filter(r => r.completed_at && (vehicle === 'all' || r.bike_id === vehicle)).map(r => <div key={r.id} className="flex justify-between items-center gap-3 border-t border-zinc-100 pt-3"><div><p className="font-semibold">{r.title}</p><p className="text-xs text-zinc-600">{bikes.find(b => b.id === r.bike_id)?.name} · completata {formatDate(r.completed_at!.slice(0,10))}</p></div><button disabled={pending || isFallback} onClick={() => {setMessage(''); setDraftCategory(r.category); setDraft({...r, due_date: null, due_km: null});}} className="min-h-11 px-3 text-orange-700 font-semibold">Rinnova</button></div>)}</div></details>}
    <Dialog open={draft !== null} onOpenChange={open => { if (!pending && !open) { setDraft(null); setDraftCategory(''); } }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl bg-white"><DialogHeader><DialogTitle>{draft?.id ? 'Modifica / rinnova scadenza' : 'Pianifica una scadenza'}</DialogTitle><DialogDescription>{usesMileage ? 'Compila la data, il chilometraggio o entrambi. L’avviso si attiva alla prima soglia raggiunta.' : 'Compila la data di scadenza e l’anticipo dell’avviso.'}</DialogDescription></DialogHeader>
      {draft && <form key={`${draft.id || 'new'}:${draft.category}`} className="space-y-4" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); if (draft.id) form.set('id', draft.id); execute(() => saveReminder(form)); }}>
        <label className="block text-sm">Veicolo<select required name="bike_id" defaultValue={draft.bike_id} className={input}>{bikes.map(b => <option key={b.id} value={b.id}>{b.name} {b.model} {b.plate}</option>)}</select></label>
        <label className="block text-sm">Categoria<select name="category" value={draftCategory} onChange={event => setDraftCategory(event.target.value)} className={input}>{[...new Set([...SERVICE_CATALOG.map(c => c.label), ...(draft.category ? [draft.category] : [])])].map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="block text-sm">Titolo<input required maxLength={150} name="title" defaultValue={draft.title} className={input} placeholder="Es. Rinnovo RCA furgone" /></label>
        <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Data di scadenza<input required={!usesMileage} type="date" name="due_date" defaultValue={draft.due_date || ''} className={input} /></label>{usesMileage && <label className="text-sm">Soglia chilometrica<input type="number" min="0" step="any" name="due_km" defaultValue={draft.due_km ?? ''} className={input} /></label>}<label className="text-sm">Avviso giorni prima<input required type="number" min="0" max="365" name="warning_days" defaultValue={draft.warning_days ?? 30} className={input} /></label>{usesMileage && <label className="text-sm">Avviso km prima<input required type="number" min="0" max="100000" name="warning_km" defaultValue={draft.warning_km ?? 500} className={input} /></label>}</div>
        <label className="block text-sm">Note / riferimento documento<textarea maxLength={3000} name="notes" defaultValue={draft.notes || ''} className={input} rows={3} /></label>
        {message && <p role="alert" className="text-sm text-rose-700">{message}</p>}
        <div className="flex flex-wrap gap-2 justify-between">{draft.id && <button type="button" disabled={pending || isFallback} onClick={() => { if(confirm('Eliminare questa scadenza? Lo storico interventi viene conservato.')) execute(() => deleteReminder(draft.id!)); }} className="min-h-11 text-rose-700 px-3">Elimina</button>}<button type="submit" disabled={pending || isFallback || Boolean(error)} className="min-h-11 rounded-xl bg-orange-600 text-white px-5 font-semibold disabled:opacity-50">{pending ? 'Salvataggio…' : isFallback ? 'Anteprima · salvataggio non disponibile' : 'Salva scadenza'}</button></div>
      </form>}
    </DialogContent></Dialog>
  </div>;
}
