"use client";

import type { ReactNode } from "react";
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
  canEditPrices?: boolean;
};

export function ProductosTable({ productos: rows, onVer, onEditar, onBorrar, onPriceChange, activeTab, canEditPrices = true }: ProductosTableProps) {
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
      <div className="w-full overflow-x-auto rounded-2xl">
        <Table
          aria-label="Tabla de productos"
          classNames={{ wrapper: "shadow-sm min-w-[1360px]" }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                align={
                  column.key === "cantidadEmpaque" ? "center" :
                  column.key.startsWith("lista") || column.key === "actions" ? "end" : "start"
                }
                className={
                  column.key === "sku" ? "w-[120px]" :
                  column.key === "codigo" ? "w-[120px]" :
                  column.key === "producto" ? "w-[260px]" :
                  column.key === "cantidadEmpaque" ? "w-[110px]" :
                  column.key === "categoria" ? "w-[180px]" :
                  column.key === "subcategoria" ? "w-[180px]" :
                  column.key === "status" ? "w-[120px]" :
                  column.key.startsWith("lista") ? "w-[132px]" :
                  "w-[140px]"
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
                        classNames={{ 
                          base: "w-full min-w-[116px]",
                          inputWrapper: "min-h-10 h-10 min-w-[116px] px-2",
                          input: "text-end text-sm tabular-nums",
                        }} 
                        aria-label={label}
                        startContent={<span className="text-default-400 text-[10px] shrink-0">$</span>}
                        isDisabled={!canEditPrices}
                      />
                    );
                  } else {
                  cellContent = ((item as Record<string, unknown>)[colKeyStr] ?? "") as ReactNode;
                  }

                  return (
                    <TableCell 
                      className={
                        colKeyStr === "sku" || colKeyStr === "codigo" || colKeyStr === "producto" || colKeyStr === "categoria" || colKeyStr === "subcategoria"
                          ? "whitespace-nowrap"
                          : ""
                      }
                      style={
                        colKeyStr.startsWith("lista")
                          ? { padding: "4px", minWidth: "116px" }
                          : colKeyStr === "actions"
                            ? { minWidth: "132px" }
                            : colKeyStr === "producto"
                              ? { minWidth: "260px" }
                              : undefined
                      }
                    >
                      {cellContent}
                    </TableCell>
                  );
                }}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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
