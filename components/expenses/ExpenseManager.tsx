'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { Bike, VehicleExpense } from '@/lib/supabase/types';
import { EXPENSE_CATEGORIES, expenseVehicleLabel, filterExpenses, formatCurrency, summarizeExpenses } from '@/lib/expenses';
import { formatDate, todayISO } from '@/lib/reminders';
import { deleteExpense, saveExpense } from '@/app/actions/expenses';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const input = 'w-full min-h-11 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900';
const button = 'min-h-11 rounded-xl border border-zinc-200 px-3 text-sm font-semibold disabled:opacity-50';
export function ExpenseManager({ bikes, expenses, error, initialVehicle }: { bikes: Bike[]; expenses: VehicleExpense[]; error?: string; initialVehicle?: string }) {
  const [vehicle, setVehicle] = useState(initialVehicle || 'all');
  const [category, setCategory] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Partial<VehicleExpense> | null>(null);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const currentVehicles = new Map(bikes.map(bike => [bike.id, expenseVehicleLabel(bike)]));
  const rows = expenses.map(expense => ({ ...expense, vehicle_label: currentVehicles.get(expense.vehicle_ref) || expense.vehicle_label }));
  const vehicleOptions = new Map(currentVehicles);
  for (const expense of expenses) if (!vehicleOptions.has(expense.vehicle_ref)) vehicleOptions.set(expense.vehicle_ref, `${expense.vehicle_label} (rimosso)`);
  const invalidDates = Boolean(from && to && from > to);
  const filtered = filterExpenses(rows, { vehicle, category, from, to, search });
  const all = summarizeExpenses(rows, bikes);
  const selected = summarizeExpenses(filtered, bikes);
  const action = (run: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => startTransition(async () => {
    try {
      const result = await run();
      setMessage(result.success ? successMessage : result.error || 'Operazione non riuscita.');
      if (result.success) setDraft(null);
    } catch { setMessage('Operazione non riuscita. Riprova tra poco.'); }
  });
  const openNew = () => { setMessage(''); setDraft({ bike_id: currentVehicles.has(vehicle) ? vehicle : bikes[0]?.id, date: todayISO(), category: 'Manutenzione' }); };
  return <div className="space-y-6">
    {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <section aria-label="Totale complessivo" className="rounded-2xl border border-orange-200 bg-orange-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-orange-800">Totale complessivo</p><p className="text-3xl font-bold text-zinc-900 mt-2 break-words">{error ? '—' : formatCurrency(all.total)}</p><p className="text-xs text-zinc-600 mt-1">{error ? 'Dati non disponibili' : `Tutto l’archivio · ${all.count} registrazioni`}</p></section>
      <section aria-label="Totale selezione" className="rounded-2xl border border-zinc-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Totale selezione</p><p className="text-3xl font-bold text-zinc-900 mt-2 break-words">{error || invalidDates ? '—' : formatCurrency(selected.total)}</p><p className="text-xs text-zinc-600 mt-1">In base ai filtri applicati</p></section>
      <section aria-label="Veicoli con spese" className="rounded-2xl border border-zinc-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Veicoli con spese</p><p className="text-3xl font-bold text-zinc-900 mt-2">{error || invalidDates ? '—' : selected.byVehicle.length}</p><p className="text-xs text-zinc-600 mt-1">{error ? 'Dati non disponibili' : `${selected.count} spese nella selezione`}</p></section>
    </div>
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-lg text-zinc-900">Filtri e registrazione</h2><button onClick={openNew} disabled={!bikes.length || Boolean(error) || pending} className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-orange-600 text-white px-4 font-semibold disabled:opacity-50"><Plus className="h-4 w-4" />Nuova spesa</button></div>
      {!bikes.length && <p className="text-sm text-zinc-600">Per registrare nuove spese, <Link href="/garage" className="text-orange-700 font-semibold underline">aggiungi un veicolo</Link>. Le spese archiviate restano consultabili.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="text-xs text-zinc-600">Veicolo<select aria-label="Veicolo" className={input} value={vehicle} onChange={e => setVehicle(e.target.value)}><option value="all">Tutti i veicoli</option>{[...vehicleOptions].map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label className="text-xs text-zinc-600">Categoria<select aria-label="Categoria" className={input} value={category} onChange={e => setCategory(e.target.value)}><option value="all">Tutte le categorie</option>{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="text-xs text-zinc-600">Dal<input type="date" className={input} value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label className="text-xs text-zinc-600">Al<input type="date" className={input} value={to} onChange={e => setTo(e.target.value)} /></label>
      </div>
      <div className="flex flex-col sm:flex-row gap-3"><label className="text-xs text-zinc-600 flex-1">Ricerca<input className={input} placeholder="Descrizione, note o veicolo…" value={search} onChange={e => setSearch(e.target.value)} /></label><button className={`${button} self-end`} onClick={() => {setVehicle('all');setCategory('all');setFrom('');setTo('');setSearch('');}}>Azzera filtri</button></div>
      {invalidDates && <p role="alert" className="text-sm text-rose-700">La data iniziale deve precedere o coincidere con quella finale.</p>}
    </section>
    {message && !draft && <p role="status" className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">{message}</p>}
    {!error && !invalidDates && <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4"><div><h2 className="font-bold text-lg">Suddivisione per veicolo</h2><p className="text-xs text-zinc-600">Totali della selezione · scegli un veicolo per filtrare il registro</p></div>{selected.byVehicle.length === 0 ? <p className="text-sm text-zinc-500">Nessuna spesa nella selezione.</p> : selected.byVehicle.map(row => <button key={row.id} onClick={() => setVehicle(row.id)} className="w-full min-h-12 text-left rounded-xl border border-zinc-200 p-3 hover:border-orange-300"><span className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-sm min-w-0 break-words">{row.label}{row.removed && <span className="block text-xs font-normal text-zinc-500">Veicolo rimosso</span>}</span><span className="font-bold font-mono text-sm">{formatCurrency(row.cents)}</span></span><span className="block text-xs text-zinc-500 mt-1">{row.count} registrazioni · {selected.total > 0 ? (row.cents / selected.total * 100).toLocaleString('it-IT',{maximumFractionDigits:1}) : 0}% del totale selezionato</span></button>)}</section>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4"><h2 className="font-bold text-lg">Suddivisione per categoria</h2>{selected.byCategory.length === 0 ? <p className="text-sm text-zinc-500">Nessuna spesa nella selezione.</p> : selected.byCategory.map(row => <div key={row.category}><div className="flex justify-between gap-2 text-sm mb-2"><span>{row.category}</span><strong className="font-mono">{formatCurrency(row.cents)}</strong></div><div className="h-2 rounded-full bg-zinc-100"><div className="h-full rounded-full bg-orange-500" style={{width:`${selected.total ? row.cents / selected.total * 100 : 0}%`}} /></div></div>)}</section>
      </div>
      <section className="space-y-3"><h2 className="text-lg font-bold text-zinc-900">Registro spese <span className="text-zinc-500 text-sm font-normal">({filtered.length})</span></h2>
        {filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center"><Wallet className="w-9 h-9 mx-auto text-zinc-400 mb-3" /><p className="font-semibold">{expenses.length ? 'Nessuna spesa corrisponde ai filtri' : 'Nessuna spesa registrata'}</p><p className="text-sm text-zinc-600 mt-1">{expenses.length ? 'Modifica il periodo o azzera i filtri.' : 'Le nuove registrazioni compariranno qui e aggiorneranno i totali.'}</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{filtered.map(expense => <article key={expense.id} className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3"><div className="flex flex-wrap justify-between gap-2"><div className="min-w-0"><p className="text-xs text-zinc-500">{formatDate(expense.date)} · {expense.category}</p><h3 className="text-base font-semibold text-zinc-900 break-words">{expense.description}</h3></div><p className="font-bold text-lg font-mono text-orange-800">{formatCurrency(expense.amount_cents)}</p></div><p className="text-sm text-zinc-600 break-words">{expense.vehicle_label}{!currentVehicles.has(expense.vehicle_ref) && ' · Veicolo rimosso'}</p>{expense.notes && <p className="text-sm text-zinc-500 whitespace-pre-wrap break-words">{expense.notes}</p>}<div className="flex gap-2 pt-3 border-t border-zinc-100"><button disabled={pending} onClick={() => {setMessage('');setDraft(expense);}} className={`${button} inline-flex items-center gap-2`}><Pencil className="w-4 h-4" />Modifica</button><button disabled={pending} onClick={() => { if (confirm('Eliminare questa spesa? I totali verranno aggiornati.')) action(() => deleteExpense(expense.id), 'Spesa eliminata.'); }} className={`${button} inline-flex items-center gap-2 text-rose-700`}><Trash2 className="w-4 h-4" />Elimina</button></div></article>)}</div>}
      </section>
    </>}
    <Dialog open={draft !== null} onOpenChange={open => {if (!pending && !open) setDraft(null);}}><DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white"><DialogHeader><DialogTitle>{draft?.id ? 'Modifica spesa' : 'Registra una spesa'}</DialogTitle><DialogDescription>Associa l’importo al veicolo e indica data e categoria. Tutti gli importi sono in euro.</DialogDescription></DialogHeader>
      {draft && <form key={draft.id || 'new'} className="space-y-4" onSubmit={e => {e.preventDefault(); const data = new FormData(e.currentTarget);if (draft.id) data.set('id',draft.id); action(() => saveExpense(data), 'Spesa salvata.');}}>
        <label className="block text-sm">Veicolo<select aria-label="Veicolo" name="bike_id" required defaultValue={draft.vehicle_ref || draft.bike_id || bikes[0]?.id} className={input}>{bikes.map(bike => <option key={bike.id} value={bike.id}>{expenseVehicleLabel(bike)}</option>)}{draft.vehicle_ref && !currentVehicles.has(draft.vehicle_ref) && <option value={draft.vehicle_ref}>{draft.vehicle_label} (rimosso)</option>}</select></label>
        <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm">Data<input type="date" name="date" required defaultValue={draft.date || todayISO()} className={input} /></label><label className="text-sm">Importo (€)<input name="amount" required inputMode="decimal" maxLength={10} placeholder="Es. 125,50" defaultValue={draft.amount_cents == null ? '' : (draft.amount_cents / 100).toFixed(2).replace('.',',')} className={input} /></label></div>
        <label className="block text-sm">Categoria<select aria-label="Categoria" name="category" required defaultValue={draft.category || 'Manutenzione'} className={input}>{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="block text-sm">Descrizione<input name="description" required maxLength={200} defaultValue={draft.description || ''} placeholder="Es. Tagliando annuale o rinnovo RCA" className={input} /></label>
        <label className="block text-sm">Note / riferimento documento<textarea name="notes" maxLength={3000} rows={3} defaultValue={draft.notes || ''} className={input} /></label>
        {message && <p role="alert" className="text-sm text-rose-700">{message}</p>}
        <div className="flex justify-end gap-2"><button type="button" disabled={pending} onClick={() => setDraft(null)} className={button}>Annulla</button><button type="submit" disabled={pending || Boolean(error)} className="min-h-11 rounded-xl bg-orange-600 text-white px-5 font-semibold disabled:opacity-50">{pending ? 'Salvataggio…' : 'Salva spesa'}</button></div>
      </form>}
    </DialogContent></Dialog>
  </div>;
}
