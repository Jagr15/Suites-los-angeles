"use client";

import { Card, CardHeader, CardBody } from "@heroui/react";

export function DashboardRecentActivity() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Actividad reciente</h2>
      </CardHeader>
      <CardBody>
        <ul className="space-y-3 text-sm text-default-600">
          <li>• Venta #1024 — $ 1,250 — hace 5 min</li>
          <li>• Venta #1023 — $ 890 — hace 12 min</li>
          <li>• Producto agregado: Café Americano</li>
          <li>• Venta #1022 — $ 2,100 — hace 1 h</li>
        </ul>
      </CardBody>
    </Card>
  );
}
