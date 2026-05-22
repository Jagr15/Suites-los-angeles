"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Pagination,
} from "@heroui/react";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

const ROWS_PER_PAGE = 8;

const columns = [
  { key: "ticket", label: "TICKET" },
  { key: "hora", label: "HORA" },
  { key: "cliente", label: "CLIENTE" },
  { key: "encargado_compras", label: "ENCARGADO DE COMPRAS" },
  { key: "tipo_compra", label: "TIPO DE COMPRA" },
  { key: "monto", label: "MONTO" },
];

const initialVentas = [
  { id: "1", ruta: "001", destino: "manzanillo", ticket: "1532", hora: "12:56", cliente: "Abarrotes Morales", encargado_compras: "Adrian Morales", tipo_compra: "Contado", monto: 232 },
  { id: "2", ruta: "001", destino: "manzanillo", ticket: "1531", hora: "12:35", cliente: "Mini super don Pancho", encargado_compras: "Francisco Gonzalez", tipo_compra: "Crédito", monto: 189 },
  { id: "3", ruta: "002", destino: "colima", ticket: "1530", hora: "12:26", cliente: "Tienda del Centro", encargado_compras: "Luis Ramirez", tipo_compra: "Efectivo", monto: 69 },
  { id: "4", ruta: "002", destino: "colima", ticket: "1529", hora: "12:05", cliente: "Abarrotes Juquilita", encargado_compras: "Maria Elena", tipo_compra: "Transferencia", monto: 260 },
  { id: "5", ruta: "003", destino: "la paz", ticket: "1528", hora: "11:49", cliente: "Miscelanea El Oasis", encargado_compras: "Pedro Sanchez", tipo_compra: "Contado", monto: null },
  { id: "6", ruta: "005", destino: "tepic", ticket: "1527", hora: "11:32", cliente: "Super Mercadito", encargado_compras: "Ana Laura", tipo_compra: "Crédito", monto: null },
  { id: "7", ruta: "006", destino: "vallarta", ticket: "1526", hora: "12:21", cliente: "Bodega de la Esquina", encargado_compras: "Jorge Ruiz", tipo_compra: "Efectivo", monto: null },
  { id: "8", ruta: "009", destino: "cp constitucion", ticket: "1525", hora: "11:06", cliente: "Mini Super Rapido", encargado_compras: "Miguel Cervantes", tipo_compra: "Transferencia", monto: null },
];

export function RutasVentas({
  selectedDestination,
  selectedRouteCode,
}: {
  selectedDestination: string;
  selectedRouteCode: string;
}) {
  const [filterValue, setFilterValue] = useState("");
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    const destination = selectedDestination.toLowerCase().trim();
    let filtered = initialVentas.filter((v) => {
      if (selectedRouteCode && v.ruta === selectedRouteCode) return true;
      if (destination && v.destino === destination) return true;
      return false;
    });
    if (filterValue) {
      const q = filterValue.toLowerCase();
      filtered = filtered.filter((item) =>
        item.ticket.toLowerCase().includes(q) ||
        item.cliente.toLowerCase().includes(q) ||
        item.encargado_compras.toLowerCase().includes(q) ||
        item.tipo_compra.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [filterValue, selectedDestination, selectedRouteCode]);

  const pages = Math.ceil(filteredItems.length / ROWS_PER_PAGE) || 1;

  const items = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const onSearchChange = (value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  };

  const onClear = () => {
    setFilterValue("");
    setPage(1);
  };

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full"
            placeholder="Buscar por ticket, cliente, encargado o tipo..."
            startContent={<MagnifyingGlassIcon className="size-4 text-default-400" />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
            variant="faded"
            radius="full"
          />
          <Button isIconOnly variant="flat" radius="full" color="default" aria-label="Filter">
            <FunnelIcon className="size-5" />
          </Button>
        </div>
      </div>
    );
  }, [filterValue]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500 w-full mb-10">
      {topContent}
      <div className="bg-content1 rounded-3xl border border-default-100 overflow-hidden shadow-sm flex-1">
        <Table
          aria-label="Tabla de ventas"
          shadow="none"
          removeWrapper
          className="bg-transparent"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn 
                key={column.key} 
                className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs"
                align={column.key === "monto" ? "end" : "start"}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={items} emptyContent="No se encontraron ventas">
            {(item) => (
              <TableRow key={item.id} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors h-12">
                {(columnKey) => {
                  let content = null;
                  switch (columnKey) {
                    case "ticket":
                      content = <span className="font-semibold text-foreground text-sm">{item.ticket}</span>;
                      break;
                    case "hora":
                      content = <span className="text-default-500 text-sm font-normal">{item.hora}</span>;
                      break;
                    case "cliente":
                      content = <span className="text-default-700 text-sm font-medium">{item.cliente}</span>;
                      break;
                    case "encargado_compras":
                      content = <span className="text-default-600 text-sm">{item.encargado_compras}</span>;
                      break;
                    case "tipo_compra":
                      content = (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          item.tipo_compra === "Crédito" ? "bg-warning/10 text-warning" :
                          item.tipo_compra === "Transferencia" ? "bg-secondary/10 text-secondary" :
                          "bg-success/10 text-success"
                        }`}>
                          {item.tipo_compra}
                        </span>
                      );
                      break;
                    case "monto":
                      content = item.monto ? (
                        <span className="text-base font-semibold text-foreground">
                          <span className="text-default-400 mr-1 text-xs">$</span>
                          {item.monto}
                        </span>
                      ) : null;
                      break;
                    default:
                      content = "";
                  }
                  return <TableCell className={columnKey === "monto" ? "text-end" : ""}>{content}</TableCell>;
                }}
              </TableRow>
            )}
          </TableBody>
        </Table>

        {pages > 1 && (
          <div className="p-4 flex justify-between items-center border-t border-default-50 bg-default-50/30">
            <span className="text-small text-default-400">
              {filteredItems.length} ventas en total
            </span>
            <Pagination
              showControls
              page={page}
              total={pages}
              onChange={setPage}
              classNames={{
                cursor: "bg-primary font-bold shadow-lg shadow-primary/20",
              }}
            />
            <div className="hidden sm:flex w-[30%] justify-end gap-2"></div>
          </div>
        )}
      </div>
    </div>
  );
}
