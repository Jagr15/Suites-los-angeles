"use client";

import { useQuery } from "convex/react";
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useWarehouse } from "@/shared/context/warehouse-context";

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const columns = [
  { key: "folio", label: "Folio" },
  { key: "destinatario", label: "Destinatario" },
  { key: "fecha", label: "Fecha" },
  { key: "estado", label: "Estado" },
  { key: "total", label: "Total" },
];

function formatMoney(value: number) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusColor(status?: string): "success" | "warning" | "danger" | "primary" | "default" {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized || normalized === "creado") return "default";
  if (normalized.includes("entregado")) return "success";
  if (normalized.includes("en camino") || normalized.includes("enviado")) return "primary";
  if (normalized.includes("surtido") || normalized.includes("revisado") || normalized.includes("empacado")) {
    return "warning";
  }
  return "default";
}

type SalidaRecord = {
  _id: string;
  numeroSalida?: string;
  fecha?: string;
  status?: string;
  totalAmount?: number;
  destinatario?: string;
};

function TableSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between gap-3 px-5 pt-5 pb-0">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-default-200/80 animate-pulse" />
          <div className="h-3 w-56 rounded bg-default-200/60 animate-pulse" />
        </div>
        <div className="h-7 w-24 rounded-full bg-default-200/70 animate-pulse" />
      </CardHeader>
      <CardBody className="pt-2">
        <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-default-200">
          <div className="grid grid-cols-5 gap-3 border-b border-default-200 bg-default-100 px-4 py-3">
            {columns.map((column) => (
              <div key={column.key} className="h-3 rounded bg-default-200/80 animate-pulse" />
            ))}
          </div>
          <div className="divide-y divide-default-200">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid grid-cols-5 gap-3 px-4 py-4">
                {columns.map((column) => (
                  <div key={column.key} className="h-4 rounded bg-default-200/60 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function DashboardTable() {
  const { selectedWarehouseId } = useWarehouse();
  const salidas = useQuery(
    api.salidas.queries.listRecent,
    selectedWarehouseId ? { bodegaId: selectedWarehouseId as Id<"bodegas">, limit: 6 } : { limit: 6 }
  ) as SalidaRecord[] | undefined;

  if (salidas === undefined) {
    return <TableSkeleton />;
  }

  const rows = salidas;

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between gap-3 px-5 pt-5 pb-0">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">Últimas salidas</h3>
          <p className="text-tiny text-default-500">Movimientos reales del sistema</p>
        </div>
        <Chip size="sm" color="primary" variant="flat">
          {rows.length} registros
        </Chip>
      </CardHeader>
      <CardBody className="pt-2">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <Table
              aria-label="Últimas salidas"
              classNames={{
                wrapper: "shadow-none",
                th: "bg-default-100",
              }}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.key}
                    align={column.key === "total" ? "end" : "start"}
                  >
                    {column.label}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody items={rows} emptyContent="No hay salidas recientes">
                {(item) => (
                  <TableRow key={String(item._id)}>
                    {(columnKey) => {
                      if (columnKey === "folio") {
                        return <TableCell className="font-semibold text-primary">{item.numeroSalida || "Sin folio"}</TableCell>;
                      }
                      if (columnKey === "destinatario") {
                        return <TableCell className="font-medium text-foreground">{item.destinatario || "Destinatario no definido"}</TableCell>;
                      }
                      if (columnKey === "fecha") {
                        return <TableCell className="text-default-500">{formatDate(item.fecha)}</TableCell>;
                      }
                      if (columnKey === "estado") {
                        return (
                          <TableCell>
                            <Chip size="sm" color={getStatusColor(item.status)} variant="flat">
                              {String(item.status || "Creado")}
                            </Chip>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell className="text-end font-semibold text-foreground">
                          {formatMoney(Number(item.totalAmount || 0))}
                        </TableCell>
                      );
                    }}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
