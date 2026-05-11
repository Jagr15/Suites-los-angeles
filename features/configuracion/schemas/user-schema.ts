import { z } from "zod";

export const userSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Ingrese un correo electrónico válido"),
  profileId: z.string().min(1, "Debe vincular un perfil"),
  roleId: z.string().min(1, "Debe seleccionar un rol"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type UserFormData = z.infer<typeof userSchema>;
