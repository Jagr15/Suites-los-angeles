"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Button,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { ArrowLeftIcon, PrinterIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { EstadoCuentaRow } from "@/shared/mocks";

type EstadoCuentaViewProps = {
  estadoCuenta: EstadoCuentaRow;
  onBack: () => void;
  onProviderChange?: (supplierId: string) => void;
};

type MovimientoDetalle = {
  id: string;
  tipo: "Compra" | "Pago";
  fecha: string;
  detalle1: string;
  detalle2: string;
  monto: number;
  isNegative?: boolean;
  statusColor?: "success" | "danger" | "default";
};

export function EstadoCuentaView({ estadoCuenta, onBack, onProviderChange }: EstadoCuentaViewProps) {
  const suppliers = useQuery(api.suppliers.queries.list);
  
  const selectedSupplier = useMemo(() => {
    return (suppliers || []).find((s) => s._id === estadoCuenta.id);
  }, [suppliers, estadoCuenta.id]);

  const transactions = useQuery(
    api.supplierTransactions.queries.listBySupplier,
    selectedSupplier ? { supplierId: selectedSupplier._id } : "skip"
  );

  const purchases = useQuery(
    api.purchases.queries.listBySupplier,
    selectedSupplier ? { supplierId: selectedSupplier._id } : "skip"
  );

  const stats = useMemo(() => {
    if (!purchases || purchases.length === 0) return { totalDebt: 0, pendingAmount: 0, expiredAmount: 0 };
    
    return purchases.reduce((acc, p) => {
      // Usar remainingAmount si existe, si no, usar totalAmount como fallback para registros antiguos
      const remaining = p.remainingAmount !== undefined ? p.remainingAmount : p.totalAmount;
      
      // Solo sumar si no está Pagado ni Cancelado
      if (p.status !== "Pagado" && p.status !== "Cancelado") {
        acc.totalDebt += remaining;
        
        if (p.status === "Vencido") {
          acc.expiredAmount += remaining;
        } else {
          // Todo lo que no sea Vencido, Pagado o Cancelado cuenta como pendiente
          acc.pendingAmount += remaining;
        }
      }
      return acc;
    }, { totalDebt: 0, pendingAmount: 0, expiredAmount: 0 });
  }, [purchases]);

  const displayMovimientos = useMemo(() => {
    if (!transactions) return [];
    return transactions.map(t => ({
      id: t._id,
      tipo: t.type === "Cargo" ? "Compra" : "Pago",
      fecha: t.date,
      detalle1: t.category || "-",
      detalle2: t.status,
      monto: t.amount,
      isNegative: t.type === "Cargo",
      statusColor: t.status === "Revisar" ? "danger" : t.status === "Confirmado" ? "default" : "default"
    })) as MovimientoDetalle[];
  }, [transactions]);

  return (
    <div className="flex flex-col bg-default-50 animate-in fade-in duration-500">
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-4 p-4 bg-white border-b border-default-100 rounded-t-3xl">
        <Button isIconOnly variant="light" onPress={onBack} className="rounded-full">
          <ArrowLeftIcon className="size-5" />
        </Button>
        <h1 className="text-xl font-bold text-default-800">Proveedores</h1>
        
        <div className="flex-1 overflow-x-auto no-scrollbar ml-4">
          <Tabs 
            variant="underlined" 
            aria-label="Proveedores"
            classNames={{
              base: "h-12",
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary font-bold text-default-500 uppercase text-xs tracking-widest"
            }}
            selectedKey={estadoCuenta.id}
            onSelectionChange={(key) => onProviderChange?.(key as string)}
          >
            {(suppliers || []).map((p) => {
              const name = p.name || p.businessName;
              return <Tab key={p._id} title={name} />;
            })}
          </Tabs>
        </div>

        <div className="flex items-center gap-2 ml-4">
            <Button isIconOnly size="sm" variant="flat" className="rounded-full text-default-400">
                <PrinterIcon className="size-5" />
            </Button>
            <Button isIconOnly size="sm" variant="flat" className="rounded-full text-default-400">
                <ShareIcon className="size-5" />
            </Button>
        </div>
      </div>

      {/* Stats Header Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-white border-b border-default-100">
        <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-default-900 tracking-tight">Deuda Total</span>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-default-800">$</span>
                <span className="text-4xl font-extrabold text-default-900 tracking-tighter">
                  {stats.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>

        <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-default-900 tracking-tight">
              Pendiente de Pago
            </span>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-default-800">$</span>
                <span className="text-4xl font-extrabold text-default-900 tracking-tighter">
                  {stats.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>

        <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-danger tracking-tight italic">
              Deuda Vencida
            </span>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-danger/80">$</span>
                <span className="text-4xl font-bold text-danger tracking-tighter">
                  {stats.expiredAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-content1 rounded-3xl border border-default-100 overflow-hidden shadow-sm">
          <Table 
            aria-label="Movimientos de estado de cuenta"
            shadow="none"
            removeWrapper
            className="bg-transparent"
          >
            <TableHeader>
              <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Tipo</TableColumn>
              <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Fecha</TableColumn>
              <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Detalle</TableColumn>
              <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6">Estado</TableColumn>
              <TableColumn className="bg-default-50 text-default-500 font-semibold uppercase tracking-wider h-11 text-xs px-6 text-right">Monto</TableColumn>
            </TableHeader>
            <TableBody items={displayMovimientos} emptyContent="Sin movimientos registrados">
              {(item) => (
                <TableRow key={item.id} className="border-b border-default-50 last:border-0 hover:bg-default-50/50 transition-colors h-12">
                  <TableCell className="font-semibold text-foreground text-sm px-6">
                    {item.tipo}
                  </TableCell>
                  <TableCell className="text-default-500 text-sm font-normal px-6">
                    {item.fecha}
                  </TableCell>
                  <TableCell className={`text-sm font-semibold italic px-6 ${item.statusColor === 'danger' ? 'text-danger' : item.statusColor === 'success' ? 'text-success' : 'text-default-700'}`}>
                    {item.detalle1}
                  </TableCell>
                  <TableCell className={`text-sm font-semibold px-6 ${
                    (item.detalle2 === 'Confirmada' || item.detalle2 === 'Confirmado') 
                      ? 'text-default-700' 
                      : item.statusColor === 'danger' 
                        ? 'text-danger' 
                        : item.statusColor === 'success'
                          ? 'text-success'
                          : 'text-default-700'
                  }`}>
                    {item.detalle2}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className={`text-sm font-bold flex items-center justify-end gap-1 ${item.statusColor === 'danger' ? 'text-danger' : item.statusColor === 'success' ? 'text-success' : 'text-default-900'}`}>
                      {item.isNegative ? "-" : ""}
                      <span className="text-default-400 mr-0.5 text-xs">$</span>
                      {item.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
