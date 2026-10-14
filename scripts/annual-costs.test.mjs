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

test('somma spese ricorrenti, interventi e altre spese dello stesso anno', () => {
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
  const expenses = [
    { date: '2026-04-01', amount_cents: 5000 },
    { date: '2025-04-01', amount_cents: 8000 },
  ];
  const result = summarizeAnnualVehicleCosts(2026, reminders, logs, expenses);
  assert.deepEqual(result, {
    year: 2026,
    recurringCents: 35000,
    interventionCents: 12550,
    otherExpenseCents: 5000,
    totalCents: 52550,
    recurringCount: 1,
    interventionCount: 1,
    otherExpenseCount: 1,
  });
});

test('converte i costi decimali in centesimi senza errori di virgola mobile', () => {
  assert.equal(maintenanceCostCents('12.34'), 1234);
  assert.equal(maintenanceCostCents('12,3'), 1230);
  assert.equal(maintenanceCostCents(null), 0);
  assert.throws(() => maintenanceCostCents('-1'));
  assert.throws(() => maintenanceCostCents('non valido'));
});
