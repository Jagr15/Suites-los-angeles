export interface Client {
  id: string;
  commercialName: string;
  buyerName: string;
  requiresInvoice: boolean;
  businessName?: string;
  rfc?: string;
  taxRegime?: string;
  mapsUrl: string;
  townId: string;
  townName: string;
  municipalityId: string;
  municipalityName: string;
  stateId?: string;
  stateName?: string;
  visitFrequency: "Semanal" | "Quincenal" | "Mensual";
  assignedRouteId: string;
  assignedRouteName: string;
  creditLimit: number;
  creditDays: number;
  availableScheduleStart?: string;
  availableScheduleEnd?: string;
}

export const INITIAL_CLIENTS: Client[] = [
  {
    id: "1",
    commercialName: "Abarrotes Doña Mari",
    buyerName: "María Hernández",
    requiresInvoice: true,
    businessName: "María de la Paz Hernández",
    rfc: "HEMP800101XXX",
    taxRegime: "Persona Física con Actividad Empresarial",
    mapsUrl: "https://maps.google.com/...",
    townId: "P01",
    townName: "Pueblo Viejo",
    municipalityId: "M01",
    municipalityName: "Villa de Reyes",
    visitFrequency: "Semanal",
    assignedRouteId: "R01",
    assignedRouteName: "Ruta Norte",
    creditLimit: 15000.0,
    creditDays: 7,
  },
  {
    id: "2",
    commercialName: "Mini Super El Paso",
    buyerName: "Jorge Luna",
    requiresInvoice: false,
    mapsUrl: "https://maps.google.com/...",
    townId: "P02",
    townName: "La Esperanza",
    municipalityId: "M01",
    municipalityName: "Villa de Reyes",
    visitFrequency: "Quincenal",
    assignedRouteId: "R02",
    assignedRouteName: "Ruta Sur",
    creditLimit: 5000.0,
    creditDays: 15,
  },
];

export const MUNICIPALITIES = [
  { id: "M01", name: "Villa de Reyes" },
  { id: "M02", name: "San Luis Potosí" },
  { id: "M03", name: "Soledad de Graciano Sánchez" },
  { id: "M04", name: "Santa María del Río" },
];

export const TOWNS = [
  // Villa de Reyes
  { id: "P01", municipalityId: "M01", name: "Pueblo Viejo" },
  { id: "P02", municipalityId: "M01", name: "La Esperanza" },
  { id: "P03", municipalityId: "M01", name: "Pardo" },
  // San Luis Potosí
  { id: "P04", municipalityId: "M02", name: "La Pila" },
  { id: "P05", municipalityId: "M02", name: "Pozos" },
  { id: "P06", municipalityId: "M02", name: "Escalerillas" },
  // Soledad
  { id: "P07", municipalityId: "M03", name: "Enrique Estrada" },
  { id: "P08", municipalityId: "M03", name: "Ventura" },
  // Santa María
  { id: "P09", municipalityId: "M04", name: "El Toro" },
];

export const ROUTES = [
  { id: "R01", name: "Ruta Norte" },
  { id: "R02", name: "Ruta Sur" },
  { id: "R03", name: "Ruta Centro" },
  { id: "R04", name: "Ruta Industrial" },
];
