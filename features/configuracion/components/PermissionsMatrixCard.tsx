"use client";

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
} from "@heroui/react";

interface PermissionGroupProps {
  title: string;
  permissions: { name: string; defaultSelected?: boolean; isDanger?: boolean }[];
}

const PermissionGroup = ({ title, permissions }: PermissionGroupProps) => (
  <div className="space-y-4">
    <p className="text-sm font-semibold text-primary">{title}</p>
    <div className="space-y-3">
      {permissions.map((p) => (
        <div key={p.name} className="flex items-center justify-between">
          <p className="text-small text-foreground">{p.name}</p>
          <Switch 
            defaultSelected={p.defaultSelected} 
            size="sm" 
            color={p.isDanger ? "danger" : "primary"} 
          />
        </div>
      ))}
    </div>
  </div>
);

export function PermissionsMatrixCard() {
  const modules = [
    {
      title: "Módulo Ventas",
      permissions: [
        { name: "Realizar Pedidos", defaultSelected: true },
        { name: "Aplicar Descuentos" },
        { name: "Anular Facturas", isDanger: true },
        { name: "Ver Historial Total", defaultSelected: true },
      ],
    },
    {
      title: "Módulo Inventario",
      permissions: [
        { name: "Ver Existencias", defaultSelected: true },
        { name: "Ajuste de Stock" },
        { name: "Crear Productos" },
        { name: "Traslados Bodega" },
      ],
    },
    {
      title: "Módulo Rutas",
      permissions: [
        { name: "Iniciar Recorrido", defaultSelected: true },
        { name: "Cerrar Ruta", defaultSelected: true },
        { name: "Registrar Gastos", defaultSelected: true },
        { name: "Modificar Clientes" },
      ],
    },
    {
      title: "Módulo Sistema",
      permissions: [
        { name: "Ver Dashboard", defaultSelected: true },
        { name: "Exportar Reportes" },
        { name: "Configuración DIAN", isDanger: true },
        { name: "Gestionar Usuarios", isDanger: true },
      ],
    },
  ];

  const handleSave = () => {
    addToast({
      title: "Permisos Actualizados",
      description: "Los privilegios del rol han sido guardados exitosamente.",
      color: "success",
      variant: "flat",
    });
  };

  const handleReset = () => {
    addToast({
      title: "Valores Restaurados",
      description: "Se han recuperado los permisos por defecto del sistema.",
      color: "warning",
      variant: "flat",
    });
  };

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-2">
        <h3 className="text-medium font-semibold text-foreground">Gestión de Roles y Permisos</h3>
        <p className="text-small text-default-500">Define qué puede hacer cada perfil en el sistema</p>
      </CardHeader>
      <CardBody className="px-6 pb-8 space-y-8">
        <div className="max-w-md">
          <Select
            label="Seleccionar Rol para Configurar"
            placeholder="Admin"
            labelPlacement="outside"
            variant="bordered"
            defaultSelectedKeys={["vendedor"]}
          >
            <SelectItem key="admin" textValue="Administrador Total">Administrador Total</SelectItem>
            <SelectItem key="vendedor" textValue="Vendedor / Preventista">Vendedor / Preventista</SelectItem>
            <SelectItem key="bodeguero" textValue="Bodeguero / Logística">Bodeguero / Logística</SelectItem>
            <SelectItem key="repartidor" textValue="Repartidor / Conductor">Repartidor / Conductor</SelectItem>
          </Select>
        </div>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {modules.map((m) => (
            <PermissionGroup key={m.title} title={m.title} permissions={m.permissions} />
          ))}
        </div>

        <Divider />

        <div className="flex justify-end gap-3 mt-4">
          <Button 
            variant="flat" 
            color="default" 
            className="font-semibold px-6"
            onPress={handleReset}
          >
            Restaurar Valores
          </Button>
          <Button 
            color="primary" 
            className="font-semibold px-6" 
            radius="md"
            onPress={handleSave}
          >
            Guardar Permisos del Rol
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
