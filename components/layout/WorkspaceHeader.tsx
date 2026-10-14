'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
export function WorkspaceHeader() {
  const pathname = usePathname();
  const links = [['/', 'Home'], ['/garage', 'Veicoli'], ['/promemoria', 'Scadenze'], ['/spese', 'Spese'], ['/documenti', 'Documenti'], ['/interventi', 'Straordinari']];
  return <header className="border-b border-zinc-200 bg-white px-4 sm:px-6 py-3"><div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4"><Link href="/" className="flex items-center gap-2 font-bold text-lg text-zinc-900"><Image src="/icons/icon-192x192.png" alt="LP Garage" width={40} height={40} className="w-10 h-10 rounded-xl border border-zinc-200" />GestionaleVeicoli</Link><nav aria-label="Navigazione principale" className="hidden md:flex flex-wrap gap-1 text-sm">{links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={`min-h-10 inline-flex items-center rounded-xl px-3 ${pathname === href ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-zinc-600 hover:bg-zinc-100'}`}>{label}</Link>)}</nav></div></header>;
}
