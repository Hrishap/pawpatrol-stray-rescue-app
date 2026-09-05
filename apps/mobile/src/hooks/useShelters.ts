import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { AdoptableAnimal, Shelter } from '@/types/database';

export function useShelters() {
  return useQuery({
    queryKey: ['shelters'],
    queryFn: async (): Promise<Shelter[]> => {
      const { data, error } = await supabase.from('shelters').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useShelter(id: string | undefined) {
  return useQuery({
    queryKey: ['shelter', id],
    enabled: !!id,
    queryFn: async (): Promise<Shelter> => {
      const { data, error } = await supabase.from('shelters').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAdoptableAnimals() {
  return useQuery({
    queryKey: ['adoptable_animals'],
    queryFn: async (): Promise<AdoptableAnimal[]> => {
      const { data, error } = await supabase.from('adoptable_animals').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useAdoptableAnimal(id: string | undefined) {
  return useQuery({
    queryKey: ['adoptable_animal', id],
    enabled: !!id,
    queryFn: async (): Promise<AdoptableAnimal> => {
      const { data, error } = await supabase
        .from('adoptable_animals')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
