'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wrench, Bell, Warehouse, Wallet, FileArchive } from 'lucide-react';
export function BottomNav({ alertsCount = 0 }: { alertsCount?: number }) {
  const pathname = usePathname();
  const links = [
    { href: '/', label: 'Pannello', Icon: LayoutDashboard },
    { href: '/garage', label: 'Veicoli', Icon: Warehouse },
    { href: '/promemoria', label: 'Scadenze', Icon: Bell },
    { href: '/documenti', label: 'Archivio', Icon: FileArchive },
    { href: '/spese', label: 'Spese', Icon: Wallet },
    { href: '/interventi', label: 'Storico', Icon: Wrench },
  ];
  return <nav aria-label="Navigazione mobile" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-zinc-200 px-1 py-1.5 pb-safe md:hidden"><div className="max-w-lg mx-auto grid grid-cols-6">{links.map(({href, label, Icon}) => {
    const active = href === '/' ? pathname === '/' || pathname.startsWith('/veicoli/') : pathname.startsWith(href);
    return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`min-h-12 min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl ${active ? 'text-orange-700 font-semibold' : 'text-zinc-600'}`}><span className="relative"><Icon className="w-5 h-5" />{href === '/promemoria' && alertsCount > 0 && <span className="absolute -top-1 -right-2 rounded-full bg-rose-500 text-white text-[9px] px-1">{alertsCount > 9 ? '9+' : alertsCount}</span>}</span><span className="text-[10px]">{label}</span></Link>;
  })}</div></nav>;
}
