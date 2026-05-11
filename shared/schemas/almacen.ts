import { z } from "zod";

export const almacenSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  address: z.string().optional(),
  manager: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type AlmacenFormValues = z.infer<typeof almacenSchema>;

export interface Almacen extends AlmacenFormValues {
  _id: string;
  _creationTime: number;
}
