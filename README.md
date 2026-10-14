# GestionaleVeicoli — gestionale interno veicoli

Applicazione Next.js per **moto, auto, furgoni e scooter**, centrata sullo scadenzario del parco veicoli. Assicurazioni, bollo, revisione, documenti e manutenzioni si configurano per data o chilometraggio. Lo storico tecnico e il registro spese restano funzioni di supporto.

## Avvio locale

Richiede Node.js 22 e npm.

```sh
npm ci
npm run dev
```

Apri http://localhost:3000. Il parco veicoli parte vuoto. Non vengono creati o mostrati veicoli, interventi o scadenze dimostrativi. Il salvataggio richiede il collegamento a Supabase.

## Database

Il progetto Supabase scelto è **gestionale veicoli**, separato da motocrossgestionale. Copia `.env.example` in `.env.local` e configura il suo Project URL e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Per i progetti meno recenti resta supportata anche `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Il file `.env.local` è escluso da Git. Dopo aver creato le tabelle, esegui `npm run db:check`: verifica in sola lettura le quattro tabelle, le colonne richieste e la funzione di completamento. Riavvia il server di sviluppo dopo aver aggiornato le variabili.

- Database nuovo: esegui `supabase/schema.sql` nell'SQL Editor di Supabase.
- Database esistente: esegui **`supabase/migrations/20261014_fleet_reminders.sql`**, **`supabase/migrations/20261014_vehicle_expenses.sql`** e **`supabase/migrations/20261014_vehicle_documents.sql`**. Le migrazioni sono additive e ripetibili.
- La tabella `bikes` e i nomi delle Server Actions restano compatibili con la versione precedente. Le vecchie moto sono riconosciute come moto, gli scooter come scooter. È possibile eliminare anche l’ultimo veicolo; un archivio vuoto resta vuoto.
- La tabella `vehicle_reminders` conserva scadenze aperte e completate. La funzione SQL `complete_vehicle_reminder` completa la voce e inserisce un intervento con un'unica transazione, impedendo doppie registrazioni.
- I dati gestionali mantengono il modello di accesso RLS preesistente. L’Archivio PDF richiede invece un utente Supabase autenticato e presente in `archive_members`.

## Uso

1. In **Parco veicoli**, aggiungi tipo, marca/nome, modello, targa, anno e chilometri, quindi configura le scadenze disponibili. Le date sono quelle effettive dei documenti.
2. In **Scadenzario**, consulta tutti i veicoli, aggiungi ulteriori adempimenti oppure filtra per veicolo, stato e ricerca.
3. Dal **catalogo** pianifica Bollo, Assicurazione RCA, Revisione, Abbonamento parcheggio / sosta blu, Tagliando, Cambio olio e Cambio gomme.
4. Inserisci **data**, **chilometraggio** o entrambi e, se utile, il relativo **importo in euro**. Con entrambe le soglie configurate, prevale la prima raggiunta. L'avviso predefinito è di 30 giorni / 500 km, modificabile per ogni voce.
5. Usa **Segna completata** per archiviare l'attività nello storico. In fondo allo scadenzario, apri le completate e scegli **Rinnova** per inserire una nuova scadenza effettiva.
6. Nel registro interventi puoi continuare a impostare un prossimo chilometraggio per categoria. Il promemoria usa il più recente intervento del veicolo; un nuovo intervento senza soglia rimuove il vecchio target.
7. In **Archivio** accedi con un account Supabase autorizzato e carica assicurazioni, libretti, revisioni e documenti degli interventi in PDF (massimo 20 MB). I file restano nel bucket privato e vengono scaricati tramite link temporanei.

Le date di bollo, polizze, revisione e controlli dipendono dal veicolo e dai documenti: **non vengono dedotte automaticamente da regole normative**. Gli intervalli tecnici si impostano secondo il piano del costruttore. Le voci del catalogo non configurate sono indicate come **Da valutare**, mai come in regola. Gli avvisi sono mostrati nell'app; non sono inviate notifiche push o email. Il giorno corrente usa il fuso Europe/Rome; una scadenza alla data odierna è segnalata come “Scade oggi”.

## Verifiche

```sh
npm test
npm run lint
npm run build
```

I test coprono scadenze per data/km, prima soglia raggiunta, soglie personalizzate, separazione dei veicoli, completamento, calendario, compatibilità e validazione degli input.

## Spese

La pagina `/spese` è raggiungibile dal menu desktop e dalla barra mobile. Ogni registrazione contiene veicolo, data, categoria, descrizione, importo in euro e note. Puoi inserire, modificare ed eliminare le spese. Il registro resta inizialmente vuoto.

Il **totale complessivo** riguarda tutto l’archivio; il **totale selezione**, le suddivisioni per veicolo/categoria e il registro seguono i filtri di periodo, veicolo, categoria e ricerca. Gli importi sono salvati come centesimi interi per evitare errori di somma. Inserisci fino a due decimali con virgola o punto, senza separatori delle migliaia.

Le spese restano archiviate dopo la rimozione del veicolo e sono raggruppate con il suo identificativo originale. La tabella legacy `maintenance_logs.cost` non viene conteggiata: i totali usano esclusivamente il nuovo registro. Per attivare salvataggio e consultazione online, applica la migrazione `supabase/migrations/20261014_vehicle_expenses.sql` al database configurato.

## Accesso all’Archivio PDF

1. Applica `supabase/migrations/20261014_vehicle_documents.sql` nell’SQL Editor.
2. In Supabase, apri **Authentication → Users** e crea l’utente con email e password.
3. Autorizza l’utente dall’SQL Editor, sostituendo l’indirizzo:

```sql
INSERT INTO public.archive_members (user_id)
SELECT id FROM auth.users WHERE email = 'email@esempio.it'
ON CONFLICT (user_id) DO NOTHING;
```

La pagina `/documenti` non permette registrazioni pubbliche. Tabella e bucket privato accettano operazioni solo dagli utenti autorizzati. Prima di eliminare un veicolo bisogna rimuovere i relativi documenti, evitando PDF orfani nello storage.
