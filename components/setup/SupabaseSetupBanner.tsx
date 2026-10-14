'use client'

import React, { useState } from 'react';
import { Database, Copy, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SupabaseSetupBannerProps {
  isFallback: boolean;
}

export function SupabaseSetupBanner({ isFallback }: SupabaseSetupBannerProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copyError, setCopyError] = useState('');
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/)?.[1];
  const sqlEditorUrl = projectRef ? `https://supabase.com/dashboard/project/${projectRef}/sql/new` : 'https://supabase.com/dashboard';

  if (!isFallback) return null;

  const handleCopy = async () => {
    try {
      setCopyError('');
      const res = await fetch('/api/schema-sql');
      if (!res.ok) throw new Error('Schema non disponibile');
      const sqlText = await res.text();
      await navigator.clipboard.writeText(sqlText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
      setCopyError('Copia non riuscita. Apri il file supabase/schema.sql del progetto.');
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-50/20 p-3.5 mb-3 text-xs text-amber-700">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-amber-700">Collegamento al database da completare</h4>
            <p className="text-[11px] text-zinc-600">Configura il progetto Supabase e le tabelle per salvare veicoli, interventi, scadenze e spese.</p>
          </div>
        </div>
        <button className="text-zinc-600 p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2.5">
          <p className="text-[11px] text-zinc-700 leading-relaxed">
            I file SQL e le policy RLS sono pronti nel file <code className="text-amber-700 bg-zinc-50 px-1 py-0.5 rounded font-mono">/supabase/schema.sql</code>.
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleCopy}
              className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs h-8 px-3"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'SQL Copiato!' : 'Copia Schema SQL'}
            </Button>

            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-700 font-semibold px-2 py-1"
            >
              Apri SQL Editor <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {copyError && <p role="alert" className="text-xs text-rose-700">{copyError}</p>}
        </div>
      )}
    </div>
  );
}
