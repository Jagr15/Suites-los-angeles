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
import { RoleSelect } from "./RoleSelect";
import { User } from "./types";

const ROLE_PERMISSIONS: Record<string, User["permissions"]> = {
  administrador: { ventas: true, inventario: true, rutas: true, finanzas: true, configuracion: true },
  admin: { ventas: true, inventario: true, rutas: true, finanzas: true, configuracion: true },
  superadmin: { ventas: true, inventario: true, rutas: true, finanzas: true, configuracion: true },
  "super admin": { ventas: true, inventario: true, rutas: true, finanzas: true, configuracion: true },
  vendedor: { ventas: true, inventario: false, rutas: false, finanzas: false, configuracion: false },
  bodeguero: { ventas: false, inventario: true, rutas: true, finanzas: false, configuracion: false },
  bodega: { ventas: false, inventario: true, rutas: true, finanzas: false, configuracion: false },
};

const mapRolePermissionsToUi = (permissions: string[]): User["permissions"] => {
  const has = (keys: string[]) => permissions.includes("all") || keys.some((k) => permissions.includes(k));
  return {
    ventas: has(["sales:view", "sales:edit"]),
    inventario: has(["inventory:view", "inventory:edit", "warehouse:view"]),
    rutas: has(["routes:view"]),
    finanzas: has(["finances:view"]),
    configuracion: has(["settings:view", "users:view", "users:edit"]),
  };
};

const hasAnyEnabled = (permissions: User["permissions"]) =>
  permissions.ventas ||
  permissions.inventario ||
  permissions.rutas ||
  permissions.finanzas ||
  permissions.configuracion;

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
  formState: Partial<User & { roleId?: string }>;
  setFormState: React.Dispatch<React.SetStateAction<Partial<User & { roleId?: string }>>>;
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
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const hasProfiles = profiles.length > 0;
  const isAdminRole = (formState.role || "").trim().toLowerCase() === "administrador";

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
                    value={(formState as any).password || ""}
                    onValueChange={(v) => setFormState({ ...formState, password: v } as any)}
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
                      onRoleChange={(roleId, roleName, rolePermissions) => {
                        const mappedPermissions = mapRolePermissionsToUi(rolePermissions || []);
                        const normalizedRole = normalizeRoleKey(roleName);
                        const fallbackPermissions = ROLE_PERMISSIONS[normalizedRole];
                        const usingFallback = !hasAnyEnabled(mappedPermissions);
                        setFormState((prev) => ({
                          ...prev,
                          roleId,
                          role: roleName,
                          permissions: !usingFallback
                            ? mappedPermissions
                            : fallbackPermissions || prev.permissions,
                        }));
                      }}
                    />
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
                        Permisos por Módulo
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-small">Módulo Ventas</p>
                          <Switch
                            size="sm"
                            isSelected={formState.permissions?.ventas}
                            isDisabled
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-small">Módulo Inventario</p>
                          <Switch
                            size="sm"
                            isSelected={formState.permissions?.inventario}
                            isDisabled
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-small">Módulo Rutas</p>
                          <Switch
                            size="sm"
                            isSelected={formState.permissions?.rutas}
                            isDisabled
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-small">Módulo Finanzas</p>
                          <Switch
                            size="sm"
                            isSelected={formState.permissions?.finanzas}
                            isDisabled
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-small">Módulo Configuración</p>
                          <Switch
                            size="sm"
                            isSelected={formState.permissions?.configuracion}
                            isDisabled
                          />
                        </div>
                      </div>
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
