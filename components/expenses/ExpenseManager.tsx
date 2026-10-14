'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarClock, Plus, Wallet, Wrench } from 'lucide-react';
import type { AutomaticExpense } from '@/lib/automatic-expenses';
import type { Bike } from '@/lib/supabase/types';
import { formatCurrency } from '@/lib/expenses';
import { formatDate } from '@/lib/reminders';

const input = 'w-full min-h-11 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900';
const currentYear = new Date().getFullYear();
const yearStart = `${currentYear}-01-01`;
const yearEnd = `${currentYear}-12-31`;

function total(rows: AutomaticExpense[]) {
  return rows.reduce((sum, row) => sum + row.amountCents, 0);
}

export function ExpenseManager({ bikes, expenses, error, initialVehicle }: { bikes: Bike[]; expenses: AutomaticExpense[]; error?: string; initialVehicle?: string }) {
  const [vehicle, setVehicle] = useState(initialVehicle || 'all');
  const [source, setSource] = useState('all');
  const [category, setCategory] = useState('all');
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(yearEnd);
  const [search, setSearch] = useState('');
  const invalidDates = Boolean(from && to && from > to);
  const categories = useMemo(() => [...new Set(expenses.map(row => row.category))].sort((a, b) => a.localeCompare(b, 'it')), [expenses]);
  const annualRows = expenses.filter(row => row.date >= yearStart && row.date <= yearEnd);
  const filtered = expenses.filter(row => {
    const query = search.trim().toLocaleLowerCase('it-IT');
    return (vehicle === 'all' || row.vehicleId === vehicle)
      && (source === 'all' || row.source === source)
      && (category === 'all' || row.category === category)
      && (!from || row.date >= from) && (!to || row.date <= to)
      && (!query || `${row.description} ${row.notes} ${row.vehicleLabel}`.toLocaleLowerCase('it-IT').includes(query));
  });
  const recurringRows = annualRows.filter(row => row.source === 'recurring');
  const extraordinaryRows = annualRows.filter(row => row.source === 'extraordinary');
  const byVehicle = bikes.map(bike => {
    const rows = filtered.filter(row => row.vehicleId === bike.id);
    return { bike, count: rows.length, cents: total(rows) };
  }).filter(row => row.count).sort((a, b) => b.cents - a.cents);

  const resetFilters = () => { setVehicle('all'); setSource('all'); setCategory('all'); setFrom(yearStart); setTo(yearEnd); setSearch(''); };

  return <div className="space-y-6">
    {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-orange-800">Totale {currentYear}</p><p className="text-3xl font-bold text-zinc-900 mt-2 break-words">{error ? '—' : formatCurrency(total(annualRows))}</p><p className="text-xs text-zinc-600 mt-1">Tutto il parco veicoli</p></section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Spese ricorrenti</p><p className="text-3xl font-bold text-zinc-900 mt-2 break-words">{error ? '—' : formatCurrency(total(recurringRows))}</p><p className="text-xs text-zinc-600 mt-1">{recurringRows.length} scadenze con importo</p></section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Spese straordinarie</p><p className="text-3xl font-bold text-zinc-900 mt-2 break-words">{error ? '—' : formatCurrency(total(extraordinaryRows))}</p><p className="text-xs text-zinc-600 mt-1">{extraordinaryRows.length} interventi con costo</p></section>
    </div>

    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-lg text-zinc-900">Registro automatico</h2><p className="text-xs text-zinc-600 mt-1">Le scadenze alimentano le spese ricorrenti; gli interventi con costo alimentano le straordinarie.</p></div><div className="flex flex-wrap gap-2"><Link href={`/promemoria?new=1${vehicle !== 'all' ? `&vehicle=${vehicle}` : ''}`} className="min-h-11 inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-semibold"><CalendarClock className="h-4 w-4" />Nuova scadenza</Link><Link href={vehicle !== 'all' ? `/interventi/nuovo?vehicle=${vehicle}` : '/interventi/nuovo'} className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-orange-600 text-white px-3 text-sm font-semibold"><Plus className="h-4 w-4" />Spesa straordinaria</Link></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="text-xs text-zinc-600">Veicolo<select aria-label="Veicolo" className={input} value={vehicle} onChange={event => setVehicle(event.target.value)}><option value="all">Tutti i veicoli</option>{bikes.map(bike => <option key={bike.id} value={bike.id}>{bike.name} {bike.model}</option>)}</select></label>
        <label className="text-xs text-zinc-600">Tipo<select aria-label="Tipo spesa" className={input} value={source} onChange={event => setSource(event.target.value)}><option value="all">Tutte</option><option value="recurring">Ricorrenti</option><option value="extraordinary">Straordinarie</option></select></label>
        <label className="text-xs text-zinc-600">Categoria<select aria-label="Categoria" className={input} value={category} onChange={event => setCategory(event.target.value)}><option value="all">Tutte</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs text-zinc-600">Dal<input type="date" className={input} value={from} onChange={event => setFrom(event.target.value)} /></label>
        <label className="text-xs text-zinc-600">Al<input type="date" className={input} value={to} onChange={event => setTo(event.target.value)} /></label>
      </div>
      <div className="flex flex-col sm:flex-row gap-3"><label className="text-xs text-zinc-600 flex-1">Ricerca<input className={input} placeholder="Descrizione o veicolo…" value={search} onChange={event => setSearch(event.target.value)} /></label><button className="min-h-11 self-end rounded-xl border border-zinc-200 px-3 text-sm font-semibold" onClick={resetFilters}>Azzera filtri</button></div>
      {invalidDates && <p role="alert" className="text-sm text-rose-700">La data iniziale deve precedere o coincidere con quella finale.</p>}
    </section>

    {!error && !invalidDates && <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-lg">Totali per veicolo</h2><p className="text-xs text-zinc-600">In base ai filtri selezionati</p></div><strong className="font-mono text-lg">{formatCurrency(total(filtered))}</strong></div>{byVehicle.length === 0 ? <p className="text-sm text-zinc-500">Nessuna spesa nel periodo selezionato.</p> : <div className="grid sm:grid-cols-2 gap-3">{byVehicle.map(row => <button key={row.bike.id} onClick={() => setVehicle(row.bike.id)} className="rounded-xl border border-zinc-200 p-3 text-left hover:border-orange-300"><span className="flex justify-between gap-2"><span className="font-semibold text-sm">{row.bike.name} {row.bike.model}</span><span className="font-bold font-mono text-sm">{formatCurrency(row.cents)}</span></span><span className="block text-xs text-zinc-500 mt-1">{row.count} {row.count === 1 ? 'voce' : 'voci'}</span></button>)}</div>}</section>

      <section className="space-y-3"><h2 className="text-lg font-bold text-zinc-900">Dettaglio spese <span className="text-zinc-500 text-sm font-normal">({filtered.length})</span></h2>{filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center"><Wallet className="w-9 h-9 mx-auto text-zinc-400 mb-3" /><p className="font-semibold">Nessuna spesa nel periodo selezionato</p><p className="text-sm text-zinc-600 mt-1">Inserisci gli importi nelle scadenze o registra un intervento straordinario.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{filtered.map(expense => <article key={expense.id} className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-zinc-500">{formatDate(expense.date)} · {expense.category}</p><h3 className="text-base font-semibold text-zinc-900 break-words">{expense.description}</h3></div><p className="font-bold text-lg font-mono text-orange-800 shrink-0">{formatCurrency(expense.amountCents)}</p></div><div className="flex items-center justify-between gap-2 text-sm text-zinc-600"><span className="break-words">{expense.vehicleLabel}</span><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${expense.source === 'recurring' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-800'}`}>{expense.source === 'recurring' ? <CalendarClock className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}{expense.source === 'recurring' ? 'Ricorrente' : 'Straordinaria'}</span></div>{expense.notes && <p className="text-sm text-zinc-500 whitespace-pre-wrap break-words">{expense.notes}</p>}</article>)}</div>}</section>
    </>}
  </div>;
}
