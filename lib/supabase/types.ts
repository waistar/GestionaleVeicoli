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

export interface Bike {
  id: string;
  name: string;
  model: string;
  year: number | null;
  current_km_hours: number;
  created_at: string;
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
