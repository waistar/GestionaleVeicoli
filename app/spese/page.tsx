import { getAllBikes } from '@/app/actions/bikes';
import { getExpenses } from '@/app/actions/expenses';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { ExpenseManager } from '@/components/expenses/ExpenseManager';
export const dynamic = 'force-dynamic';
export default async function SpesePage() {
  const [fleet, ledger] = await Promise.all([getAllBikes(), getExpenses()]);
  const error = ledger.error || (fleet.isFallback ? 'Impossibile caricare i veicoli. Verifica il collegamento al database e riprova.' : undefined);
  return <><WorkspaceHeader /><main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Gestione interna · tutti i veicoli</p><h1 className="text-2xl font-bold text-zinc-900">Spese del parco veicoli</h1><p className="mt-2 text-sm text-zinc-600">Registra le uscite e confronta i totali per veicolo, categoria e periodo.</p></div><ExpenseManager bikes={fleet.bikes} expenses={ledger.expenses} error={error} /></main><BottomNav /></>;
}
