"use client";

import { useMemo } from "react";
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
  { key: "proveedor", label: "Proveedor" },
  { key: "fecha", label: "Fecha" },
  { key: "estado", label: "Estado" },
  { key: "monto", label: "Monto" },
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
  if (!normalized || normalized === "pendiente") return "warning";
  if (normalized === "pagado") return "success";
  if (normalized === "cancelado") return "danger";
  if (normalized === "vencido") return "warning";
  return "default";
}

type PurchaseRecord = {
  _id: string;
  folio?: string;
  date?: string;
  status?: string;
  totalAmount?: number;
  supplierName?: string;
};

export function DashboardRecentEntries() {
  const { selectedWarehouseId } = useWarehouse();
  const purchases = useQuery(
    api.purchases.queries.list,
    selectedWarehouseId ? { bodegaId: selectedWarehouseId as Id<"bodegas"> } : {}
  ) as PurchaseRecord[] | undefined;

  const rows = useMemo(() => (purchases ?? []).slice(0, 6), [purchases]);
  const isLoading = purchases === undefined;

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between gap-3 pb-0">
        <div>
          <h3 className="text-lg font-semibold">Entradas recientes</h3>
          <p className="text-tiny text-default-500">Compras y recepciones reales</p>
        </div>
        <Chip size="sm" color="success" variant="flat">
          {rows.length} registros
        </Chip>
      </CardHeader>
      <CardBody className="pt-2">
        <Table
          aria-label="Entradas recientes"
          classNames={{
            wrapper: "shadow-none",
            th: "bg-default-100",
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                align={column.key === "monto" ? "end" : "start"}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={rows}
            emptyContent={isLoading ? "Cargando entradas..." : "No hay entradas recientes"}
          >
            {(item) => (
              <TableRow key={String(item._id)}>
                {(columnKey) => {
                  if (columnKey === "folio") {
                    return <TableCell className="font-semibold text-primary">{item.folio || "Sin folio"}</TableCell>;
                  }
                  if (columnKey === "proveedor") {
                    return (
                      <TableCell className="font-medium text-foreground">
                        {item.supplierName || "Proveedor desconocido"}
                      </TableCell>
                    );
                  }
                  if (columnKey === "fecha") {
                    return <TableCell className="text-default-500">{formatDate(item.date)}</TableCell>;
                  }
                  if (columnKey === "estado") {
                    return (
                      <TableCell>
                        <Chip size="sm" color={getStatusColor(item.status)} variant="flat">
                          {String(item.status || "Pendiente")}
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
      </CardBody>
    </Card>
  );
}
