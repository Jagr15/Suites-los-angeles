"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
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
  Select,
  SelectItem,
} from "@heroui/react";
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Product } from "../hooks/use-products";

const ROWS_PER_PAGE_OPTIONS = [10, 15, 20, 25, 30, 50] as const;
const DEFAULT_ROWS_PER_PAGE = 15;

const getColumnsForTab = (tab: string) => {
  return [
    {
      key: tab === "venta" ? "lista11" : "lista1",
      label: tab === "venta" ? "Venta" : "Costo",
    },
  ];
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
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, currentPage, rowsPerPage]);

  const startItem = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = totalRows === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalRows);

  const handleVer = (item: Product) => {
    onVer?.(item);
  };
  const handleEditar = (item: Product) => {
    onEditar?.(item);
  };
  const handleBorrar = (item: Product) => {
    onBorrar?.(item);
  };
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-default-100 bg-content1 p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            {totalRows} productos encontrados
          </p>
          <p className="text-xs text-default-500">
            Mostrando {startItem}-{endItem} de {totalRows}
          </p>
        </div>

        <div className="w-full md:w-56">
          <Select
            label="Mostrar"
            size="sm"
            variant="bordered"
            selectedKeys={[String(rowsPerPage)]}
            onSelectionChange={(keys) => {
              const next = Number(Array.from(keys)[0]);
              if (!Number.isFinite(next)) return;
              setRowsPerPage(next);
              setPage(1);
            }}
            classNames={{
              trigger: "h-11",
              value: "font-semibold",
            }}
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <SelectItem key={String(option)} textValue={String(option)}>
                {option}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-default-100">
        <Table
          aria-label="Tabla de productos"
          removeWrapper
          shadow="none"
          className="min-w-[1520px] bg-transparent"
          classNames={{
            wrapper: "bg-transparent",
          }}
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
                  `${column.key === "sku" ? "w-[120px]" :
                  column.key === "codigo" ? "w-[120px]" :
                  column.key === "producto" ? "w-[260px]" :
                  column.key === "cantidadEmpaque" ? "w-[120px]" :
                  column.key === "categoria" ? "w-[180px]" :
                  column.key === "subcategoria" ? "w-[180px]" :
                  column.key === "status" ? "w-[120px]" :
                  column.key.startsWith("lista") ? "w-[150px]" :
                  "w-[140px]"} h-11 bg-default-50 text-[11px] font-semibold uppercase tracking-wider text-default-500`.trim()
                }
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={paginatedRows} emptyContent="No hay productos.">
            {(item) => (
              <TableRow key={item.id} className="h-12 border-b border-default-50 hover:bg-default-50/60 transition-colors">
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
                        type="number"
                        step="0.01"
                        value={numericValue} 
                        onValueChange={(v) => onPriceChange?.(item.id, colKeyStr, v)} 
                        classNames={{
                          base: "w-full min-w-[140px]",
                          inputWrapper: "min-h-11 h-11 min-w-[140px] px-3",
                          input: "text-end text-sm font-medium tabular-nums",
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
                          ? "whitespace-nowrap py-3"
                          : ""
                      }
                      style={
                        colKeyStr.startsWith("lista")
                          ? { padding: "6px", minWidth: "140px" }
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
        <div className="flex flex-col gap-3 border-t border-default-100 pt-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs text-default-500">
            Página {currentPage} de {totalPages}
          </p>
          <div className="inline-flex justify-end rounded-lg bg-default-100 px-3 py-2">
            <Pagination
              showControls
              page={currentPage}
              total={totalPages}
              onChange={setPage}
              classNames={{
                cursor: "bg-primary font-semibold shadow-lg shadow-primary/20",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
