import { SERVICE_CATALOG, type VehicleType } from '../vehicle-catalog';
export type MaintenanceCategory = string;
export const MAINTENANCE_CATEGORIES = SERVICE_CATALOG.map(c => c.label);

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
  vehicle_type?: VehicleType;
  plate?: string | null;
}

export interface MaintenanceLog {
  id: string;
  bike_id: string;
  date: string;
  km_hours: number;
  category: MaintenanceCategory | string;
  description: string;
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
  nextDueKm: number | null;
  kmRemaining: number | null;
  title?: string;
  dueDate?: string | null;
  daysRemaining?: number | null;
  source?: 'log' | 'schedule';
  scheduled?: VehicleReminder;
  status: ReminderStatus;
}

export interface VehicleReminder {
  id: string;
  bike_id: string;
  title: string;
  category: string;
  notes: string;
  due_date: string | null;
  due_km: number | null;
  warning_days: number;
  warning_km: number;
  completed_at: string | null;
  created_at: string;
}

export interface VehicleExpense {
  id: string;
  bike_id: string | null;
  vehicle_ref: string;
  vehicle_label: string;
  date: string;
  category: string;
  description: string;
  amount_cents: number;
  notes: string;
  created_at: string;
}
