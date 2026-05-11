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
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Supplier } from "@/features/configuracion/components/suppliers/types";

const ROWS_PER_PAGE = 6;

const columns = [
  { key: "proveedor", label: "Proveedor / RFC" },
  { key: "credito", label: "Días Crédito" },
  { key: "actions", label: "Acciones" },
];

type ProveedoresTableProps = {
  onNuevaCompra?: (supplier: Supplier) => void;
  onEditar?: (supplier: Supplier) => void;
};

export function ProveedoresTable({ onNuevaCompra, onEditar }: ProveedoresTableProps) {
  const [page, setPage] = useState(1);
  const convexSuppliers = useQuery(api.suppliers.queries.list);

  const suppliers = useMemo(() => {
    return (convexSuppliers || []).map(s => ({
      ...s,
      id: s._id as string,
    })) as Supplier[];
  }, [convexSuppliers]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return suppliers.slice(start, start + ROWS_PER_PAGE);
  }, [suppliers, page]);

  const totalPages = Math.ceil(suppliers.length / ROWS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <Table aria-label="Tabla de proveedores" classNames={{ wrapper: "shadow-sm" }}>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} align={column.key === "monto" || column.key === "actions" ? "end" : "start"}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={paginatedRows} emptyContent={convexSuppliers === undefined ? "Cargando..." : "No hay proveedores."}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-small font-semibold">{item.businessName}</span>
                  <span className="text-tiny text-default-400">{item.rfc}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                   <span className="text-small">{item.creditDays} Días</span>
                </div>
              </TableCell>
              <TableCell className="text-end">
                <div className="flex items-center justify-end gap-2">
                  <Tooltip content="Nueva Compra">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="success"
                      onPress={() => onNuevaCompra?.(item)}
                    >
                      <PlusIcon className="size-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Editar Base">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => onEditar?.(item)}
                    >
                      <PencilSquareIcon className="size-4" />
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
