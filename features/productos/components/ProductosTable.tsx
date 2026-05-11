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
  Input,
} from "@heroui/react";
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Product } from "../hooks/use-products";

const ROWS_PER_PAGE = 6;

const getColumnsForTab = (tab: string) => {
  let start = 0; let end = 15;
  if (tab === "costo") { start = 0; end = 5; }
  else if (tab === "mayoreo") { start = 5; end = 10; }
  else if (tab === "venta") { start = 10; end = 15; }

  return Array.from({ length: end - start }, (_, i) => ({
    key: `lista${start + i + 1}`,
    label: `Precio ${start + i + 1}`,
  }));
};

type ProductosTableProps = {
  productos: Product[];
  onVer?: (item: Product) => void;
  onEditar?: (item: Product) => void;
  onBorrar?: (item: Product) => void;
  onPriceChange?: (productId: string, field: string, value: string) => void;
  activeTab: string;
};

export function ProductosTable({ productos: rows, onVer, onEditar, onBorrar, onPriceChange, activeTab }: ProductosTableProps) {
  const columns = useMemo(() => [
    { key: "sku", label: "Sku" },
    { key: "codigo", label: "Código" },
    { key: "producto", label: "Producto" },
    { key: "cantidadEmpaque", label: "Cantidad" },
    { key: "categoria", label: "Categoría" },
    { key: "subcategoria", label: "Subcategoría" },
    { key: "status", label: "Status" },
    ...getColumnsForTab(activeTab),
    { key: "actions", label: "Acciones" },
  ], [activeTab]);

  const [page, setPage] = useState(1);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return rows.slice(start, start + ROWS_PER_PAGE);
  }, [rows, page]);

  const handleVer = (item: Product) => {
    onVer?.(item);
  };
  const handleEditar = (item: Product) => {
    onEditar?.(item);
  };
  const handleBorrar = (item: Product) => {
    onBorrar?.(item);
  };
  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <Table
        aria-label="Tabla de productos"
        classNames={{ wrapper: "shadow-sm" }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              align={
                column.key === "cantidadEmpaque" ? "center" :
                column.key.startsWith("lista") || column.key === "actions" ? "end" : "start"
              }
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={paginatedRows} emptyContent="No hay productos.">
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => {
                const colKeyStr = columnKey as string;
                let cellContent;

                if (colKeyStr === "status") {
                  const status = item.status?.toLowerCase();
                  const isInactive = status === "inactivo";
                  cellContent = (
                    <Chip size="sm" color={isInactive ? "danger" : "success"} variant="flat">
                      {item.status}
                    </Chip>
                  );
                } else if (colKeyStr === "actions") {
                  cellContent = (
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content="Ver">
                        <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => handleVer(item)} aria-label="Ver">
                          <EyeIcon className="size-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Editar">
                        <Button isIconOnly size="sm" variant="light" color="warning" onPress={() => handleEditar(item)} aria-label="Editar">
                          <PencilSquareIcon className="size-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Borrar">
                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleBorrar(item)} aria-label="Borrar">
                          <TrashIcon className="size-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  );
                } else if (colKeyStr.startsWith("lista")) {
                  const label = columns.find(c => c.key === colKeyStr)?.label || "";
                  const rawValue = (item as Record<string, string>)[colKeyStr] ?? "";
                  const numericValue = typeof rawValue === "string" ? rawValue.replace("$", "") : rawValue;
                  
                  cellContent = (
                    <Input 
                      size="sm" 
                      type="number"
                      step="0.01"
                      value={numericValue} 
                      onValueChange={(v) => onPriceChange?.(item.id, colKeyStr, v)} 
                      classNames={{ inputWrapper: "min-h-8 h-8", input: "text-end text-sm" }} 
                      aria-label={label}
                      startContent={<span className="text-default-400 text-[10px]">$</span>}
                    />
                  );
                } else {
                  cellContent = (item as any)[colKeyStr];
                }

                return (
                  <TableCell 
                    className={
                      colKeyStr === "cantidadEmpaque" ? "text-center" :
                      colKeyStr.startsWith("lista") || colKeyStr === "actions" ? "text-end" : ""
                    }
                    style={colKeyStr.startsWith("lista") ? { padding: "4px" } : {}}
                  >
                    {cellContent}
                  </TableCell>
                );
              }}
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
