import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User as UserUI } from "./types";
import { Id } from "@/convex/_generated/dataModel";

const hasAnyPermission = (permissions: string[] | undefined, keys: string[]) => {
  if (!permissions) return false;
  return keys.some((key) => permissions.includes(key));
};

export function useUsers() {
  const rawUsers = useQuery(api.users.queries.listAll);
  const rolesAll = useQuery(api.roles.queries.listAll);
  const rolesAssignable = useQuery(api.roles.queries.listAssignable);

  const upsertUserMutation = useMutation(api.users.mutations.upsertUser);
  const removeUserMutation = useMutation(api.users.mutations.removeUser);

  const users: UserUI[] = (rawUsers || []).map((u) => ({
    // Mapeamos permisos del backend (llaves técnicas) a módulos de UI.
    id: u._id,
    profileId: u.profileId || "",
    profileName: u.profileData?.fullName || u.name || "Sin nombre",
    email: u.email || "",
    role: (u.roleData?.name || u.role || "Sin Rol") as string,
    isActive: u.isActive ?? true,
    permissions: {
      ventas: hasAnyPermission(u.roleData?.permissions, ["all", "sales:view", "sales:create", "sales:edit"]),
      inventario: hasAnyPermission(u.roleData?.permissions, ["all", "inventory:view", "inventory:edit", "warehouse:view"]),
      rutas: hasAnyPermission(u.roleData?.permissions, ["all", "routes:view"]),
      finanzas: hasAnyPermission(u.roleData?.permissions, ["all", "finance:view", "finance:edit", "finances:view", "finances:edit"]),
      configuracion: hasAnyPermission(u.roleData?.permissions, ["all", "settings:manage", "users:manage", "settings:view", "users:view", "users:edit"]),
    },
  }));

  const addUser = async (data: Partial<UserUI> & { roleId?: string; password?: string }) => {
    const payload = {
      email: data.email,
      roleId: data.roleId as Id<"roles">,
      profileId: data.profileId as Id<"profiles">,
      isActive: data.isActive,
      password: data.password, // Pasamos la contraseña al backend
    };
    return await upsertUserMutation(payload);
  };

  const updateUser = async (id: string, data: Partial<UserUI> & { roleId?: string; password?: string }) => {
    const payload = {
      id: id as Id<"users">,
      email: data.email,
      roleId: data.roleId as Id<"roles">,
      profileId: data.profileId as Id<"profiles">,
      isActive: data.isActive,
      password: data.password, // Pasamos la contraseña si se está cambiando
    };
    return await upsertUserMutation(payload);
  };

  const deleteUser = async (id: string) => {
    return await removeUserMutation({ id: id as Id<"users"> });
  };

  return {
    users,
    roles: rolesAssignable,
    rolesAll,
    isLoading: rawUsers === undefined || rolesAll === undefined || rolesAssignable === undefined,
    addUser,
    updateUser,
    deleteUser,
  };
}
