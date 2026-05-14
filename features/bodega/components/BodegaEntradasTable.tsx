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
} from "@heroui/react";
import { EyeIcon, PencilSquareIcon, TrashIcon, ArrowRightCircleIcon, CheckIcon } from "@heroicons/react/24/outline";
import type { BodegaRow } from "@/shared/mocks";

const ROWS_PER_PAGE = 8;

const columns = [
  { key: "folio", label: "No. Entrada" },
  { key: "proveedor", label: "Proveedor" },
  { key: "fecha", label: "Fecha" },
  { key: "recepcion", label: "Recepción" },
  { key: "status", label: "Estado" },
  { key: "monto", label: "Monto" },
  { key: "actions", label: "Acciones" },
];

type BodegaEntradasTableProps = {
  items: BodegaRow[];
  onVer?: (item: BodegaRow) => void;
  onEditar?: (item: BodegaRow) => void;
  onBorrar?: (item: BodegaRow) => void;
  onPasarASalida?: (item: BodegaRow) => void;
  onAvanzarEstado?: (item: BodegaRow) => void;
};

export function BodegaEntradasTable({ 
  items, 
  onVer, 
  onEditar, 
  onBorrar, 
  onPasarASalida,
  onAvanzarEstado 
}: BodegaEntradasTableProps) {
  const [page, setPage] = useState(1);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return items.slice(start, start + ROWS_PER_PAGE);
  }, [items, page]);

  const totalPages = Math.ceil(items.length / ROWS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-content1 rounded-2xl border border-default-100 overflow-hidden shadow-sm">
        <Table aria-label="Tabla de entradas" shadow="none" removeWrapper className="bg-transparent">
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
          <TableBody items={paginatedRows} emptyContent="No hay registros registrados.">
            {(item: any) => (
              <TableRow key={item._id} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors h-10">
                <TableCell className="font-semibold text-primary text-sm">
                  {item.folio || `ENT-${item._id.toString().slice(-4)}`}
                </TableCell>
                <TableCell className="font-semibold text-foreground text-sm">
                  {item.supplierName || "Desconocido"}
                </TableCell>
                <TableCell className="text-default-500 text-sm font-normal">
                  {item.date}
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${item.receptionStatus === "Faltante" ? "text-danger" : "text-default-700"}`}>
                    {item.receptionStatus || "Completa"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${item.status === "Cancelado" ? "text-danger" : "text-default-700"}`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell className="text-end">
                  <span className="text-sm font-semibold text-foreground">
                    <span className="text-default-400 mr-1 text-xs">$</span>
                    {item.totalAmount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
                  </span>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip content="Ver">
                      <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => onVer?.(item)}>
                        <EyeIcon className="size-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Editar">
                      <Button isIconOnly size="sm" variant="light" color="warning" onPress={() => onEditar?.(item)}>
                        <PencilSquareIcon className="size-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Mover a Salida">
                      <Button isIconOnly size="sm" variant="light" color="success" onPress={() => onPasarASalida?.(item)}>
                        <ArrowRightCircleIcon className="size-4" />
                      </Button>
                    </Tooltip>
                    {(item.receptionStatus === "Pendiente" || !item.receptionStatus) && (
                      <Tooltip content="Marcar como Completa">
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="flat" 
                          color="success" 
                          className="bg-success/10"
                          onPress={() => onAvanzarEstado?.(item)}
                        >
                          <CheckIcon className="size-4" />
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip content="Borrar">
                      <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onBorrar?.(item)}>
                        <TrashIcon className="size-4" />
                      </Button>
                    </Tooltip>
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
              page={page}
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
