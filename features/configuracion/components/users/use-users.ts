import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { User as UserUI } from "./types";

const hasAnyPermission = (permissions: string[] | undefined, keys: string[]) => {
  if (!permissions) return false;
  return permissions.includes("all") || keys.some((key) => permissions.includes(key));
};

export function useUsers() {
  const rawUsers = useQuery(api.users.queries.listAll);
  const rolesAll = useQuery(api.roles.queries.listAll);
  const rolesAssignable = useQuery(api.roles.queries.listAssignable);

  const upsertUserMutation = useMutation(api.users.mutations.upsertUser);
  const deactivateUserMutation = useMutation(api.users.mutations.deactivateUser);
  const reactivateUserMutation = useMutation(api.users.mutations.reactivateUser);
  const removeUserMutation = useMutation(api.users.mutations.removeUser);

  const users: UserUI[] = (rawUsers || []).map((u) => ({
    // Mapeamos permisos del backend (llaves técnicas) a módulos de UI.
    id: u._id,
    profileId: u.profileId || "",
    profileName: u.profileData?.fullName || u.name || "Sin nombre",
    email: u.email || "",
    role: (u.roleData?.name || u.role || "Sin Rol") as string,
    isActive: u.isActive ?? true,
    effectivePermissions: u.effectivePermissions || u.roleData?.permissions || [],
    extraPermissions: u.extraPermissions || [],
    disabledPermissions: u.disabledPermissions || [],
    allowedWarehouseIds: (u.allowedWarehouseIds || []).map((id) => String(id)),
    permissions: {
      ventas: hasAnyPermission(u.effectivePermissions, ["sales:view", "sales:create", "sales:edit"]),
      inventario: hasAnyPermission(u.effectivePermissions, ["inventory:view", "inventory:edit", "warehouse:view"]),
      rutas: hasAnyPermission(u.effectivePermissions, ["routes:view"]),
      finanzas: hasAnyPermission(u.effectivePermissions, ["finance:view", "finance:edit", "finances:view", "finances:edit"]),
      configuracion: hasAnyPermission(u.effectivePermissions, ["settings:manage", "users:manage", "settings:view", "users:view", "users:edit"]),
    },
  }));

  const addUser = async (data: Partial<UserUI> & { roleId?: string; password?: string }) => {
    const payload = {
      email: data.email,
      roleId: data.roleId as Id<"roles">,
      profileId: data.profileId as Id<"profiles">,
      isActive: data.isActive,
      extraPermissions: data.extraPermissions || [],
      disabledPermissions: data.disabledPermissions || [],
      allowedWarehouseIds: (data.allowedWarehouseIds || []).map((id) => id as Id<"bodegas">),
      password: data.password?.trim() || undefined,
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
      extraPermissions: data.extraPermissions || [],
      disabledPermissions: data.disabledPermissions || [],
      allowedWarehouseIds: (data.allowedWarehouseIds || []).map((id) => id as Id<"bodegas">),
      password: data.password?.trim() || undefined,
    };
    return await upsertUserMutation(payload);
  };

  const deactivateUser = async (id: string) => {
    return await deactivateUserMutation({ id: id as Id<"users"> });
  };

  const reactivateUser = async (id: string) => {
    return await reactivateUserMutation({ id: id as Id<"users"> });
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
    deactivateUser,
    reactivateUser,
    deleteUser,
  };
}
