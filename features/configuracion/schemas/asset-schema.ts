import { z } from "zod";

export const assetCategories = [
  "Equipo de Transporte",
  "Mobiliario y Equipo de Oficina",
  "Equipo de Cómputo",
  "Maquinaria y Equipo",
  "Edificios e Instalaciones",
  "Terrenos",
] as const;

export const assetSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  category: z.enum(assetCategories, "Selecciona una categoría válida"),
  acquisitionValue: z.number().min(0, "El valor debe ser positivo"),
  acquisitionDate: z.string().min(1, "Selecciona la fecha de adquisición"),
  usefulLifeYears: z.number().min(1, "La vida útil debe ser al menos 1 año"),
  serialNumber: z.string().optional(),
  status: z.enum(["Activo", "Inactivo", "Mantenimiento"]),
  vehicleId: z.string().optional(),
});

export type AssetSchema = z.infer<typeof assetSchema>;
