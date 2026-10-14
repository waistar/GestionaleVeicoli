import fs from 'node:fs';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
if (!url || !key || url.includes('your-project-id') || key === 'your-anon-key') {
  console.error('Configurazione mancante: inserisci Project URL e chiave pubblica di «gestionale veicoli» in .env.local.');
  process.exit(1);
}
let base;
try {
  base = new URL(url);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw Error();
} catch { console.error('Project URL non valido: usa l’indirizzo HTTPS del progetto Supabase.'); process.exit(1); }
let secret = key.startsWith('sb_secret_');
try { secret ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'service_role'; } catch { /* Publishable keys are not JWTs. */ }
if (secret) { console.error('Usa una chiave pubblica Publishable/anon, non una chiave segreta.'); process.exit(1); }

const headers = { apikey: key };
if (!key.startsWith('sb_publishable_')) headers.Authorization = `Bearer ${key}`;
const tables = {
  bikes: 'id,name,model,year,current_km_hours,image_url,category,primary_color,accent_color,vehicle_type,plate,created_at',
  maintenance_logs: 'id,bike_id,date,km_hours,category,description,image_url,next_due_km_hours,created_at',
  vehicle_reminders: 'id,bike_id,title,category,notes,due_date,due_km,warning_days,warning_km,amount_cents,completed_at,created_at',
  vehicle_expenses: 'id,bike_id,vehicle_ref,vehicle_label,date,category,description,amount_cents,notes,created_at',
};
let failures = 0;
for (const [table, columns] of Object.entries(tables)) {
  try {
    const endpoint = new URL(`/rest/v1/${table}`, base);
    endpoint.searchParams.set('select', columns); endpoint.searchParams.set('limit', '0');
    const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(15000) });
    if (response.ok) { console.log(`OK ${table}: tabella e colonne raggiungibili.`); continue; }
    failures++;
    if ([401, 403].includes(response.status)) console.error(`ERRORE ${table}: chiave o permessi di accesso non validi.`);
    else console.error(`ERRORE ${table}: schema non disponibile (HTTP ${response.status}). Esegui supabase/schema.sql nel progetto selezionato.`);
  } catch { failures++; console.error(`ERRORE ${table}: progetto non raggiungibile. Controlla rete e stato del progetto.`); }
}
try {
  // The OpenAPI description requires a secret key on current Supabase projects.
  // Probe the public RPC with a fresh UUID, which cannot match an existing reminder.
  const response = await fetch(new URL('/rest/v1/rpc/complete_vehicle_reminder', base), {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reminder_id: crypto.randomUUID(), performed_on: new Date().toISOString().slice(0, 10) }),
    signal: AbortSignal.timeout(15000),
  });
  const result = response.ok ? await response.json() : null;
  if (response.ok && result === false) console.log('OK complete_vehicle_reminder: funzione disponibile.');
  else { failures++; console.error(`Funzione complete_vehicle_reminder non verificata (HTTP ${response.status}): controlla schema e permessi.`); }
} catch { failures++; console.error('Impossibile verificare la funzione di completamento delle scadenze.'); }
console.log('Verifica conclusa: nessun record esistente scaricato o modificato.');
process.exitCode = failures ? 1 : 0;
