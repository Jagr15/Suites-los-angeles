"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
  Tooltip,
  Chip,
} from "@heroui/react";
import { DocumentTextIcon, PencilSquareIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { Purchase } from "../hooks/use-purchases";
import { formatShortDate } from "@/shared/utils/date";

const ROWS_PER_PAGE = 8;

const columns = [
  { key: "numeroCompra", label: "No. Compra" },
  { key: "proveedor", label: "Proveedor" },
  { key: "bodega", label: "Bodega" },
  { key: "fecha", label: "Fecha" },
  { key: "recepcion", label: "Recepción" },
  { key: "estado", label: "Estado" },
  { key: "monto", label: "Monto" },
  { key: "actions", label: "Acciones" },
];

type ComprasTableProps = {
  compras: Purchase[];
  onVer?: (item: Purchase) => void;
  onVerEstadoCuenta?: (item: Purchase) => void;
  onEditar?: (item: Purchase) => void;
  onBorrar?: (item: Purchase) => void;
  canDelete?: boolean;
};

export function ComprasTable({ compras, onVer, onVerEstadoCuenta, onEditar, onBorrar, canDelete = true }: ComprasTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(compras.length / ROWS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return compras.slice(start, start + ROWS_PER_PAGE);
  }, [compras, currentPage]);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-content1 rounded-2xl border border-default-100 overflow-hidden shadow-sm">
        <Table aria-label="Tabla de compras" shadow="none" removeWrapper className="bg-transparent">
          <TableHeader>
            {columns.map((column) => (
              <TableColumn
                key={column.key}
                className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs"
                align={column.key === "monto" || column.key === "actions" ? "end" : "start"}
              >
                {column.label}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody items={paginatedRows} emptyContent="No hay compras registradas.">
            {(item) => (
              <TableRow key={item.id} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors h-10">
                <TableCell className="font-semibold text-primary text-sm">
                  {item.folio}
                </TableCell>
                <TableCell className="font-semibold text-foreground text-sm">{item.supplierName}</TableCell>
                <TableCell className="text-default-500 text-sm">{item.bodegaName}</TableCell>
                <TableCell className="text-default-500 text-sm font-normal">{formatShortDate(item.date)}</TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${item.receptionStatus === "Faltante" ? "text-danger" : "text-default-700"}`}>
                    {item.receptionStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${item.status === "Pendiente" ? "text-warning" : "text-default-700"}`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell className="text-end">
                  <span className="text-sm font-semibold text-foreground">
                    <span className="text-default-400 mr-1 text-xs">$</span>
                    {item.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip content="Ver">
                      <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => onVer?.(item)}>
                        <EyeIcon className="size-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Estado de Cuenta">
                      <Button isIconOnly size="sm" variant="light" color="secondary" onPress={() => onVerEstadoCuenta?.(item)}>
                        <DocumentTextIcon className="size-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Editar">
                      <Button isIconOnly size="sm" variant="light" color="warning" onPress={() => onEditar?.(item)}>
                        <PencilSquareIcon className="size-4" />
                      </Button>
                    </Tooltip>
                    {canDelete && (
                      <Tooltip content="Borrar">
                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onBorrar?.(item)}>
                          <TrashIcon className="size-4" />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="p-3 flex justify-center border-t border-default-50 bg-default-50/30">
            <Pagination
              showControls
              page={currentPage}
              total={totalPages}
              onChange={setPage}
              classNames={{
                cursor: "bg-primary font-bold shadow-lg shadow-primary/20",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
