export interface State {
  id: number;
  name: string;
  cities_count: number;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
}

export interface Municipality {
  id: number;
  name: string;
  municipality_key: string;
  zip_code: string;
  state_id: number;
}

export interface PaginationLinks {
  first: string;
  last: string;
  next: string | null;
  prev: string | null;
}

export interface PaginationMeta {
  per_page: number;
  total_pages: number;
  total_objects: number;
  links: PaginationLinks;
}

export interface StatesResponse {
  states: State[];
  meta: {
    pagination: PaginationMeta;
  };
}

export interface CitiesResponse {
  cities: City[];
  meta: {
    pagination: PaginationMeta;
  };
}

export interface MunicipalitiesResponse {
  municipalities: Municipality[];
  meta?: {
    pagination: PaginationMeta;
  };
}
