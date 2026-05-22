"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Select,
  SelectItem,
  Switch,
  Button,
  addToast,
  Chip,
} from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  PERMISSION_CATALOG,
  PERMISSION_KEYS,
  sellerPermissions,
  warehousePermissions,
} from "@/shared/security/permissions";

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
  const [draftPermissions, setDraftPermissions] = useState<Set<string> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedRole = useMemo(() => {
    if (!selectedRoleId) return roles[0] || null;
    return roles.find((r) => r._id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const currentDraftPermissions = useMemo(
    () => draftPermissions ?? new Set(selectedRole?.permissions || []),
    [draftPermissions, selectedRole]
  );

  const roleScopedCatalog = useMemo(() => {
    const roleName = (selectedRole?.name || "").trim().toLowerCase();
    if (roleName === "vendedor") return sellerPermissions;
    if (roleName === "bodeguero" || roleName === "bodega") return warehousePermissions;
    return PERMISSION_CATALOG;
  }, [selectedRole]);

  const groupedCatalog = useMemo(() => {
    const map = new Map<string, typeof PERMISSION_CATALOG>();
    for (const section of SECTION_ORDER) map.set(section, []);
    for (const permission of roleScopedCatalog) {
      const current = map.get(permission.section) || [];
      current.push(permission);
      map.set(permission.section, current);
    }
    return map;
  }, [roleScopedCatalog]);
  const isFullAccessRole = useMemo(() => {
    const roleName = (selectedRole?.name || "").trim().toLowerCase();
    return roleName === "admin" || roleName === "administrador" || roleName === "superadmin" || roleName === "super admin";
  }, [selectedRole]);

  const togglePermission = (key: string, enabled: boolean) => {
    setDraftPermissions((prev) => {
      const next = new Set(prev ?? selectedRole?.permissions ?? []);
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
      const payload = Array.from(new Set([...nonCatalog, ...Array.from(currentDraftPermissions)]));
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
    <Card className="border border-default-200 shadow-sm bg-content1 min-w-0 overflow-hidden">
      <CardBody className="px-3 sm:px-5 lg:px-6 pb-4 lg:pb-5 overflow-hidden">
        <div className="w-full max-w-[1120px] mx-auto space-y-4 lg:space-y-5 min-w-0">
          <div className="sticky top-0 z-10 bg-content1 pt-1 pb-3 border-b border-default-200/70">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-base md:text-medium font-semibold text-foreground leading-tight">
                Gestión de Roles y Permisos
              </h3>
              <p className="text-xs md:text-small text-default-500">Configuración granular por rol/perfil</p>
            </div>

              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2 sm:items-end lg:justify-end">
                <div className="w-full sm:w-[300px]">
                <Select
                  label="Seleccionar rol"
                  labelPlacement="outside"
                  size="sm"
                  variant="bordered"
                  selectedKeys={selectedRole ? [selectedRole._id] : []}
                  onSelectionChange={(keys) => {
                    const selectedKeys = keys === "all" ? [] : Array.from(keys);
                    setSelectedRoleId((selectedKeys[0] as string) || null);
                    setDraftPermissions(null);
                  }}
                >
                  {roles.map((role) => (
                    <SelectItem key={role._id} textValue={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
                <div className="flex gap-2 sm:gap-2.5">
                  <Button size="sm" variant="flat" color="default" className="font-semibold px-4" onPress={handleReset}>
                    Restaurar defaults
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    className="font-semibold px-4"
                    radius="md"
                    onPress={handleSave}
                    isLoading={isSaving}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {!selectedRole ? (
            <p className="text-default-500 text-sm">No hay roles disponibles.</p>
          ) : isFullAccessRole ? (
            <div className="rounded-lg border border-success-200 bg-success-50/60 px-4 py-3">
              <p className="text-sm font-semibold text-success-700">Este rol tiene acceso completo al sistema.</p>
              <p className="text-xs text-success-700/80 mt-0.5">
                Los permisos individuales no se muestran porque no requieren configuración manual.
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-260px)] overflow-y-auto overflow-x-hidden pr-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-3.5 items-start min-w-0">
                {SECTION_ORDER.map((section) => {
                  const permissions = groupedCatalog.get(section) || [];
                  if (permissions.length === 0) return null;
                  return (
                    <Card
                      key={section}
                      className="border border-default-200/80 bg-content2 shadow-none h-full min-w-0"
                    >
                      <CardHeader className="pb-1.5 pt-2.5 px-3 min-h-9 border-b border-default-200/70">
                        <p className="text-xs font-semibold text-primary tracking-tight">{section}</p>
                      </CardHeader>
                      <CardBody className="px-2 py-2.5">
                        <div className="space-y-1.5">
                          {permissions.map((permission) => {
                            const selectedRaw = currentDraftPermissions.has(permission.key);
                            const selected = permission.inverse ? !selectedRaw : selectedRaw;
                            return (
                              <div
                                key={permission.key}
                                className="flex items-center justify-between gap-2 rounded-md border border-default-100 bg-content1 px-2 py-1.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="text-xs md:text-sm text-foreground leading-snug truncate">
                                      {permission.label}
                                    </p>
                                    {!permission.implemented && (
                                      <Chip
                                        size="sm"
                                        radius="sm"
                                        variant="flat"
                                        color="warning"
                                        className="h-4.5 px-1 text-[10px] shrink-0"
                                      >
                                        Pendiente
                                      </Chip>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 ml-1">
                                  <Switch
                                    size="sm"
                                    color={permission.sensitive ? "danger" : "primary"}
                                    isSelected={selected}
                                    onValueChange={(value) => {
                                      const nextRaw = permission.inverse ? !value : value;
                                      togglePermission(permission.key, nextRaw);
                                    }}
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
        </div>
      </CardBody>
    </Card>
  );
}
