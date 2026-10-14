import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const loadedModule = {exports:{}};
  const localRequire = id => id.startsWith('.') ? load(path.posix.normalize(path.posix.join(path.posix.dirname(file), id)) + '.ts') : require(id);
  new Function('require','module','exports',code)(localRequire,loadedModule,loadedModule.exports);
  return loadedModule.exports;
}
const {calculateReminders, daysBetween, reminderRemaining} = load('lib/reminders.ts');
const {reminderSchema} = load('lib/reminder-schema.ts');
const {catalogFor, vehicleType} = load('lib/vehicle-catalog.ts');
const {parseInitialDeadlines} = load('lib/initial-deadlines.ts');
const bike = {id:'b1',name:'Veicolo',model:'Test',current_km_hours:10000};
const row = (fields={}) => ({id:'r1',bike_id:'b1',title:'RCA',category:'Assicurazione RCA',notes:'',due_date:'2026-11-01',due_km:null,warning_days:30,warning_km:500,completed_at:null,created_at:'2026-01-01',...fields});
const calc = fields => calculateReminders(bike,[],[row(fields)],'2026-10-14')[0];
test('data scaduta, oggi, entro avviso e lontana',()=>{
 assert.equal(calc({due_date:'2026-10-13'}).status,'expired');
 assert.equal(calc({due_date:'2026-10-14'}).status,'warning');
 assert.match(reminderRemaining(calc({due_date:'2026-10-14'})),/Scade oggi/);
 assert.equal(calc({due_date:'2026-11-13'}).status,'warning');
 assert.equal(calc({due_date:'2026-11-14'}).status,'ok');
});
test('soglia km esatta, avviso personalizzato e prima scadenza raggiunta',()=>{
 assert.equal(calc({due_date:null,due_km:10000}).status,'expired');
 assert.equal(calc({due_date:null,due_km:10500}).status,'warning');
 assert.equal(calc({due_date:null,due_km:10501}).status,'ok');
 assert.equal(calc({due_date:'2027-01-01',due_km:9900}).status,'expired');
 assert.equal(calc({due_date:'2026-10-13',due_km:50000}).status,'expired');
 assert.equal(calc({due_date:'2026-11-01',warning_days:7}).status,'ok');
});
test('isola veicoli ed esclude completate',()=>{
 assert.equal(calculateReminders(bike,[],[row({bike_id:'other'}),row({completed_at:'2026-10-01'})],'2026-10-14').length,0);
});
test('giorni di calendario indipendenti da cambio ora e anni bisestili',()=>{
 assert.equal(daysBetween('2026-10-24','2026-10-26'),2);
 assert.equal(daysBetween('2028-02-28','2028-03-01'),2);
});
test('lo storico più recente sostituisce la soglia precedente senza contaminare altri veicoli',()=>{
 const old={id:'old',bike_id:'b1',category:'Tagliando',date:'2026-01-01',created_at:'2026-01-01',km_hours:5000,next_due_km_hours:9000,description:''};
 const newer={...old,id:'new',date:'2026-10-01',next_due_km_hours:15000};
 assert.equal(calculateReminders(bike,[old,newer])[0].nextDueKm,15000);
 assert.equal(calculateReminders(bike,[old,{...newer,next_due_km_hours:null}]).length,0);
 assert.equal(calculateReminders(bike,[{...old,bike_id:'other'}]).length,0);
});
test('più scadenze della stessa categoria rimangono indipendenti',()=>{
 const reminders=calculateReminders(bike,[],[row(),row({id:'r2',due_date:'2026-10-01'})],'2026-10-14');
 assert.equal(reminders.length,2);assert.equal(reminders[0].status,'expired');
});
test('catalogo per tipo e compatibilità con i vecchi scooter',()=>{
 const expected = ['Bollo','Assicurazione RCA','Revisione','Abbonamento parcheggio / sosta blu','Tagliando','Cambio olio','Cambio gomme'];
 for(const type of ['moto','auto','furgone','scooter']) assert.deepEqual(catalogFor(type).map(c=>c.label), expected);
 assert.equal(vehicleType({category:'scooter'}),'scooter');
});
test('validazione date reali, valori numerici e almeno una soglia',()=>{
 const valid={bike_id:'b1a2c3d4-0000-4000-8000-000000000001',title:'Tagliando',category:'Tagliando',notes:'',due_date:'2026-12-31',due_km:'',warning_days:'30',warning_km:'500',amount_cents:'1234,56'};
 const parsed=reminderSchema.safeParse(valid);
 assert.equal(parsed.success,true);
 assert.equal(parsed.data.amount_cents,123456);
 for(const patch of [{due_date:'2026-02-30'},{due_date:'',due_km:''},{due_km:'NaN'},{due_km:'-1'},{warning_days:'-1'},{title:' '},{bike_id:'invalid'},{amount_cents:'0'},{amount_cents:'non valido'}]) assert.equal(reminderSchema.safeParse({...valid,...patch}).success,false);
 assert.equal(reminderSchema.safeParse({...valid,due_date:'',due_km:'0'}).success,true);
});

test('bollo, assicurazione e revisione usano esclusivamente la data',()=>{
 for (const category of ['Bollo','Assicurazione RCA','Revisione']) {
   const input={bike_id:'b1a2c3d4-0000-4000-8000-000000000001',title:category,category,notes:'',due_date:'2027-01-01',due_km:'25000',warning_days:'30',warning_km:'500'};
   const parsed=reminderSchema.safeParse(input);
   assert.equal(parsed.success,true);
   assert.equal(parsed.data.due_km,null);
   assert.equal(parsed.data.warning_km,0);
   assert.equal(reminderSchema.safeParse({...input,due_date:''}).success,false);
 }
});

test('la registrazione del veicolo prepara tutte le scadenze del catalogo',()=>{
  const parsed = parseInitialDeadlines({
    insurance_due_date:'2027-01-15', road_tax_due_date:'2026-12-31', inspection_due_date:'2028-04-10',
    service_due_date:'2027-02-01', service_due_km:'25000', oil_change_due_km:'20000', parking_subscription_due_date:'2027-06-30', road_tax_amount:'320,50',
    tyre_change_due_date:'2026-11-15', deadline_warning_days:'45',
  }, 'vehicle-id');
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.reminders.map(item=>item.category), ['Bollo','Assicurazione RCA','Revisione','Tagliando','Cambio olio','Abbonamento parcheggio / sosta blu','Cambio gomme']);
  assert.equal(parsed.reminders[3].due_km, 25000);
  assert.equal(parsed.reminders[0].amount_cents, 32050);
  assert.ok(parsed.reminders.every(item=>item.warning_days === 45 && item.bike_id === 'vehicle-id'));
});

test('le scadenze iniziali vuote sono facoltative ma i valori parziali o non validi sono respinti',()=>{
  assert.deepEqual(parseInitialDeadlines({}, 'vehicle-id'), {success:true, reminders:[]});
  for (const values of [
    {insurance_due_date:'2026-02-30'}, {service_due_km:'-1'}, {deadline_warning_days:'366'},
    {parking_subscription_due_date:'2026-02-30'}, {tyre_change_due_date:'data-non-valida'},
    {road_tax_due_date:'2027-01-01',road_tax_amount:'0'}, {insurance_amount:'450,00'},
  ]) assert.equal(parseInitialDeadlines(values, 'vehicle-id').success, false);
});

test('la creazione del veicolo salva nello stesso flusso le scadenze compilate', async () => {
  const source = fs.readFileSync(new URL('../app/actions/bikes.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const vehicleId = 'b1a2c3d4-0000-4000-8000-000000000099';
  let insertedBike;
  let insertedReminders;
  const db = {
    from(table) {
      if (table === 'bikes') return {
        insert(payload) { insertedBike = payload; return {select() { return {single: async()=>({data:{id:vehicleId,created_at:'2026-10-14',...payload},error:null})}; }}; },
        delete() { return {eq:async()=>({error:null})}; },
      };
      if (table === 'vehicle_reminders') return { insert: async payload => { insertedReminders = payload; return {error:null}; } };
      throw Error(`Tabella inattesa: ${table}`);
    },
  };
  const mocks = {
    '@/lib/vehicle-catalog': load('lib/vehicle-catalog.ts'),
    '@/lib/initial-deadlines': load('lib/initial-deadlines.ts'),
    '@/lib/supabase/server': { createClient: async()=>db },
    'next/cache': { revalidatePath:()=>{} },
    'next/headers': { cookies:async()=>({set:()=>{}}) },
  };
  const loadedModule = {exports:{}};
  new Function('require','module','exports',code)(id => mocks[id] || require(id),loadedModule,loadedModule.exports);
  const form = new FormData();
  for (const [key,value] of Object.entries({vehicle_type:'auto',plate:'AB123CD',name:'Fiat',model:'Panda',current_km_hours:'12000',insurance_due_date:'2027-01-15',road_tax_due_date:'2026-12-31',inspection_due_date:'2028-04-10',service_due_km:'25000',deadline_warning_days:'30'})) form.set(key,value);
  const result = await loadedModule.exports.createBike(form);
  assert.equal(result.success,true);
  assert.equal(insertedBike.vehicle_type,'auto');
  assert.deepEqual(insertedReminders.map(item=>item.category),['Bollo','Assicurazione RCA','Revisione','Tagliando']);
  assert.ok(insertedReminders.every(item=>item.bike_id===vehicleId));
});

test('un archivio vuoto resta vuoto senza creare veicoli di esempio', async () => {
  const fixtures = load('lib/demo-data.ts');
  assert.deepEqual(fixtures.FALLBACK_GARAGE_BIKES, []);
  assert.deepEqual(fixtures.FALLBACK_LOGS, []);
  assert.deepEqual(fixtures.FALLBACK_REMINDERS, []);
  const source = fs.readFileSync(new URL('../app/actions/bikes.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  let inserts = 0;
  const query = { select() { return this; }, async order() { return {data:[],error:null}; }, insert() { inserts++; throw Error('Inserimento inatteso'); } };
  const mocks = {
    '@/lib/vehicle-catalog': load('lib/vehicle-catalog.ts'),
    '@/lib/initial-deadlines': load('lib/initial-deadlines.ts'),
    '@/lib/supabase/server': { createClient: async () => ({from:()=>query}) },
    'next/cache': { revalidatePath:()=>{} },
    'next/headers': { cookies:async()=>({get:()=>({value:'vecchio-id-cancellato'})}) },
  };
  const loadedModule = {exports:{}};
  new Function('require','module','exports',code)(id => mocks[id] || require(id),loadedModule,loadedModule.exports);
  assert.deepEqual((await loadedModule.exports.getAllBikes()).bikes,[]);
  const active = await loadedModule.exports.getActiveBike();
  assert.equal(active.bike,null);
  assert.equal(active.isFallback,false);
  assert.equal(inserts,0);
});
