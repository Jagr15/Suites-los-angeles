import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../common/utils";
import { hashPassword, verifyPassword } from "../common/hashing";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Crea o actualiza un usuario manualmente por un administrador.
 */
export const upsertUser = mutation({
  args: {
    id: v.optional(v.id("users")),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    roleId: v.optional(v.id("roles")),
    profileId: v.optional(v.id("profiles")),
    role: v.optional(v.string()), 
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    password: v.optional(v.string()), // Nueva contraseña opcional
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, email, password, roleId, role: _clientRole, ...userData } = args;

    if (!email) {
      throw new Error("El correo electrónico es obligatorio");
    }
    if (!roleId) {
      throw new Error("Debe seleccionar un rol válido");
    }
    if (!args.profileId) {
      throw new Error("Debe vincular un perfil");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Perfil vinculado inválido");
    }

    let canonicalRole: string | undefined = undefined;
    const roleDoc = await ctx.db.get(roleId);
    if (!roleDoc) {
      throw new Error("Rol inválido");
    }
    canonicalRole = roleDoc.name;

    const normalizedUserData = {
      ...userData,
      roleId,
      role: canonicalRole,
      profileId: args.profileId,
    };
    
    let userId: any = id;
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (id) {
      if (existingByEmail && existingByEmail._id !== id) {
        throw new Error("Ya existe un usuario con este correo.");
      }
      await ctx.db.patch(id, { ...normalizedUserData, email });
    } else {
      if (existingByEmail) {
        throw new Error("Ya existe un usuario con este correo.");
      }
      userId = await ctx.db.insert("users", {
          ...normalizedUserData,
          name: profile.fullName,
          email,
          isActive: normalizedUserData.isActive ?? true,
      });
    }

    // SI hay password y email, vinculamos la cuenta de autenticación
    if (password && email && userId) {
      const hashedSecret = await hashPassword(password);
      
      const existingAccount = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", q => 
          q.eq("provider", "password").eq("providerAccountId", email)
        )
        .unique();

      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, { 
          secret: hashedSecret,
          userId: userId // Aseguramos que esté vinculado al user correcto
        });
      } else {
        await ctx.db.insert("authAccounts", {
          userId: userId,
          provider: "password",
          providerAccountId: email,
          secret: hashedSecret,
        });
      }
    }

    return userId;
  },
});

/**
 * Elimina un usuario (acción reservada).
 */
export const removeUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

/**
 * Actualiza el perfil del usuario autenticado.
 */
export const updateMe = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.union(v.string(), v.null())),
    password: v.optional(v.string()),
    currentPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("No autenticado");
    }

    const { name, email, phone, image, password, currentPassword } = args;
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Usuario no encontrado");

    // 1. Verificación de seguridad si se quiere cambiar el password
    if (password) {
      if (!currentPassword) {
        throw new Error("Debes proporcionar tu contraseña actual para cambiarla");
      }

      const account = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", q => 
          q.eq("provider", "password").eq("providerAccountId", user.email!)
        )
        .unique();

      if (!account) {
        throw new Error("No se encontró una cuenta vinculada para este usuario");
      }

      const isCorrect = await verifyPassword(currentPassword, account.secret!);
      if (!isCorrect) {
        throw new Error("La contraseña actual es incorrecta");
      }

      // Si es correcta, preparamos el nuevo hash
      const hashedSecret = await hashPassword(password);
      await ctx.db.patch(account._id, { secret: hashedSecret });
    }

    // 2. Actualizar datos del perfil
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (image !== undefined) updateData.image = image;

    await ctx.db.patch(userId, updateData);

    // 3. Si el email cambió, actualizamos la cuenta de auth
    if (email && email !== user.email) {
      const existingAccount = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", q => 
          q.eq("provider", "password").eq("providerAccountId", user.email!)
        )
        .unique();

      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, { providerAccountId: email });
      }
    }

    return userId;
  },
});
