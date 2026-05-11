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
import { User, PROFILES } from "./types";

interface UserModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  selectedUser: User | null;
  formState: Partial<User & { roleId?: string }>;
  setFormState: (state: Partial<User & { roleId?: string }>) => void;
  onSave: () => void;
  onClose: () => void;
  isLoading?: boolean;
  profiles: any[];
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

  const togglePermission = (key: keyof User["permissions"]) => {
    const currentPermissions = formState.permissions || {
      ventas: false,
      inventario: false,
      rutas: false,
      finanzas: false,
      configuracion: false,
    };
    setFormState({
      ...formState,
      permissions: {
        ...currentPermissions,
        [key]: !currentPermissions[key],
      },
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
                    placeholder="Selecciona un perfil"
                    variant="bordered"
                    labelPlacement="outside"
                    selectedKeys={formState.profileId ? [formState.profileId] : []}
                    onSelectionChange={(keys) => {
                      const id = Array.from(keys)[0] as string;
                      const profile = profiles?.find(p => p.id === id);
                      setFormState({ ...formState, profileId: id, profileName: profile?.fullName || "" });
                    }}
                  >
                    {(profiles || []).map((profile) => (
                      <SelectItem key={profile.id} textValue={profile.fullName}>
                        {profile.fullName}
                      </SelectItem>
                    ))}
                  </Select>
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
                      onRoleChange={(roleId, roleName) => {
                        setFormState({ ...formState, roleId, role: roleName });
                      }}
                    />
                    {formState.role === "Vendedor" && (
                      <p className="text-tiny text-warning font-medium px-1">
                        ⚠️ Los vendedores no tienen acceso a este panel web (solo app móvil).
                      </p>
                    )}
                  </div>
                </div>

                {!["SuperAdmin", "Admin"].includes(formState.role || "") ? (
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
                            onValueChange={() => togglePermission("ventas")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-small">Módulo Inventario</p>
                          <Switch
                            size="sm"
                            isSelected={formState.permissions?.inventario}
                            onValueChange={() => togglePermission("inventario")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-small">Módulo Rutas</p>
                          <Switch
                            size="sm"
                            isSelected={formState.permissions?.rutas}
                            onValueChange={() => togglePermission("rutas")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-small">Módulo Finanzas</p>
                          <Switch
                            size="sm"
                            isSelected={formState.permissions?.finanzas}
                            onValueChange={() => togglePermission("finanzas")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-small">Módulo Configuración</p>
                          <Switch
                            size="sm"
                            isSelected={formState.permissions?.configuracion}
                            onValueChange={() => togglePermission("configuracion")}
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
              <Button color="primary" onPress={onSave} isLoading={isLoading}>
                {selectedUser ? "Actualizar" : "Crear"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
