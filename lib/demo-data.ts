import { Bike, MaintenanceLog } from './supabase/types';

export const FALLBACK_BIKE: Bike = {
  id: 'b1a2c3d4-0000-0000-0000-000000000001',
  name: 'Yamaha MT-07',
  model: 'MT-07 Pure',
  year: 2022,
  current_km_hours: 14500,
  created_at: new Date().toISOString()
};

export const FALLBACK_LOGS: MaintenanceLog[] = [
  {
    id: 'm1-0001',
    bike_id: 'b1a2c3d4-0000-0000-0000-000000000001',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    km_hours: 10000,
    category: 'Tagliando',
    description: 'Tagliando 10.000 km: cambio olio Motul 7100 10W40, filtro olio originale Yamaha, controllo candele e serraggio bulloneria.',
    cost: 145.00,
    image_url: null,
    next_due_km_hours: 15000,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'm1-0002',
    bike_id: 'b1a2c3d4-0000-0000-0000-000000000001',
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    km_hours: 12300,
    category: 'Gomme',
    description: 'Sostituzione treno gomme con Pirelli Diablo Rosso IV. Pressione pneumatici ant 2.25 bar, post 2.50 bar.',
    cost: 290.00,
    image_url: null,
    next_due_km_hours: 22000,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'm1-0003',
    bike_id: 'b1a2c3d4-0000-0000-0000-000000000001',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    km_hours: 14200,
    category: 'Trasmissione/Catena',
    description: 'Lavaggio profondo catena con petrolio bianco, asciugatura, ingrassaggio spray Motorex e regolazione gioco a 30 mm.',
    cost: 25.00,
    image_url: null,
    next_due_km_hours: 15200,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];
