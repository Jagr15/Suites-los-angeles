import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Divider,
} from "@heroui/react";
import {
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RoleSelect } from "./RoleSelect";
import { User } from "./types";
import { getEffectivePermissions, sellerPermissions, warehousePermissions, type PermissionDefinition } from "@/shared/security/permissions";

const normalizeRoleKey = (roleName?: string) =>
  (roleName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

interface UserModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  selectedUser: User | null;
  formState: Partial<User & { roleId?: string; password?: string }>;
  setFormState: React.Dispatch<React.SetStateAction<Partial<User & { roleId?: string; password?: string }>>>;
  onSave: () => void;
  onClose: () => void;
  isLoading?: boolean;
  profiles: Array<{ id: string; fullName: string }>;
}

export function UserModal({
  isOpen,
  onOpenChange,
  selectedUser,
  formState,
  setFormState,
  onSave,
  onClose,
  isLoading,
  profiles,
}: UserModalProps) {
  const rolesQuery = useQuery(api.roles.queries.listAll);
  const roles = rolesQuery || [];
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const hasProfiles = profiles.length > 0;
  const isEditingSuperAdmin =
    !!selectedUser && ["superadmin", "super admin"].includes(normalizeRoleKey(selectedUser.role));
  const selectedRole = roles.find((role) => role._id === formState.roleId);
  const roleName = normalizeRoleKey(selectedRole?.name);
  const isAdminRole = ["administrador", "admin", "superadmin", "super admin"].includes(roleName);
  const scopedPermissions: PermissionDefinition[] =
    roleName === "vendedor"
      ? sellerPermissions
      : roleName === "bodeguero" || roleName === "bodega"
      ? warehousePermissions
      : [];

  const rolePermissions = selectedRole?.permissions || [];
  const effectivePermissions = getEffectivePermissions({
    rolePermissions,
    extraPermissions: formState.extraPermissions || [],
    disabledPermissions: formState.disabledPermissions || [],
  });

  const isPermissionEnabled = (permission: PermissionDefinition) => {
    const rawEnabled = effectivePermissions.includes("all") || effectivePermissions.includes(permission.key);
    return permission.inverse ? !rawEnabled : rawEnabled;
  };

  const toggleCustomPermission = (permission: PermissionDefinition, nextVisibleState: boolean) => {
    const baseRawEnabled = rolePermissions.includes("all") || rolePermissions.includes(permission.key);
    const nextRawEnabled = permission.inverse ? !nextVisibleState : nextVisibleState;

    setFormState((prev) => {
      const extra = new Set(prev.extraPermissions || []);
      const disabled = new Set(prev.disabledPermissions || []);

      if (nextRawEnabled === baseRawEnabled) {
        extra.delete(permission.key);
        disabled.delete(permission.key);
      } else if (nextRawEnabled) {
        extra.add(permission.key);
        disabled.delete(permission.key);
      } else {
        extra.delete(permission.key);
        disabled.add(permission.key);
      }

      return {
        ...prev,
        extraPermissions: Array.from(extra),
        disabledPermissions: Array.from(disabled),
      };
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(internalOnClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {selectedUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Perfil Vinculado"
                    placeholder={hasProfiles ? "Selecciona un perfil" : "No hay perfiles disponibles"}
                    variant="bordered"
                    labelPlacement="outside"
                    isDisabled={!hasProfiles}
                    isRequired
                    selectedKeys={formState.profileId ? [formState.profileId] : []}
                    onSelectionChange={(keys) => {
                      const selectedKeys = keys === "all" ? [] : Array.from(keys);
                      const id = selectedKeys[0] as string | undefined;
                      if (!id) return;
                      const profile = profiles?.find(p => p.id === id);
                      setFormState({ ...formState, profileId: id, profileName: profile?.fullName || "" });
                    }}
                  >
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} textValue={profile.fullName}>
                        {profile.fullName}
                      </SelectItem>
                    ))}
                  </Select>
                  {!hasProfiles && (
                    <p className="text-tiny text-warning md:col-span-2">
                      No hay perfiles disponibles. Crea primero un perfil de personal.
                    </p>
                  )}
                  <Input
                    label="Correo Electrónico / Usuario"
                    placeholder="ejemplo@correo.com"
                    variant="bordered"
                    labelPlacement="outside"
                    value={formState.email || ""}
                    onValueChange={(v) => setFormState({ ...formState, email: v })}
                  />
                  <Input
                    label="Contraseña"
                    variant="bordered"
                    labelPlacement="outside"
                    placeholder="••••••••"
                    description="Mínimo 8 caracteres"
                    value={formState.password || ""}
                    onValueChange={(v) => setFormState({ ...formState, password: v })}
                    endContent={
                      <button
                        className="focus:outline-none"
                        type="button"
                        onClick={toggleVisibility}
                      >
                        {isVisible ? (
                          <EyeSlashIcon className="size-5 text-default-400" />
                        ) : (
                          <EyeIcon className="size-5 text-default-400" />
                        )}
                      </button>
                    }
                    type={isVisible ? "text" : "password"}
                  />
                  <div className="flex flex-col gap-1">
                    <RoleSelect
                      selectedRoleId={formState.roleId}
                      rolesSource={isEditingSuperAdmin ? "all" : "assignable"}
                      isDisabled={isEditingSuperAdmin}
                      onRoleChange={(roleId, roleNameFromRole) => {
                        setFormState((prev) => ({
                          ...prev,
                          roleId,
                          role: roleNameFromRole,
                          extraPermissions: [],
                          disabledPermissions: [],
                        }));
                      }}
                    />
                    {isEditingSuperAdmin && (
                      <p className="text-tiny text-warning font-medium px-1">
                        SuperAdmin no es asignable ni editable desde este flujo.
                      </p>
                    )}
                    {formState.role === "Vendedor" && (
                      <p className="text-tiny text-warning font-medium px-1">
                        ⚠️ Los vendedores no tienen acceso a este panel web (solo app móvil).
                      </p>
                    )}
                  </div>
                </div>

                {!isAdminRole ? (
                  <>
                    <Divider />
                    <div className="space-y-4">
                      <h4 className="text-small font-semibold flex items-center gap-2">
                        <ShieldCheckIcon className="size-4 text-primary" />
                        Permisos personalizados
                      </h4>
                      {scopedPermissions.length === 0 ? (
                        <p className="text-tiny text-default-500">
                          Selecciona rol Vendedor o Bodeguero para configurar permisos personalizados.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                          {scopedPermissions.map((permission) => (
                            <div key={permission.key} className="flex items-center justify-between gap-3">
                              <p className="text-small">{permission.label}</p>
                              <Switch
                                size="sm"
                                isSelected={isPermissionEnabled(permission)}
                                onValueChange={(value) => toggleCustomPermission(permission, value)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-tiny text-default-500">
                        Estos permisos se guardan por usuario y no modifican el rol global.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <p className="text-small text-primary font-medium flex items-center gap-2">
                      <ShieldCheckIcon className="size-4" />
                      Acceso Total Habilitado
                    </p>
                    <p className="text-tiny text-default-500 mt-1">
                      Este rol cuenta con todos los permisos del sistema por defecto.
                    </p>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={onSave}
                isLoading={isLoading}
                isDisabled={!hasProfiles || !formState.profileId || !formState.roleId || !formState.email}
              >
                {selectedUser ? "Actualizar" : "Crear"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
