"use client";

import { Card, CardBody, Avatar, Chip } from "@heroui/react";

const agents = [
  { name: "Ana", src: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
  { name: "Luis", src: "https://i.pravatar.cc/150?u=a04258114e29026302d" },
  { name: "María", src: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
  { name: "Carlos", src: "https://i.pravatar.cc/150?u=a042581f4e29027024d" },
];

export function DashboardAgents() {
  return (
    <Card>
      <CardBody className="gap-3 p-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">★</span>
          <h3 className="text-lg font-semibold">Cajeros</h3>
        </div>
        <p className="text-small text-default-500">
          Revisa tu equipo y su desempeño para obtener los mejores resultados.
        </p>
        <div className="flex items-center gap-2">
          {agents.map((agent) => (
            <Avatar
              key={agent.name}
              src={agent.src}
              size="sm"
              name={agent.name}
              className="ring-2 ring-background"
            />
          ))}
          <Chip size="sm" variant="flat" color="default">
            +12
          </Chip>
        </div>
      </CardBody>
    </Card>
  );
}
