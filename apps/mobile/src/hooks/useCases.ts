import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import type { Case, CaseStatusHistoryRow } from '@/types/database';

export const KOCHI_CENTER = { lat: 9.9312, lng: 76.2673 };

export function useCases() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cases'],
    queryFn: async (): Promise<Case[]> => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('cases-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cases'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useCase(caseId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['case', caseId],
    enabled: !!caseId,
    queryFn: async (): Promise<Case> => {
      const { data, error } = await supabase.from('cases').select('*').eq('id', caseId!).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!caseId) return;
    const channel = supabase
      .channel(`case-${caseId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases', filter: `id=eq.${caseId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['case', caseId] });
          queryClient.invalidateQueries({ queryKey: ['case-history', caseId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, queryClient]);

  return query;
}

export function useCaseHistory(caseId: string | undefined) {
  return useQuery({
    queryKey: ['case-history', caseId],
    enabled: !!caseId,
    queryFn: async (): Promise<CaseStatusHistoryRow[]> => {
      const { data, error } = await supabase
        .from('case_status_history')
        .select('*')
        .eq('case_id', caseId!)
        .order('changed_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export async function claimCase(caseId: string) {
  const { error } = await supabase.rpc('claim_case', { p_case_id: caseId });
  if (error) throw error;
}

export async function advanceCase(caseId: string) {
  const { error } = await supabase.rpc('advance_case', { p_case_id: caseId });
  if (error) throw error;
}

export async function verifyCase(caseId: string) {
  const { error } = await supabase.rpc('verify_case', { p_case_id: caseId });
  if (error) throw error;
}

export async function assignCase(caseId: string, volunteerId: string) {
  const { error } = await supabase.rpc('assign_case', {
    p_case_id: caseId,
    p_volunteer_id: volunteerId,
  });
  if (error) throw error;
}

export async function setCaseNgoNotes(caseId: string, notes: string) {
  const { error } = await supabase.rpc('set_case_ngo_notes', {
    p_case_id: caseId,
    p_notes: notes,
  });
  if (error) throw error;
}
