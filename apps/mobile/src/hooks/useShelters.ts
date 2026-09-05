import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { AdoptableAnimal, Shelter } from '@/types/database';

/** How far out to look for shelters and adoptable animals. */
export const NEARBY_RADIUS_KM = 50;

interface Coords {
  lat: number;
  lng: number;
}

// Distance filtering happens in Postgres (see the shelters_near /
// adoptable_animals_near migration) rather than by downloading every row and
// discarding most of it client-side. Results come back nearest-first.
export function useShelters(coords: Coords | undefined) {
  return useQuery({
    queryKey: ['shelters', coords?.lat, coords?.lng],
    enabled: !!coords,
    queryFn: async (): Promise<Shelter[]> => {
      const { data, error } = await supabase.rpc('shelters_near', {
        p_lat: coords!.lat,
        p_lng: coords!.lng,
        p_radius_km: NEARBY_RADIUS_KM,
      });
      if (error) throw error;
      return data ?? [];
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

export function useAdoptableAnimals(coords: Coords | undefined) {
  return useQuery({
    queryKey: ['adoptable_animals', coords?.lat, coords?.lng],
    enabled: !!coords,
    queryFn: async (): Promise<AdoptableAnimal[]> => {
      const { data, error } = await supabase.rpc('adoptable_animals_near', {
        p_lat: coords!.lat,
        p_lng: coords!.lng,
        p_radius_km: NEARBY_RADIUS_KM,
      });
      if (error) throw error;
      return data ?? [];
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
