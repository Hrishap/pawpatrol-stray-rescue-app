import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export function useProfile(id: string | null | undefined) {
  return useQuery({
    queryKey: ['profile', id],
    enabled: !!id,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useVolunteers() {
  return useQuery({
    queryKey: ['profiles', 'volunteer'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'volunteer');
      if (error) throw error;
      return data;
    },
  });
}
