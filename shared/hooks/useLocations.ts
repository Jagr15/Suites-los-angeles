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

export const useMunicipalities = (stateName: string | null): UseQueryResult<MunicipalitiesResponse | null, Error> => {
  return useQuery({
    queryKey: ['municipalities', stateName],
    queryFn: () => stateName ? locationService.getMunicipalitiesByState(stateName) : null,
    enabled: !!stateName,
    staleTime: 1000 * 60 * 60,
  });
};

export const useCities = (stateName: string | null): UseQueryResult<CitiesResponse | null, Error> => {
  return useQuery({
    queryKey: ['cities', stateName],
    queryFn: () => null,
    enabled: !!stateName,
  });
};
