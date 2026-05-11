"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardHeader,
  CardBody,
  Chip,
} from "@heroui/react";
import { getKeyValue } from "@heroui/react";

const columns = [
  { key: "id", label: "ID" },
  { key: "producto", label: "Producto" },
  { key: "cantidad", label: "Cant." },
  { key: "total", label: "Total" },
  { key: "estado", label: "Estado" },
];

const ventas = [
  { id: "#1024", producto: "Café Americano x2", cantidad: 2, total: "$ 4.50", estado: "Completada" },
  { id: "#1023", producto: "Pan con queso", cantidad: 1, total: "$ 2.80", estado: "Completada" },
  { id: "#1022", producto: "Jugo naranja, Sandwich", cantidad: 2, total: "$ 8.20", estado: "Completada" },
  { id: "#1021", producto: "Agua 500ml x3", cantidad: 3, total: "$ 3.00", estado: "Completada" },
  { id: "#1020", producto: "Café con leche", cantidad: 1, total: "$ 3.50", estado: "Completada" },
];

export function DashboardTable() {
  return (
    <Card>
      <CardHeader className="flex justify-between pb-0">
        <h3 className="text-lg font-semibold">Últimas ventas</h3>
        <Chip size="sm" color="primary" variant="flat">
          Hoy
        </Chip>
      </CardHeader>
      <CardBody className="pt-2">
        <Table
          aria-label="Últimas ventas"
          classNames={{
            wrapper: "shadow-none",
            th: "bg-default-100",
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key} align={column.key === "total" || column.key === "cantidad" ? "end" : "start"}>
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={ventas}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>
                    {columnKey === "estado" ? (
                      <Chip size="sm" color="success" variant="flat">
                        {getKeyValue(item, columnKey)}
                      </Chip>
                    ) : (
                      getKeyValue(item, columnKey)
                    )}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
