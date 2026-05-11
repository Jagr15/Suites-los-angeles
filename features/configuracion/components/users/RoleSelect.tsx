import React from "react";
import { Select, SelectItem } from "@heroui/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface RoleSelectProps {
  selectedRoleId?: string;
  onRoleChange: (roleId: string, roleName: string, rolePermissions: string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function RoleSelect({ 
  selectedRoleId, 
  onRoleChange, 
  label = "Rol del Sistema", 
  placeholder = "Selecciona un rol",
  className,
}: RoleSelectProps) {
  const roles = useQuery(api.roles.queries.listAll);

  return (
    <Select
      label={label}
      placeholder={placeholder}
      variant="bordered"
      labelPlacement="outside"
      isLoading={roles === undefined}
      selectedKeys={selectedRoleId ? [selectedRoleId] : []}
      className={className}
      onSelectionChange={(keys) => {
        const roleId = Array.from(keys)[0] as string;
        const role = roles?.find((r) => r._id === roleId);
        if (role) {
          onRoleChange(roleId, role.name, role.permissions || []);
        }
      }}
    >
      {(roles || []).map((role) => (
        <SelectItem key={role._id} textValue={role.name}>
          <div className="flex flex-col">
            <span className="text-small font-medium">{role.name}</span>
            {role.description && (
              <span className="text-tiny text-default-400">{role.description}</span>
            )}
          </div>
        </SelectItem>
      ))}
    </Select>
  );
}
