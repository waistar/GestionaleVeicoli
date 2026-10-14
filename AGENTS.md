# AGENTS.md — GestionaleVeicoli (Motorbike Management System)

## 1. Descrizione Architettura e Stack Tecnologico
Applicazione web mobile-first installabile come **Progressive Web App (PWA)**, progettata per la gestione interna del parco veicoli (moto, auto, furgoni e scooter), del registro tecnico degli interventi e delle scadenze di manutenzione. La pagina `/spese` registra importi in centesimi e presenta totali per veicolo, categoria e periodo. La colonna legacy `maintenance_logs.cost` resta per compatibilità; non alimenta il nuovo registro spese.

- **Framework**: Next.js 15+ (App Router, Server Components e Server Actions, TypeScript).
- **Styling & UI**: Tailwind CSS v4, shadcn/ui (radix/base), Lucide React.
- **Database & Storage**: Supabase (PostgreSQL relazionale per moto e interventi + Supabase Storage bucket `receipts` per ricevute e foto).
- **PWA & Mobile**: Configurazione standalone con `manifest.json`, Web App meta tag iOS/Android e viewport anti-zoom per l'uso immediato da smartphone con guanti da garage.
- **Validazione**: React Hook Form, Zod.
- **Client Supabase**: `@supabase/ssr` e `@supabase/supabase-js`.

---

## 2. Struttura Cartelle Principale
```
motorbike-management-sys/
├── app/
│   ├── layout.tsx               # Root layout con meta tag PWA, viewport anti-zoom e font Inter / JetBrains Mono
│   ├── page.tsx                 # Dashboard principale (Km, Scadenze da gestire, Interventi registrati)
│   ├── manifest.ts              # Web App Manifest dinamico per installazione PWA
│   ├── actions/
│   │   ├── bikes.ts             # Server Actions per moto e aggiornamento contachilometri
│   │   └── maintenance.ts       # Server Actions per caricamento log, upload foto su bucket receipts, eliminazione
│   ├── interventi/
│   │   ├── page.tsx             # Storico interventi con ricerca e filtri per categoria
│   │   └── nuovo/page.tsx       # Form touch-friendly registrazione intervento
│   ├── promemoria/page.tsx      # Schermata Scadenze & Promemoria (Verde / Giallo / Rosso)
│   └── api/schema-sql/route.ts  # Endpoint per copia rapida dello schema SQL
├── components/
│   ├── ui/                      # Componenti shadcn/ui (button, card, dialog, input, badge, textarea, select)
│   ├── layout/                  # Header garage e BottomNav fissa mobile con safe-area iOS
│   ├── dashboard/               # StatCards, AlertBanner e RecentInterventions
│   ├── maintenance/             # MaintenanceForm, MaintenanceList e MaintenanceDetailDialog (foto zoomabile)
│   ├── reminders/               # RemindersList con indicatori di stato visivi e progress bar
│   └── setup/                   # Banner informativo configurazione Supabase
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client Supabase browser (createBrowserClient)
│   │   ├── server.ts            # Client Supabase server-side (createServerClient)
│   │   └── types.ts             # Interfacce TypeScript (Bike, MaintenanceLog, Categorie, Promemoria)
│   ├── reminders.ts             # Calcolo logico delle scadenze, statistiche e formattazione km
│   ├── demo-data.ts             # Collezioni vuote: nessun dato dimostrativo
│   └── utils.ts                 # Utility di classe (cn) per Tailwind
├── public/
│   ├── manifest.json            # Manifest statico PWA
│   └── icons/                   # Icone PWA (icon.svg, 192x192, 512x512, apple-touch-icon)
├── supabase/
│   └── schema.sql               # Definizione DDL tabelle bikes, maintenance_logs, trigger km, bucket receipts e RLS
├── .env.example                 # Template chiavi ambiente
├── .env.local                   # Configurazione locale Supabase (URL e Anon Key)
└── AGENTS.md                    # File di riferimento per agenti e manutenzione AI
```

---

## 3. Comandi Essenziali da Terminale
| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo Next.js locale (default http://localhost:3000) |
| `npm run build` | Esegue il type check TypeScript e compila la build di produzione Next.js |
| `npm run lint` | Esegue ESLint per verificare aderenza alle regole del codice |

---

## 4. Regole per gli Agenti AI
Nelle sessioni future di manutenzione o estensione del codice, ogni agente DEVE seguire scrupolosamente queste tre regole:
1. **Eseguire sempre `npm run build` prima di completare qualsiasi modifica**: verificare tassativamente che non vi siano errori di tipo TypeScript, di import o di compilazione Next.js.
2. **Non modificare lo schema del database senza aggiornare `/supabase/schema.sql`**: qualsiasi nuova colonna, tabella o policy RLS deve essere riflessa immediatamente nello script SQL di riferimento.
3. **Mantenere l'UI rigorosamente mobile-first**: progettare ogni elemento per l'utilizzo da smartphone in ambiente garage (pulsanti touch ampi, contrasto elevato, font minimo 16px per evitare zoom iOS, safe area padding per iPhone).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Scadenzario multiveicolo
- `bikes.vehicle_type` e `plate` identificano tipo e targa senza rinominare le tabelle legacy.
- `lib/vehicle-catalog.ts` definisce il catalogo estendibile. Non fissare date normative automatiche: l’operatore inserisce le date effettive.
- `vehicle_reminders` contiene soglie per data/km e avvisi personalizzati; la prima soglia raggiunta determina lo stato. Le voci non configurate non sono in regola.
- La migrazione additiva per installazioni esistenti è `supabase/migrations/20261014_fleet_reminders.sql`; mantenerla allineata alla sezione 8 di `schema.sql`.
- Il completamento usa una funzione SQL atomica. Le spese si registrano separatamente nel registro dedicato. `npm test` verifica la logica delle scadenze.

## Archivio iniziale vuoto
Non creare veicoli, interventi o scadenze di esempio durante le letture o la configurazione SQL. `getActiveBike` restituisce `null` se l’archivio è vuoto e le pagine mostrano `EmptyGarage`. È consentita l’eliminazione dell’ultimo veicolo.

## Registro spese
- La pagina `/spese` deriva automaticamente tutte le voci dalle scadenze con `amount_cents` e dagli interventi straordinari con `maintenance_logs.cost`; non offre inserimenti manuali separati.
- Lo Storico contiene esclusivamente interventi straordinari non ricorrenti: il costo è obbligatorio e `next_due_km_hours` resta nullo. Le manutenzioni pianificate appartengono allo scadenzario.
- I totali annuali, sia del singolo veicolo sia dell’intera flotta, sommano ricorrenti e straordinarie senza duplicazioni.
- `lib/annual-costs.ts` calcola i totali annuali in centesimi e `lib/automatic-expenses.ts` costruisce il registro consultabile. Non aggiungere dati dimostrativi.

## Registrazione veicoli
I moduli di aggiunta e modifica sono comuni al parco veicoli e non espongono sottocategorie moto. Il tipo predefinito per un nuovo veicolo è Auto. La colonna legacy `category` resta compatibile con i dati esistenti e non viene riscritta durante la modifica dell’anagrafica.

La registrazione è centrata sulle scadenze: può creare insieme al veicolo Bollo, Assicurazione RCA, Revisione, Abbonamento parcheggio / sosta blu, Tagliando e Cambio gomme. Le date derivano dai documenti inseriti dall’operatore e non vengono calcolate automaticamente. Se il salvataggio delle scadenze iniziali fallisce, la creazione del veicolo viene annullata.

## Priorità dell'interfaccia
Lo scadenzario è il contenuto principale di dashboard e navigazione. Lo storico interventi resta disponibile come funzione secondaria e non deve tornare a essere la call to action principale.
