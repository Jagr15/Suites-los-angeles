"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Select,
  SelectItem,
  Divider,
  Switch,
  Button,
  addToast,
  Chip,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_PERMISSIONS_BY_ROLE, PERMISSION_CATALOG, PERMISSION_KEYS } from "@/shared/security/permissions";

type RoleName = "SuperAdmin" | "Admin" | "Bodeguero" | "Vendedor";

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

export function PermissionsMatrixCard() {
  const roles = useQuery(api.roles.queries.listAll) || [];
  const updateRole = useMutation(api.roles.mutations.update);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const selectedRole = useMemo(() => {
    if (!selectedRoleId) return roles[0] || null;
    return roles.find((r) => r._id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (!selectedRole) return;
    setDraftPermissions(new Set(selectedRole.permissions || []));
  }, [selectedRole]);

  const groupedCatalog = useMemo(() => {
    const map = new Map<string, typeof PERMISSION_CATALOG>();
    for (const section of SECTION_ORDER) map.set(section, []);
    for (const permission of PERMISSION_CATALOG) {
      const current = map.get(permission.section) || [];
      current.push(permission);
      map.set(permission.section, current);
    }
    return map;
  }, []);

  const togglePermission = (key: string, enabled: boolean) => {
    setDraftPermissions((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const currentPermissions = selectedRole.permissions || [];
      const nonCatalog = currentPermissions.filter((p) => !PERMISSION_KEYS.has(p));
      const payload = Array.from(new Set([...nonCatalog, ...Array.from(draftPermissions)]));
      await updateRole({
        id: selectedRole._id,
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: payload,
      });
      addToast({
        title: "Permisos actualizados",
        description: `Se guardaron permisos para ${selectedRole.name}.`,
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudieron guardar los permisos.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!selectedRole) return;
    const roleName = selectedRole.name as RoleName;
    const defaults = DEFAULT_PERMISSIONS_BY_ROLE[roleName] || [];
    setDraftPermissions(new Set(defaults));
    addToast({
      title: "Valores restaurados",
      description: `Se cargaron defaults seguros para ${selectedRole.name}.`,
      color: "warning",
    });
  };

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-2">
        <h3 className="text-medium font-semibold text-foreground">Gestión de Roles y Permisos</h3>
        <p className="text-small text-default-500">Configuración granular por rol/perfil</p>
      </CardHeader>
      <CardBody className="px-4 md:px-6 pb-6 md:pb-8 space-y-6 md:space-y-8 overflow-x-hidden">
        <div className="w-full max-w-xl">
          <Select
            label="Seleccionar Rol para Configurar"
            labelPlacement="outside"
            variant="bordered"
            selectedKeys={selectedRole ? [selectedRole._id] : []}
            onSelectionChange={(keys) => {
              const selectedKeys = keys === "all" ? [] : Array.from(keys);
              setSelectedRoleId((selectedKeys[0] as string) || null);
            }}
          >
            {roles.map((role) => (
              <SelectItem key={role._id} textValue={role.name}>
                {role.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Divider />

        {!selectedRole ? (
          <p className="text-default-500 text-sm">No hay roles disponibles.</p>
        ) : (
          <div className="w-full max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-5 items-start">
            {SECTION_ORDER.map((section) => {
              const permissions = groupedCatalog.get(section) || [];
              if (permissions.length === 0) return null;
              return (
                <Card
                  key={section}
                  className="border border-default-200/80 bg-content2 shadow-none h-full min-w-0"
                >
                  <CardHeader className="pb-2 pt-4 px-4 md:px-5 min-h-14 border-b border-default-200/70">
                    <p className="text-sm font-semibold text-primary tracking-tight">{section}</p>
                  </CardHeader>
                  <CardBody className="px-3 md:px-4 py-3 md:py-4">
                    <div className="space-y-2">
                    {permissions.map((permission) => {
                      const selected = draftPermissions.has(permission.key);
                      return (
                        <div
                          key={permission.key}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-lg border border-default-100 bg-content1 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex flex-col gap-1.5">
                            <p className="text-sm text-foreground leading-snug break-words">{permission.label}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Chip size="sm" radius="sm" variant="flat" color="default" className="max-w-full">
                                <span className="truncate">{permission.key}</span>
                              </Chip>
                              {!permission.implemented && (
                                <Chip size="sm" radius="sm" variant="flat" color="warning">
                                  Pendiente de aplicación
                                </Chip>
                              )}
                            </div>
                          </div>
                          <div className="pt-0.5">
                            <Switch
                              size="sm"
                              color={permission.sensitive ? "danger" : "primary"}
                              isSelected={selected}
                              onValueChange={(value) => togglePermission(permission.key, value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
            </div>
          </div>
        )}

        <Divider />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2">
          <Button variant="flat" color="default" className="font-semibold px-6" onPress={handleReset}>
            Restaurar Defaults
          </Button>
          <Button color="primary" className="font-semibold px-6" radius="md" onPress={handleSave} isLoading={isSaving}>
            Guardar Permisos del Rol
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
