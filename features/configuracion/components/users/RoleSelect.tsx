import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface RoleOption {
  _id: string;
  name: string;
  permissions?: string[];
  description?: string;
}

interface RoleSelectProps {
  selectedRoleId?: string;
  onRoleChange: (
    roleId: string,
    roleName: string,
    rolePermissions: string[],
    selectedRole?: RoleOption
  ) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  rolesSource?: "assignable" | "all";
  isDisabled?: boolean;
}

export function RoleSelect({
  selectedRoleId,
  onRoleChange,
  label = "Rol del Sistema",
  placeholder = "Selecciona un rol",
  className,
  rolesSource = "assignable",
  isDisabled = false,
}: RoleSelectProps) {
  const roles = useQuery(
    rolesSource === "all" ? api.roles.queries.listAll : api.roles.queries.listAssignable
  );
  const roleItems = roles || [];

  const emitRoleChange = (roleId?: string) => {
    if (!roleId) return;
    const role = roleItems.find((r) => r._id === roleId);
    if (!role) return;
    onRoleChange(roleId, role.name, role.permissions || [], role as RoleOption);
  };

  return (
    <div className={className}>
      <label className="block text-sm mb-2 text-foreground">{label}</label>
      <select
        value={selectedRoleId || ""}
        onChange={(e) => emitRoleChange(e.target.value || undefined)}
        disabled={roles === undefined || isDisabled}
        className="w-full rounded-medium border border-default-300 bg-content1 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="" disabled>
          {roles === undefined ? "Cargando roles..." : placeholder}
        </option>
        {roleItems.map((role) => (
          <option key={role._id} value={role._id}>
            {role.name}
          </option>
        ))}
      </select>
      {selectedRoleId && (
        <p className="mt-1 text-tiny text-default-500">
          {roleItems.find((r) => r._id === selectedRoleId)?.description || ""}
        </p>
      )}
    </div>
  );
}
