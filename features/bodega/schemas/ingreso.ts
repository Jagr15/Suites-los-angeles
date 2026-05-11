import { z } from "zod";

export const bodegaIngresoSchema = z.object({
    amount: z.number().min(0.01, "El monto debe ser mayor a cero"),
    categoryId: z.string().min(1, "La categoría es obligatoria"),
    subcategoryId: z.string().min(1, "La subcategoría es obligatoria"),
    date: z.string().min(1, "La fecha es obligatoria"),
    responsibleId: z.string().min(1, "Debes seleccionar un responsable"),
    responsibleName: z.string(),
    clientName: z.string().optional(),
    notes: z.string().optional(),
    evidence: z.any().optional(), // Para la foto
});

export type BodegaIngresoFormValues = z.infer<typeof bodegaIngresoSchema>;
