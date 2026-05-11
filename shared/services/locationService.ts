import mexicoApi from '../api/mexicoApi';
import { StatesResponse, MunicipalitiesResponse } from '../types/location';

export const locationService = {
  getStates: async (): Promise<StatesResponse> => {
    // Listar todos los estados: /api/estados
    const response = await mexicoApi.get('/estados');
    
    // Basado en la respuesta anterior: {"pais":"México","total":32,"estados":["Aguascalientes",...]}
    const estados = response.data.estados || [];
    
    return {
      states: estados.map((name: string) => ({
        id: name,
        name: name,
        cities_count: 0
      })),
      meta: {
        pagination: {
          per_page: 50,
          total_pages: 1,
          total_objects: estados.length,
          links: { first: "", last: "", next: null, prev: null }
        }
      }
    };
  },

  getMunicipalitiesByState: async (stateName: string): Promise<MunicipalitiesResponse> => {
    // Obtener municipios de un estado: /api/estado/:nombre
    const response = await mexicoApi.get(`/estado/${stateName}`);
    
    // Basado en el patrón esperado: {"estado":"...","total":...,"municipios":["...",...]}
    const municipios = response.data.municipios || [];
    
    const uniqueMunicipalities = municipios.map((name: string, index: number) => ({
      id: name,
      name: name,
      municipality_key: (index + 1).toString(),
      zip_code: "",
      state_id: 0
    }));

    return {
      municipalities: uniqueMunicipalities,
      meta: {
        pagination: {
          per_page: 100,
          total_pages: 1,
          total_objects: uniqueMunicipalities.length,
          links: { first: "", last: "", next: null, prev: null }
        }
      }
    };
  },
};
