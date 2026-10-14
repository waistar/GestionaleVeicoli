import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync(new URL('../lib/annual-costs.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loadedModule = { exports: {} };
new Function('require', 'module', 'exports', code)(() => ({}), loadedModule, loadedModule.exports);
const { maintenanceCostCents, summarizeAnnualVehicleCosts } = loadedModule.exports;

test('somma spese ricorrenti e interventi straordinari dello stesso anno', () => {
  const reminders = [
    { due_date: '2026-05-01', amount_cents: 35000 },
    { due_date: '2027-05-01', amount_cents: 99900 },
    { due_date: '2026-06-01', amount_cents: null },
  ];
  const logs = [
    { date: '2026-02-01', cost: '125.50' },
    { date: '2026-03-01', cost: 0 },
    { date: '2025-03-01', cost: 800 },
  ];
  const result = summarizeAnnualVehicleCosts(2026, reminders, logs);
  assert.deepEqual(result, {
    year: 2026,
    recurringCents: 35000,
    extraordinaryCents: 12550,
    totalCents: 47550,
    recurringCount: 1,
    extraordinaryCount: 1,
  });
});

test('converte i costi decimali in centesimi senza errori di virgola mobile', () => {
  assert.equal(maintenanceCostCents('12.34'), 1234);
  assert.equal(maintenanceCostCents('12,3'), 1230);
  assert.equal(maintenanceCostCents(null), 0);
  assert.throws(() => maintenanceCostCents('-1'));
  assert.throws(() => maintenanceCostCents('non valido'));
});
