import React, { createContext, useContext, useState } from 'react';

import { KOCHI_CENTER } from '@/hooks/useCases';
import type { CaseSpecies, CaseUrgency } from '@/types/database';

export interface ReportDraft {
  photoUri: string | null;
  species: CaseSpecies;
  breed: string;
  tags: string[];
  note: string;
  urgency: CaseUrgency | null;
  lat: number;
  lng: number;
  address: string | null;
}

const INITIAL_DRAFT: ReportDraft = {
  photoUri: null,
  species: 'Dog',
  breed: '',
  tags: [],
  note: '',
  urgency: null,
  lat: KOCHI_CENTER.lat,
  lng: KOCHI_CENTER.lng,
  address: null,
};

interface ReportDraftState {
  draft: ReportDraft;
  update: (patch: Partial<ReportDraft>) => void;
  toggleTag: (tag: string) => void;
  reset: () => void;
}

const ReportDraftContext = createContext<ReportDraftState | undefined>(undefined);

export function ReportDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft>(INITIAL_DRAFT);

  const update = (patch: Partial<ReportDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleTag = (tag: string) =>
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag) ? d.tags.filter((t) => t !== tag) : [...d.tags, tag],
    }));
  const reset = () => setDraft(INITIAL_DRAFT);

  return (
    <ReportDraftContext.Provider value={{ draft, update, toggleTag, reset }}>
      {children}
    </ReportDraftContext.Provider>
  );
}

export function useReportDraft() {
  const ctx = useContext(ReportDraftContext);
  if (!ctx) throw new Error('useReportDraft must be used within ReportDraftProvider');
  return ctx;
}

export const TAG_POOL = [
  'Limping',
  'Visible wound',
  'Skin disease',
  'Malnourished',
  'Roadkill risk',
  'Hit by vehicle',
  'Scared/aggressive',
];
