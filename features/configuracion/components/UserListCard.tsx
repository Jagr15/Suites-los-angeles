"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
} from "@heroui/react";

interface UserItemProps {
  initials: string;
  name: string;
  role: string;
  colorClass: string;
}

const UserItem = ({ initials, name, role, colorClass }: UserItemProps) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-default-100 bg-default-50/50">
    <div className="flex items-center gap-3">
      <div className={`size-9 rounded-full ${colorClass} flex items-center justify-center font-bold text-sm`}>
        {initials}
      </div>
      <div>
        <p className="text-small font-semibold text-foreground">{name}</p>
        <p className="text-tiny text-default-500 font-medium">{role}</p>
      </div>
    </div>
    <Button size="sm" variant="light" className="text-primary font-semibold">
      Editar Acceso
    </Button>
  </div>
);

export function UserListCard() {
  const users = [
    { initials: "JR", name: "Jose Rodriguez", role: "Vendedor / Preventista", colorClass: "bg-primary/20 text-primary" },
    { initials: "CM", name: "Carlos Mendoza", role: "Repartidor / Conductor", colorClass: "bg-success/20 text-success" },
    { initials: "MA", name: "Maria Arevalo", role: "Bodeguero / Logística", colorClass: "bg-warning/20 text-warning" },
  ];

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-2">
        <h3 className="text-medium font-semibold text-foreground">Usuarios Activos</h3>
        <p className="text-small text-default-500">Lista de personal con acceso al sistema</p>
      </CardHeader>
      <CardBody className="px-6 pb-8">
        <div className="space-y-4">
          {users.map((u) => (
            <UserItem key={u.name} {...u} />
          ))}
        </div>
        <Button color="primary" variant="bordered" className="w-full mt-6 font-semibold">
          Crear Nuevo Usuario
        </Button>
      </CardBody>
    </Card>
  );
}
