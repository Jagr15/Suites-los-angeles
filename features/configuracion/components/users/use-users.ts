import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User as UserUI } from "./types";
import { Id } from "@/convex/_generated/dataModel";

export function useUsers() {
  const rawUsers = useQuery(api.users.queries.listAll);
  const roles = useQuery(api.roles.queries.listAll);

  const upsertUserMutation = useMutation(api.users.mutations.upsertUser);
  const removeUserMutation = useMutation(api.users.mutations.removeUser);

  const users: UserUI[] = (rawUsers || []).map((u) => ({
    id: u._id,
    profileId: u.profileId || "",
    profileName: u.name || "Sin nombre",
    email: u.email || "",
    role: (u.roleData?.name || u.role || "Sin Rol") as string,
    isActive: u.isActive ?? true,
    permissions: {
      ventas: u.roleData?.permissions.includes("ventas") || false,
      inventario: u.roleData?.permissions.includes("inventario") || false,
      rutas: u.roleData?.permissions.includes("rutas") || false,
      finanzas: u.roleData?.permissions.includes("finanzas") || false,
      configuracion: u.roleData?.permissions.includes("configuracion") || false,
    },
  }));

  const addUser = async (data: Partial<UserUI> & { roleId?: string; password?: string }) => {
    return await upsertUserMutation({
      name: data.profileName,
      email: data.email,
      roleId: data.roleId as Id<"roles">,
      profileId: data.profileId as Id<"profiles">,
      role: data.role as string,
      isActive: data.isActive,
      password: data.password, // Pasamos la contraseña al backend
    });
  };

  const updateUser = async (id: string, data: Partial<UserUI> & { roleId?: string; password?: string }) => {
    return await upsertUserMutation({
      id: id as Id<"users">,
      name: data.profileName,
      email: data.email,
      roleId: data.roleId as Id<"roles">,
      profileId: data.profileId as Id<"profiles">,
      role: data.role as string,
      isActive: data.isActive,
      password: data.password, // Pasamos la contraseña si se está cambiando
    });
  };

  const deleteUser = async (id: string) => {
    return await removeUserMutation({ id: id as Id<"users"> });
  };

  return {
    users,
    roles,
    isLoading: rawUsers === undefined || roles === undefined,
    addUser,
    updateUser,
    deleteUser,
  };
}
