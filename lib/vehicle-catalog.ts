export const VEHICLE_TYPES = [
  { value: 'auto', label: 'Auto' },
  { value: 'furgone', label: 'Furgone' },
  { value: 'moto', label: 'Moto' },
  { value: 'scooter', label: 'Scooter' },
] as const;
export type VehicleType = typeof VEHICLE_TYPES[number]['value'];
export const vehicleType = (vehicle: { vehicle_type?: string; category?: string }): VehicleType =>
  vehicle.vehicle_type as VehicleType || (vehicle.category === 'scooter' ? 'scooter' : 'moto');
export const vehicleTypeLabel = (vehicle: { vehicle_type?: string; category?: string }) =>
  VEHICLE_TYPES.find(t => t.value === vehicleType(vehicle))?.label || 'Veicolo';

const items = {
  'Documenti e adempimenti': ['Bollo', 'Assicurazione RCA', 'Revisione', 'Abbonamento parcheggio / sosta blu'],
  'Manutenzione programmata': ['Tagliando', 'Cambio olio', 'Cambio gomme'],
} as const;
export const SERVICE_CATALOG = Object.entries(items).flatMap(([group, labels]) => labels.map(label => ({ label, group })));
export const serviceGroup = (category: string) => SERVICE_CATALOG.find(c => c.label === category)?.group || 'Personalizzata';
const DATE_ONLY_CATEGORIES = new Set(['Bollo', 'Assicurazione RCA', 'Revisione']);
export const categoryUsesMileage = (category: string) => !DATE_ONLY_CATEGORIES.has(category);
export function catalogFor(type: VehicleType) {
  void type;
  return SERVICE_CATALOG;
}
