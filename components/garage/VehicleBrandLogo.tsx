import type { Bike } from '@/lib/supabase/types';
import { VehicleIcon } from './VehicleViewer';

function brandFor(vehicle: Bike) {
  const value = `${vehicle.name} ${vehicle.model}`.toLocaleLowerCase('it-IT');
  if (/\baudi\b/.test(value)) return 'audi';
  if (/\bfiat\b/.test(value) || /\bpanda\b/.test(value)) return 'fiat';
  return null;
}

export function VehicleBrandLogo({ vehicle }: { vehicle: Bike }) {
  const brand = brandFor(vehicle);

  if (brand === 'audi') {
    return <div aria-label="Audi" role="img" className="w-14 h-14 rounded-xl border border-zinc-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
      <svg viewBox="0 0 120 48" className="w-11 h-auto text-zinc-900" aria-hidden="true">
        {[24, 48, 72, 96].map(cx => <circle key={cx} cx={cx} cy="24" r="17" fill="none" stroke="currentColor" strokeWidth="4.5" />)}
      </svg>
    </div>;
  }

  if (brand === 'fiat') {
    return <div aria-label="Fiat" role="img" className="w-14 h-14 rounded-xl border border-zinc-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
      <svg viewBox="0 0 64 64" className="w-11 h-11" aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="#9d1720" stroke="#b9bcc1" strokeWidth="3" />
        <circle cx="32" cy="32" r="24" fill="none" stroke="#d7d9dc" strokeWidth="1.5" />
        <text x="32" y="38" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Arial, sans-serif" letterSpacing="1">FIAT</text>
      </svg>
    </div>;
  }

  return <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${vehicle.primary_color || '#ea580c'}, ${vehicle.accent_color || '#18181b'})` }}>
    <VehicleIcon bike={vehicle} className="w-7 h-7" />
  </div>;
}
