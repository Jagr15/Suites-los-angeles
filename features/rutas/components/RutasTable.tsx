"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Pagination,
  Button,
  Tooltip,
} from "@heroui/react";
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { RutaRow } from "@/shared/mocks";

const ROWS_PER_PAGE = 6;

const TIPO_LABELS: Record<string, string> = {
  sucursal: "Entrega a sucursal",
  envio: "Envío",
};

const columns = [
  { key: "ruta", label: "Ruta" },
  { key: "destino", label: "Destino" },
  { key: "responsable", label: "Responsable" },
  { key: "tipoEntrega", label: "Tipo de entrega" },
  { key: "status", label: "Estado" },
  { key: "actions", label: "Acciones" },
];

type RutasTableProps = {
  items: RutaRow[];
  onVer?: (item: RutaRow) => void;
  onEditar?: (item: RutaRow) => void;
  onBorrar?: (item: RutaRow) => void;
};

function statusColor(status: string): "success" | "warning" | "default" | "primary" {
  if (status === "Entregado") return "success";
  if (status.includes("Listo")) return "primary";
  if (status === "En Camino") return "warning";
  return "default";
}

export function RutasTable({ items, onVer, onEditar, onBorrar }: RutasTableProps) {
  const [page, setPage] = useState(1);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return items.slice(start, start + ROWS_PER_PAGE);
  }, [items, page]);

  const totalPages = Math.ceil(items.length / ROWS_PER_PAGE);

  const handleVer = (item: RutaRow) => onVer?.(item);
  const handleEditar = (item: RutaRow) => onEditar?.(item);
  const handleBorrar = (item: RutaRow) => onBorrar?.(item);

  return (
    <div className="flex flex-col gap-4">
      <Table aria-label="Tabla de rutas" classNames={{ wrapper: "shadow-sm" }}>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} align={column.key === "actions" ? "end" : "start"}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={paginatedRows} emptyContent="No hay rutas.">
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>{item.ruta}</TableCell>
              <TableCell>{item.destino}</TableCell>
              <TableCell>{item.responsable}</TableCell>
              <TableCell>
                {TIPO_LABELS[item.tipoEntrega ?? "sucursal"]}
              </TableCell>
              <TableCell>
                <Chip size="sm" color={statusColor(item.status)} variant="flat">
                  {item.status}
                </Chip>
              </TableCell>
              <TableCell className="text-end">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip content="Ver">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => handleVer(item)}
                      aria-label="Ver"
                    >
                      <EyeIcon className="size-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Editar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="warning"
                      onPress={() => handleEditar(item)}
                      aria-label="Editar"
                    >
                      <PencilSquareIcon className="size-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Borrar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleBorrar(item)}
                      aria-label="Borrar"
                    >
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
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg bg-gray-200 px-3 py-2 dark:bg-gray-800">
            <Pagination
              showControls
              page={page}
              total={totalPages}
              onChange={setPage}
              classNames={{ cursor: "bg-primary" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
