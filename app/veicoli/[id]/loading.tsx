export default function VehicleDashboardLoading() {
  return <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6" aria-label="Caricamento dashboard veicolo">
    <div className="h-28 rounded-2xl border border-zinc-200 bg-white animate-pulse" />
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2].map(item => <div key={item} className="h-28 rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />)}
    </div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="h-52 rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />
      <div className="h-52 rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />
    </div>
  </main>;
}
