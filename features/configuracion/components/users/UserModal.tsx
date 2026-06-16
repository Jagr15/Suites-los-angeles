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
  Checkbox,
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
import {
  getEffectivePermissions,
  getPermissionDescendants,
  isPermissionLockedByDependencies,
  PERMISSION_GROUPS,
  sellerPermissions,
  warehousePermissions,
  type PermissionDefinition,
} from "@/shared/security/permissions";

const normalizeRoleKey = (roleName?: string) =>
  (roleName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const SECTION_ORDER = [
  "Ruta/GPS",
  "Dinero/Cobranza",
  "Ventas/Inventario",
  "Clientes/Crédito",
  "Sistema/App",
  "Inventario/Bodega",
  "Entradas",
  "Salidas",
  "Nóminas",
  "Control general",
  "Compatibilidad actual",
] as const;

interface UserModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  selectedUser: User | null;
  formState: Partial<User & { roleId?: string; password?: string }>;
  setFormState: React.Dispatch<React.SetStateAction<Partial<User & { roleId?: string; password?: string }>>>;
  onSave: () => void;
  onClose: () => void;
  isLoading?: boolean;
  profiles: Array<{ id: string; fullName: string; status?: string }>;
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
  const bodegasQuery = useQuery(api.bodegas.queries.list);
  const bodegas = bodegasQuery || [];
  const activeProfilesQuery = useQuery(api.profiles.queries.listActiveForSelection);
  const activeProfiles = activeProfilesQuery || [];
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const selectedProfileId = formState.profileId ? String(formState.profileId) : "";
  const currentProfile = selectedProfileId ? profiles.find((profile) => profile.id === selectedProfileId) : null;
  const profileOptions = React.useMemo(() => {
    const next = [...activeProfiles];
    if (currentProfile && !next.some((profile) => profile._id === currentProfile.id)) {
      next.push({
        _id: currentProfile.id as any,
        fullName: currentProfile.fullName,
        userId: undefined,
        group: undefined,
        status: (currentProfile.status as "Activo" | "Inactivo") || "Inactivo",
      });
    }
    return next;
  }, [activeProfiles, currentProfile]);
  const hasProfiles = profileOptions.length > 0;
  const isEditingSuperAdmin =
    !!selectedUser && ["superadmin", "super admin"].includes(normalizeRoleKey(selectedUser.role));
  const selectedRole = roles.find((role) => role._id === formState.roleId);
  const roleName = normalizeRoleKey(selectedRole?.name || formState.role);
  const isAdminRole = ["administrador", "admin", "superadmin", "super admin"].includes(roleName);
  const isBodegueroRole = roleName === "bodeguero" || roleName === "bodega";
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
  const effectivePermissionSet = new Set(effectivePermissions);

  const groupedPermissions = React.useMemo(() => {
    const assigned = new Set<string>();
    const groups: Array<{ title: string; permissions: PermissionDefinition[] }> = [];

    for (const group of PERMISSION_GROUPS) {
      const permissions = scopedPermissions.filter((permission) => group.keys.includes(permission.key));
      permissions.forEach((permission) => assigned.add(permission.key));
      if (permissions.length > 0) {
        groups.push({ title: group.title, permissions });
      }
    }

    const remainingPermissions = scopedPermissions.filter((permission) => !assigned.has(permission.key));
    const bySection = new Map<string, PermissionDefinition[]>();
    for (const section of SECTION_ORDER) bySection.set(section, []);
    for (const permission of remainingPermissions) {
      const current = bySection.get(permission.section) || [];
      current.push(permission);
      bySection.set(permission.section, current);
    }
    for (const section of SECTION_ORDER) {
      const permissions = bySection.get(section) || [];
      if (permissions.length > 0) {
        groups.push({ title: section, permissions });
      }
    }

    return groups;
  }, [scopedPermissions]);

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
        for (const descendant of getPermissionDescendants(permission.key)) {
          extra.delete(descendant);
        }
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
        {() => (
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
                      const profile = profileOptions.find((p) => String(p._id) === id);
                      setFormState({ ...formState, profileId: id, profileName: profile?.fullName || "" });
                    }}
                  >
                    {profileOptions.map((profile) => (
                      <SelectItem key={String(profile._id)} textValue={profile.fullName}>
                        {profile.fullName}
                        {profile.status !== "Activo" ? " (Inactivo)" : ""}
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
                    label={selectedUser ? "Nueva contraseña" : "Contraseña"}
                    variant="bordered"
                    labelPlacement="outside"
                    placeholder="••••••••"
                    description={selectedUser ? "Déjalo vacío para conservar la contraseña actual." : "Mínimo 8 caracteres"}
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

                {isBodegueroRole && (
                  <>
                    <Divider />
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-small font-semibold">Acceso a bodegas</h4>
                        <p className="text-tiny text-default-500">
                          Marca una o varias bodegas para este usuario bodeguero.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl border border-default-200 bg-content2/70 p-3">
                        {bodegas.length === 0 ? (
                          <p className="text-tiny text-default-500 md:col-span-2">No hay bodegas registradas.</p>
                        ) : (
                          bodegas.map((bodega) => {
                            const selected = (formState.allowedWarehouseIds || []).includes(String(bodega._id));
                            return (
                              <Checkbox
                                key={String(bodega._id)}
                                isSelected={selected}
                                onValueChange={(isSelected) => {
                                  const current = new Set(formState.allowedWarehouseIds || []);
                                  if (isSelected) {
                                    current.add(String(bodega._id));
                                  } else {
                                    current.delete(String(bodega._id));
                                  }
                                  setFormState({
                                    ...formState,
                                    allowedWarehouseIds: Array.from(current),
                                  });
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{bodega.name}</span>
                                  <span className="text-tiny text-default-500">
                                    {bodega.address || bodega.description || "Sin detalle"}
                                  </span>
                                </div>
                              </Checkbox>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {groupedPermissions.map((group) => (
                            <div key={group.title} className="rounded-xl border border-default-200 bg-content2/70 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-3">
                                {group.title}
                              </p>
                              <div className="space-y-2">
                                {group.permissions.map((permission) => {
                                  const lockedByDependencies = isPermissionLockedByDependencies(permission.key, effectivePermissionSet);
                                  const isSelected = isPermissionEnabled(permission);
                                  return (
                                    <div
                                      key={permission.key}
                                      className={`flex items-center justify-between gap-3 rounded-lg border border-default-100 bg-content1 px-3 py-2 ${
                                        lockedByDependencies ? "opacity-55" : ""
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <p className="text-small leading-snug">{permission.label}</p>
                                        {lockedByDependencies && (
                                          <p className="text-[11px] text-default-400">Depende de inventario activo</p>
                                        )}
                                      </div>
                                      <Switch
                                        size="sm"
                                        isSelected={isSelected}
                                        isDisabled={lockedByDependencies}
                                        onValueChange={(value) => {
                                          if (lockedByDependencies) return;
                                          toggleCustomPermission(permission, value);
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
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
