import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const loadedModule = {exports:{}};
  new Function('require','module','exports',code)(require,loadedModule,loadedModule.exports);
  return loadedModule.exports;
}
const {calculateReminders, daysBetween, reminderRemaining} = load('lib/reminders.ts');
const {reminderSchema} = load('lib/reminder-schema.ts');
const {catalogFor, vehicleType} = load('lib/vehicle-catalog.ts');
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
 for(const type of ['moto','auto','furgone','scooter']) for(const category of ['Bollo','Assicurazione RCA','Revisione','Tagliando']) assert.ok(catalogFor(type).some(c=>c.label===category));
 assert.ok(catalogFor('furgone').some(c=>c.label==='Cronotachigrafo'));
 assert.ok(!catalogFor('moto').some(c=>c.label==='Cronotachigrafo'));
 assert.equal(vehicleType({category:'scooter'}),'scooter');
});
test('validazione date reali, valori numerici e almeno una soglia',()=>{
 const valid={bike_id:'b1a2c3d4-0000-4000-8000-000000000001',title:'Bollo',category:'Bollo',notes:'',due_date:'2026-12-31',due_km:'',warning_days:'30',warning_km:'500'};
 assert.equal(reminderSchema.safeParse(valid).success,true);
 for(const patch of [{due_date:'2026-02-30'},{due_date:'',due_km:''},{due_km:'NaN'},{due_km:'-1'},{warning_days:'-1'},{title:' '},{bike_id:'invalid'}]) assert.equal(reminderSchema.safeParse({...valid,...patch}).success,false);
 assert.equal(reminderSchema.safeParse({...valid,due_date:'',due_km:'0'}).success,true);
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
