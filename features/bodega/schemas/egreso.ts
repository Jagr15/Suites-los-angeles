import { z } from "zod";

export const bodegaEgresoSchema = z.object({
    amount: z.number().min(0.01, "El monto debe ser mayor a cero"),
    categoryId: z.string().min(1, "La categoría es obligatoria"),
    subcategoryId: z.string().min(1, "La subcategoría es obligatoria"),
    date: z.string().min(1, "La fecha es obligatoria"),
    responsibleId: z.string().min(1, "Debes seleccionar un responsable"),
    responsibleName: z.string(),
    notes: z.string().optional(),
    evidence: z.any().optional(),
});

export type BodegaEgresoFormValues = z.infer<typeof bodegaEgresoSchema>;
