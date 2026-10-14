-- Archivio PDF per assicurazioni, libretti, revisioni e interventi.
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id UUID NOT NULL REFERENCES public.bikes(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 150),
    category TEXT NOT NULL CHECK (category IN ('Assicurazione', 'Libretto', 'Intervento', 'Revisione', 'Bollo', 'Altro')),
    document_date DATE,
    file_name TEXT NOT NULL CHECK (length(trim(file_name)) BETWEEN 1 AND 255),
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf' CHECK (mime_type = 'application/pdf'),
    size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 20971520),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.archive_members (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_bike_date ON public.vehicle_documents(bike_id, document_date DESC);
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own archive membership" ON public.archive_members;
CREATE POLICY "Read own archive membership" ON public.archive_members FOR SELECT TO authenticated
    USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Garage access to vehicle_documents" ON public.vehicle_documents;
CREATE POLICY "Garage access to vehicle_documents" ON public.vehicle_documents
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.archive_members WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.archive_members WHERE user_id = auth.uid()));
REVOKE ALL ON public.vehicle_documents, public.archive_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_documents TO authenticated;
GRANT SELECT ON public.archive_members TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vehicle-documents', 'vehicle-documents', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 20971520, allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "Read vehicle documents" ON storage.objects;
CREATE POLICY "Read vehicle documents" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'vehicle-documents' AND EXISTS (SELECT 1 FROM public.archive_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Upload vehicle documents" ON storage.objects;
CREATE POLICY "Upload vehicle documents" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'vehicle-documents' AND EXISTS (SELECT 1 FROM public.archive_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Delete vehicle documents" ON storage.objects;
CREATE POLICY "Delete vehicle documents" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'vehicle-documents' AND EXISTS (SELECT 1 FROM public.archive_members WHERE user_id = auth.uid()));
