import axios from 'axios';
import { StatesResponse, MunicipalitiesResponse, State, Municipality } from '../types/location';
import type { Locality } from '../hooks/useLocations';

type LocationApiItem = {
  id: number;
  name: string;
};

const isLocationApiItem = (value: unknown): value is LocationApiItem => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "number" && typeof candidate.name === "string";
};

export const locationService = {
  getStates: async (): Promise<StatesResponse> => {
    const response = await axios.get('/api/locations', {
      params: { type: 'states' }
    });
    
    const states = Array.isArray(response.data) ? response.data.filter(isLocationApiItem) : [];
    
    return {
      states: states.map((s): State => ({
        id: s.id,
        name: s.name,
        cities_count: 0
      })),
      meta: {
        pagination: {
          per_page: 50,
          total_pages: 1,
          total_objects: states.length,
          links: { first: "", last: "", next: null, prev: null }
        }
      }
    };
  },

  getMunicipalitiesByState: async (stateId: string): Promise<MunicipalitiesResponse> => {
    const response = await axios.get('/api/locations', {
      params: { type: 'municipalities', stateId }
    });
    
    const municipalities = Array.isArray(response.data) ? response.data.filter(isLocationApiItem) : [];
    
    return {
      municipalities: municipalities.map((m): Municipality => ({
        id: m.id,
        name: m.name,
        municipality_key: String(m.id),
        zip_code: "",
        state_id: 0
      })),
      meta: {
        pagination: {
          per_page: 100,
          total_pages: 1,
          total_objects: municipalities.length,
          links: { first: "", last: "", next: null, prev: null }
        }
      }
    };
  },

  getLocalitiesByMunicipality: async (stateId: string, municipalityId: string): Promise<Locality[]> => {
    const response = await axios.get('/api/locations', {
      params: { type: 'localities', stateId, municipalityId }
    });
    return Array.isArray(response.data)
      ? response.data
          .filter((item): item is Locality => typeof item?.id === "number" && typeof item?.name === "string")
      : [];
  },
};
