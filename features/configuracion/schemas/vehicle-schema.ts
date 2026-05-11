import { z } from "zod";

export const vehicleSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  brand: z.string().optional(),
  model: z.string().optional(),
  plate: z.string().min(5, "Ingresa placas válidas"),
  year: z.string().optional(),
  isActive: z.boolean().default(true),
  acquisitionValue: z.number().min(0).optional(),
  acquisitionDate: z.string().optional(),
  usefulLifeYears: z.number().min(1).optional(),
  status: z.enum(["Activo", "Inactivo", "Mantenimiento"]).default("Activo"),
});

export type VehicleSchema = z.infer<typeof vehicleSchema>;
