import { z } from 'zod';

export const DOCUMENT_CATEGORIES = ['Assicurazione', 'Libretto', 'Intervento', 'Revisione', 'Bollo', 'Altro'] as const;
export const DOCUMENT_BUCKET = 'vehicle-documents';
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

const optionalDate = z.preprocess(value => value === '' || value == null ? null : value,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Data non valida.').nullable());

export const documentMetadataSchema = z.object({
  bike_id: z.string().uuid('Seleziona un veicolo.'),
  title: z.string().trim().min(1, 'Inserisci un titolo.').max(150),
  category: z.enum(DOCUMENT_CATEGORIES),
  document_date: optionalDate,
  file_name: z.string().trim().min(1).max(255),
  storage_path: z.string().trim().min(1).max(500),
  mime_type: z.literal('application/pdf'),
  size_bytes: z.coerce.number().int().min(1).max(MAX_DOCUMENT_SIZE),
  notes: z.string().trim().max(2000),
}).superRefine((value, context) => {
  const expectedPrefix = `${value.bike_id}/`;
  if (!value.storage_path.startsWith(expectedPrefix) || !/^[0-9a-f-]{36}\/[-0-9a-f]{36}\.pdf$/i.test(value.storage_path)) {
    context.addIssue({ code: 'custom', path: ['storage_path'], message: 'Percorso del documento non valido.' });
  }
});

export const formatFileSize = (bytes: number) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / (1024 * 1024)).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB`;
