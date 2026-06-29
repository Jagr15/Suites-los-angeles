import { z } from "zod";

const clientTypeSchema = z.enum(["commercial", "wholesaler", "retail", "QA"]);
const deliveryTypeSchema = z.enum(["pickup", "delivery", "Ruta"]);

export const clientSchema = z
  .object({
    clientType: clientTypeSchema.default("commercial"),
    commercialName: z.string().min(1, "El nombre comercial es obligatorio"),
    buyerName: z.string().optional(),
    responsable: z.string().optional(),
    requiresInvoice: z.boolean().optional(),
    businessName: z.string().optional(),
    rfc: z.string().optional(),
    taxRegime: z.string().optional(),
    mapsUrl: z.string().optional(),
    townId: z.string().optional(),
    townName: z.string().optional(),
    municipalityId: z.string().optional(),
    municipalityName: z.string().optional(),
    stateId: z.string().optional(),
    stateName: z.string().optional(),
    pricingCustomerLevelId: z.string().optional(),
    visitFrequency: z.enum(["Semanal", "Quincenal", "Mensual"]).optional(),
    assignedRouteId: z.string().optional(),
    assignedRouteName: z.string().optional(),
    creditLimit: z.number().min(0).optional(),
    creditDays: z.number().min(0).optional(),
    availableScheduleStart: z.string().optional(),
    availableScheduleEnd: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    image: z.string().optional(),
    visitOrder: z.number().optional(),
    tipoEntrega: deliveryTypeSchema.optional(),
    diaEntrega: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const clientType = data.clientType ?? "commercial";
    if (!data.commercialName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commercialName"],
        message: "El nombre es obligatorio",
      });
    }

    if (clientType === "retail") return;

    if (!data.buyerName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["buyerName"],
        message: "El encargado es obligatorio",
      });
    }

    const requiredFields: Array<[keyof typeof data, string]> = [
      ["mapsUrl", "La ubicación es obligatoria"],
      ["townId", "La localidad es obligatoria"],
      ["townName", "La localidad es obligatoria"],
      ["municipalityId", "El municipio es obligatorio"],
      ["municipalityName", "El municipio es obligatorio"],
      ["stateId", "El estado es obligatorio"],
      ["stateName", "El estado es obligatorio"],
    ];

    for (const [key, message] of requiredFields) {
      const value = data[key];
      if (typeof value !== "string" || !value.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message });
      }
    }

    if (typeof data.creditLimit !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creditLimit"],
        message: "El límite de crédito es obligatorio",
      });
    }

    if (typeof data.creditDays !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["creditDays"],
        message: "Los días de crédito son obligatorios",
      });
    }

    if (clientType === "wholesaler") {
      if (!data.tipoEntrega) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tipoEntrega"],
          message: "Selecciona el tipo de entrega.",
        });
      }

      if (!data.diaEntrega?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["diaEntrega"],
          message: "El día de entrega es obligatorio.",
        });
      }
    }
  });

export type ClientFormValues = z.infer<typeof clientSchema>;
