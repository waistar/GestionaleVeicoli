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
const { documentMetadataSchema, formatFileSize, MAX_DOCUMENT_SIZE } = load('lib/documents.ts');
const bikeId = 'b1000000-0000-4000-8000-000000000001';
const valid = {
  bike_id: bikeId, title: 'Polizza RCA 2027', category: 'Assicurazione', document_date: '2027-01-10',
  file_name: 'polizza.pdf', storage_path: `${bikeId}/d1000000-0000-4000-8000-000000000001.pdf`,
  mime_type: 'application/pdf', size_bytes: '1024', notes: '',
};

test('i metadati PDF validi conservano veicolo, categoria e percorso isolato', () => {
  const parsed = documentMetadataSchema.parse(valid);
  assert.equal(parsed.size_bytes, 1024);
  assert.equal(parsed.bike_id, bikeId);
});

test('l’archivio rifiuta percorsi di altri veicoli, formati e dimensioni non validi', () => {
  for (const patch of [
    { bike_id: 'non-uuid' }, { category: 'Contratto' }, { document_date: '2026-02-30' },
    { mime_type: 'image/jpeg' }, { size_bytes: '0' }, { size_bytes: String(MAX_DOCUMENT_SIZE + 1) },
    { storage_path: 'altro/documento.pdf' }, { storage_path: `${bikeId}/documento.exe` },
  ]) assert.equal(documentMetadataSchema.safeParse({ ...valid, ...patch }).success, false);
});

test('la dimensione dei documenti viene mostrata in KB o MB', () => {
  assert.equal(formatFileSize(1024), '1 KB');
  assert.match(formatFileSize(2 * 1024 * 1024), /^2 MB$/);
});

test('le policy dell’archivio non concedono accesso anonimo ai PDF', () => {
  const migration = fs.readFileSync(new URL('../supabase/migrations/20261014_vehicle_documents.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(migration, /vehicle_documents[\s\S]{0,300}TO anon/);
  assert.match(migration, /archive_members/);
  assert.match(migration, /storage\.objects FOR SELECT TO authenticated/);
  assert.match(migration, /REVOKE ALL ON public\.vehicle_documents, public\.archive_members FROM anon/);
});
