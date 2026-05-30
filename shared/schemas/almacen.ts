import { z } from "zod";

export const almacenSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  address: z.string().optional(),
  manager: z.string().optional(),
  managerProfileId: z.string().optional(),
  managerUserId: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
  allowedUserIds: z.array(z.string()).optional(),
});

export type AlmacenFormValues = z.infer<typeof almacenSchema>;

export interface Almacen extends AlmacenFormValues {
  _id: string;
  _creationTime: number;
}
