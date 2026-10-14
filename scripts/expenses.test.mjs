import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const loadedModule = {exports:{}};
  new Function('require','module','exports',code)(id => mocks[id] || require(id),loadedModule,loadedModule.exports);
  return loadedModule.exports;
}
const domain = load('lib/expenses.ts');
const { amountSchema, expenseSchema, filterExpenses, summarizeExpenses } = domain;
const id1 = 'b1000000-0000-4000-8000-000000000001';
const id2 = 'b1000000-0000-4000-8000-000000000002';
const bike = {id:id1,name:'Veicolo',model:'Uno',plate:'AA123AA'};
const expense = (overrides={}) => ({id:'e1',bike_id:id1,vehicle_ref:id1,vehicle_label:'Veicolo Uno',date:'2026-10-14',category:'Manutenzione',description:'Tagliando',notes:'',amount_cents:100,created_at:'2026-10-14',...overrides});
const filters = {vehicle:'all',category:'all',from:'',to:'',search:''};
const valid = {bike_id:id1,date:'2026-10-14',category:'Manutenzione',description:'Tagliando',notes:'',amount:'123,45'};
test('importi italiani e decimali convertiti in centesimi esatti',()=>{
 for(const [value,cents] of [['0,01',1],['0.10',10],['12,3',1230],['1234.56',123456],['9999999,99',999999999]]) assert.equal(amountSchema.parse(value),cents);
 for(const value of ['0','-1','1,234','1.000,00','1e3','NaN','Infinity','','10000000','€ 12']) assert.equal(amountSchema.safeParse(value).success,false,value);
});
test('date reali e campi obbligatori verificati sul server',()=>{
 assert.equal(expenseSchema.safeParse(valid).success,true);
 for(const patch of [{date:'2026-02-30'},{bike_id:'invalid'},{description:' '},{category:'non valida'},{amount:'12.345'}]) assert.equal(expenseSchema.safeParse({...valid,...patch}).success,false);
});
test('somme intere, suddivisioni coerenti e separazione veicoli omonimi',()=>{
 const rows=[expense({amount_cents:10}),expense({id:'e2',amount_cents:20}),expense({id:'e3',bike_id:null,vehicle_ref:id2,category:'Bollo e tasse',amount_cents:100})];
 const stats=summarizeExpenses(rows,[bike]);
 assert.equal(stats.total,130);assert.equal(stats.byVehicle.length,2);
 assert.equal(stats.byVehicle.find(v=>v.id===id2).removed,true);
 assert.equal(stats.byVehicle.reduce((sum,r)=>sum+r.cents,0),stats.total);
 assert.equal(stats.byCategory.reduce((sum,r)=>sum+r.cents,0),stats.total);
 assert.equal(stats.byVehicle.find(v=>v.id===id1).label,'Veicolo Uno · AA123AA');
 assert.equal(summarizeExpenses([],[]).total,0);
 assert.throws(()=>summarizeExpenses([expense({amount_cents:1.2})],[]));
});
test('filtri inclusivi per periodo, veicolo, categoria e ricerca',()=>{
 const rows=[expense(),expense({id:'e2',vehicle_ref:id2,date:'2026-10-15',category:'Carburante',description:'Rifornimento',notes:'Autostrada'})];
 assert.equal(filterExpenses(rows,{...filters,from:'2026-10-14',to:'2026-10-14'}).length,1);
 assert.equal(filterExpenses(rows,{...filters,vehicle:id2,category:'Carburante',search:'AUTOstrada'})[0].id,'e2');
 assert.equal(filterExpenses(rows,{...filters,from:'2026-11-01',to:'2026-10-01'}).length,0);
 assert.equal(filterExpenses(rows,{...filters,category:'Assicurazione'}).length,0);
});
test('modifiche ed eliminazioni cambiano tutti i totali senza duplicare righe',()=>{
 const rows=[expense(),expense({id:'e2',vehicle_ref:id2,amount_cents:200})];
 const edited=rows.map(r=>r.id==='e1'?{...r,amount_cents:150}:r);
 assert.equal(summarizeExpenses(edited,[]).total,350);
 assert.equal(summarizeExpenses(edited.filter(r=>r.id!=='e2'),[]).total,150);
});
test('la scrittura usa centesimi validati e riferimenti ricavati dal database',async()=>{
 let writes=0, payload;
 const db={from(table){return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:table==='bikes'?bike:null,error:null};},insert(data){payload=data;writes++;return this;},async single(){return {data:{id:'a1000000-0000-4000-8000-000000000001'},error:null};}};}};
 const actions=load('app/actions/expenses.ts',{'@/lib/expenses':domain,'@/lib/supabase/server':{createClient:async()=>db},'next/cache':{revalidatePath:()=>{}}});
 const data=new FormData();for(const [key,value] of Object.entries({...valid,amount_cents:'1',vehicle_label:'falso'}))data.set(key,value);
 assert.equal((await actions.saveExpense(data)).success,true);
 assert.equal(payload.amount_cents,12345);assert.equal(payload.vehicle_label,'Veicolo Uno · AA123AA');assert.equal(payload.vehicle_ref,id1);
 data.set('amount','-5');assert.equal((await actions.saveExpense(data)).success,false);assert.equal(writes,1);
});
test('un veicolo rimosso può essere aggiornato solo sulla propria spesa archiviata',async()=>{
 const old=expense({bike_id:null});let updates=0;
 const db={from(table){return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:table==='vehicle_expenses'?old:null,error:null};},update(){updates++;return this;},async single(){return {data:{id:old.id},error:null};}};}};
 const actions=load('app/actions/expenses.ts',{'@/lib/expenses':domain,'@/lib/supabase/server':{createClient:async()=>db},'next/cache':{revalidatePath:()=>{}}});
 const data=new FormData();for(const [key,value] of Object.entries({...valid,id:'a1000000-0000-4000-8000-000000000001'}))data.set(key,value);
 assert.equal((await actions.saveExpense(data)).success,true);
 data.set('bike_id',id2);assert.equal((await actions.saveExpense(data)).success,false);assert.equal(updates,1);
 data.delete('id');data.set('bike_id',id1);assert.equal((await actions.saveExpense(data)).success,false);
});
