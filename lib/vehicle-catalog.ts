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
  'Documenti e adempimenti': ['Bollo', 'Superbollo', 'Assicurazione RCA', 'Garanzie assicurative accessorie', 'Revisione', 'Soccorso stradale', 'Garanzia veicolo', 'Permessi e autorizzazioni', 'Documenti di circolazione'],
  'Motore e trasmissione': ['Tagliando', 'Olio & Filtri', 'Filtro aria', 'Filtro carburante', 'Candele', 'Distribuzione', 'Cinghia servizi', 'Frizione', 'Cambio e differenziale', 'Trasmissione/Catena', 'Trasmissione CVT e rulli', 'Gioco valvole', 'Controllo motore'],
  'Sicurezza e assetto': ['Gomme', 'Pneumatici stagionali', 'Freni', 'Liquido freni', 'Sospensioni', 'Sterzo e convergenza', 'Cuscinetti e ruote', 'Luci e segnalatori', 'Cinture e airbag', 'Equipaggiamento di emergenza'],
  'Impianti e carrozzeria': ['Batteria 12V', 'Batteria di trazione', 'Ricarica elettrica', 'Raffreddamento', 'Climatizzatore', 'Filtro abitacolo', 'Tergicristalli e lavavetri', 'Scarico e antinquinamento', 'AdBlue', 'Impianto GPL / Metano', 'Carrozzeria e cristalli', 'Diagnosi elettronica'],
  'Uso professionale e personalizzate': ['Attrezzature e allestimenti', 'Vano di carico e ancoraggi', 'Cronotachigrafo', 'Controlli pre-utilizzo', 'Pulizia e sanificazione', 'Richiami del costruttore', 'Varie'],
} as const;
export const SERVICE_CATALOG = Object.entries(items).flatMap(([group, labels]) => labels.map(label => ({ label, group })));
export const serviceGroup = (category: string) => SERVICE_CATALOG.find(c => c.label === category)?.group || 'Personalizzata';
const fourWheels = new Set(['Superbollo', 'Cinghia servizi', 'Cinture e airbag', 'Climatizzatore', 'Filtro abitacolo', 'Tergicristalli e lavavetri', 'AdBlue', 'Vano di carico e ancoraggi', 'Cronotachigrafo']);
export function catalogFor(type: VehicleType) {
  return SERVICE_CATALOG.filter(item => {
    if (fourWheels.has(item.label) && (type === 'moto' || type === 'scooter')) return false;
    if (item.label === 'Trasmissione CVT e rulli') return type === 'scooter';
    if (item.label === 'Trasmissione/Catena') return type === 'moto';
    if (['Vano di carico e ancoraggi', 'Cronotachigrafo'].includes(item.label)) return type === 'furgone';
    return true;
  });
}
