export type MaintenanceCategory = 
  | 'Tagliando'
  | 'Olio & Filtri'
  | 'Trasmissione/Catena'
  | 'Gomme'
  | 'Freni'
  | 'Sospensioni'
  | 'Varie';

export const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
  'Tagliando',
  'Olio & Filtri',
  'Trasmissione/Catena',
  'Gomme',
  'Freni',
  'Sospensioni',
  'Varie'
];

export type BikeCategory = 
  | 'naked' 
  | 'sport' 
  | 'adventure' 
  | 'enduro' 
  | 'cross' 
  | 'cruiser' 
  | 'scooter';

export interface BikeCategoryOption {
  value: BikeCategory;
  label: string;
  description: string;
}

export const BIKE_CATEGORIES: BikeCategoryOption[] = [
  { value: 'naked', label: 'Naked / Roadster', description: 'Telaio a vista, manubrio dritto, assetto agile' },
  { value: 'sport', label: 'Sportiva / Supersport', description: 'Carenatura aerodinamica, semimanubri bassi' },
  { value: 'adventure', label: 'Adventure / Maxi-Enduro', description: 'Assetto rialzato, cupolino e serbatoio capiente' },
  { value: 'enduro', label: 'Enduro / Dual-Sport', description: 'Tassellata specialistica con fari ed escursione lunga' },
  { value: 'cross', label: 'Cross / Motocross', description: 'Gare e pista, tabella portanumero, peso piuma' },
  { value: 'cruiser', label: 'Custom / Cruiser', description: 'Interasse lungo, manubrio aperto, sella ribassata' },
  { value: 'scooter', label: 'Maxi Scooter / Urban', description: 'Pedana sagomata, scudo frontale ampio' },
];

export interface Bike {
  id: string;
  name: string;
  model: string;
  year: number | null;
  current_km_hours: number;
  created_at: string;
  image_url?: string | null;
  category?: BikeCategory | string;
  primary_color?: string;
  accent_color?: string;
}

export interface MaintenanceLog {
  id: string;
  bike_id: string;
  date: string;
  km_hours: number;
  category: MaintenanceCategory | string;
  description: string;
  cost: number;
  image_url: string | null;
  next_due_km_hours: number | null;
  created_at: string;
  bike?: Bike;
}

export type ReminderStatus = 'ok' | 'warning' | 'expired';

export interface ReminderItem {
  id: string;
  bikeId: string;
  bikeName: string;
  category: string;
  description: string;
  lastDoneKm: number;
  currentKm: number;
  nextDueKm: number;
  kmRemaining: number;
  status: ReminderStatus;
}
