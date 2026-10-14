import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

function load(path, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loadedModule = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => mocks[name] || {}, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const annual = load('lib/annual-costs.ts');
const { buildAutomaticExpenses } = load('lib/automatic-expenses.ts', { './annual-costs': annual });

test('crea spese soltanto da scadenze con importo e interventi con costo', () => {
  const bikes = [{ id: 'v1', name: 'Fiat', model: 'Panda', plate: 'AA123AA' }];
  const reminders = [
    { id: 'r1', bike_id: 'v1', due_date: '2026-01-10', amount_cents: 30000, category: 'Assicurazione', title: 'RCA', notes: '' },
    { id: 'r2', bike_id: 'v1', due_date: '2026-02-10', amount_cents: null, category: 'Revisione', title: 'Revisione', notes: '' },
  ];
  const logs = [
    { id: 'l1', bike_id: 'v1', date: '2026-03-10', cost: '125.50', category: 'Meccanica', description: 'Riparazione' },
    { id: 'l2', bike_id: 'v1', date: '2026-04-10', cost: 0, category: 'Cambio olio', description: 'Controllo' },
  ];
  const result = buildAutomaticExpenses(bikes, reminders, logs);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map(row => [row.source, row.amountCents]), [['extraordinary', 12550], ['recurring', 30000]]);
});
