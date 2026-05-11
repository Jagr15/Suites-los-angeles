import { z } from "zod";

export const clientSchema = z.object({
  commercialName: z.string().min(1, "El nombre comercial es obligatorio"),
  buyerName: z.string().min(1, "El encargado es obligatorio"),
  requiresInvoice: z.boolean(),
  businessName: z.string().optional(),
  rfc: z.string().optional(),
  taxRegime: z.string().optional(),
  mapsUrl: z.string().url("URL de Google Maps inválida").or(z.literal("")),
  townId: z.string(),
  townName: z.string(),
  municipalityId: z.string().min(1, "El municipio es obligatorio"),
  municipalityName: z.string(),
  stateId: z.string().optional(),
  stateName: z.string().optional(),
  visitFrequency: z.enum(["Semanal", "Quincenal", "Mensual"]),
  assignedRouteId: z.string().optional(),
  assignedRouteName: z.string().optional(),
  creditLimit: z.number().min(0),
  creditDays: z.number().min(0),
  availableScheduleStart: z.string().optional(),
  availableScheduleEnd: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  image: z.string().optional(),
  visitOrder: z.number().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
