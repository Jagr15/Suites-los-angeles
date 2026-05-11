import axios from 'axios';
import { StatesResponse, MunicipalitiesResponse } from '../types/location';

export const locationService = {
  getStates: async (): Promise<StatesResponse> => {
    const response = await axios.get('/api/locations', {
      params: { type: 'states' }
    });
    
    const states = response.data || [];
    
    return {
      states: states.map((s: any) => ({
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
    
    const municipalities = response.data || [];
    
    return {
      municipalities: municipalities.map((m: any) => ({
        id: m.id,
        name: m.name,
        municipality_key: m.id,
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

  getLocalitiesByMunicipality: async (stateId: string, municipalityId: string): Promise<any> => {
    const response = await axios.get('/api/locations', {
      params: { type: 'localities', stateId, municipalityId }
    });
    return response.data || [];
  },
};
