'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export function WorkspaceHeader() {
  const pathname = usePathname();
  const links = [['/', 'Pannello'], ['/garage', 'Veicoli'], ['/interventi', 'Interventi'], ['/promemoria', 'Scadenze'], ['/spese', 'Spese']];
  return <header className="border-b border-zinc-200 bg-white px-4 sm:px-6 py-4"><div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4"><Link href="/" className="font-bold text-lg text-zinc-900">FleetDesk</Link><nav aria-label="Navigazione principale" className="hidden md:flex flex-wrap gap-2 text-sm">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={`min-h-11 inline-flex items-center rounded-xl px-3 ${pathname === href ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-zinc-600 hover:bg-zinc-100'}`}>{label}</Link>)}</nav></div></header>;
}
