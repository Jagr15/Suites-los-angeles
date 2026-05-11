import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { locationService } from '../services/locationService';
import { StatesResponse, CitiesResponse, MunicipalitiesResponse } from '../types/location';

export const useStates = (): UseQueryResult<StatesResponse, Error> => {
  return useQuery({
    queryKey: ['states'],
    queryFn: () => locationService.getStates(),
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

export const useMunicipalities = (stateId: string | null): UseQueryResult<MunicipalitiesResponse | null, Error> => {
  return useQuery({
    queryKey: ['municipalities', stateId],
    queryFn: () => stateId ? locationService.getMunicipalitiesByState(stateId) : null,
    enabled: !!stateId,
    staleTime: 1000 * 60 * 60,
  });
};

export const useLocalities = (stateId: string | null, municipalityId: string | null): UseQueryResult<any[] | null, Error> => {
  return useQuery({
    queryKey: ['localities', stateId, municipalityId],
    queryFn: () => (stateId && municipalityId) ? locationService.getLocalitiesByMunicipality(stateId, municipalityId) : null,
    enabled: !!stateId && !!municipalityId,
    staleTime: 1000 * 60 * 60,
  });
};

export const useCities = (stateId: string | null): UseQueryResult<CitiesResponse | null, Error> => {
  return useQuery({
    queryKey: ['cities', stateId],
    queryFn: () => null,
    enabled: !!stateId,
  });
};
