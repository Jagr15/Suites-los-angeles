import { z } from "zod";

export const routeSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  destination: z.string().min(1, "El destino es requerido"),
  deliveryType: z.enum(["sucursal", "envio"]),
  assignedProfileId: z.string().min(1, "Debes asignar un responsable"),
  assetId: z.string().min(1, "Debes asignar un transporte (activo)"),
  operationDays: z.array(z.string()).min(1, "Selecciona al menos un día de operación"),
  loadDay: z.string().min(1, "Selecciona un día de carga"),
  isActive: z.boolean().default(true),
  requireGpsValidation: z.boolean().default(false),
  gpsRadiusLimit: z.coerce.number().min(10, "El radio mínimo es de 10 metros").default(100),
  allowLocationUpdate: z.boolean().default(false),
  requireKmTracking: z.boolean().default(false),
  allowOffHoursSales: z.boolean().default(false),
  requireVisitOrder: z.boolean().default(false),
  allowNoSaleCheckIn: z.boolean().default(true),
  requireMinVisitTime: z.boolean().default(false),
  minVisitTimeMinutes: z.coerce.number().min(0, "El tiempo mínimo debe ser positivo").default(0),
  startLat: z.number().optional(),
  startLng: z.number().optional(),
  stops: z.array(z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  })).optional(),
});

export type RouteSchema = z.infer<typeof routeSchema>;
