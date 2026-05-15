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
      <CardBody className="px-6 pb-8 space-y-8">
        <div className="max-w-md">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {SECTION_ORDER.map((section) => {
              const permissions = groupedCatalog.get(section) || [];
              if (permissions.length === 0) return null;
              return (
                <div key={section} className="space-y-4">
                  <p className="text-sm font-semibold text-primary">{section}</p>
                  <div className="space-y-3">
                    {permissions.map((permission) => {
                      const selected = draftPermissions.has(permission.key);
                      return (
                        <div key={permission.key} className="flex items-center justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <p className="text-small text-foreground leading-tight">{permission.label}</p>
                            <div className="flex gap-2">
                              <Chip size="sm" variant="flat" color="default">{permission.key}</Chip>
                              {!permission.implemented && (
                                <Chip size="sm" variant="flat" color="warning">Pendiente de aplicación</Chip>
                              )}
                            </div>
                          </div>
                          <Switch
                            size="sm"
                            color={permission.sensitive ? "danger" : "primary"}
                            isSelected={selected}
                            onValueChange={(value) => togglePermission(permission.key, value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Divider />

        <div className="flex justify-end gap-3 mt-4">
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
