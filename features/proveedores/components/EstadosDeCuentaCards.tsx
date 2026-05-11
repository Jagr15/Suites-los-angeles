"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardBody, CardHeader, Chip, Button, Divider } from "@heroui/react";
import { BanknotesIcon, CalendarDaysIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import type { EstadoCuentaRow } from "@/shared/mocks";

type EstadosDeCuentaCardsProps = {
  items: EstadoCuentaRow[];
  /** Nombre del proveedor a resaltar (ej. al venir desde Compras) */
  proveedorSeleccionado?: string | null;
  onSelect?: (item: EstadoCuentaRow) => void;
};

export function EstadosDeCuentaCards({ items, proveedorSeleccionado, onSelect }: EstadosDeCuentaCardsProps) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!proveedorSeleccionado) return;
    const ref = cardRefs.current[proveedorSeleccionado];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [proveedorSeleccionado]);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const isSelected =
          proveedorSeleccionado &&
          item.proveedor.toLowerCase() === proveedorSeleccionado.toLowerCase();
        
        return (
          <Card
            key={item.id}
            isPressable
            onPress={() => onSelect?.(item)}
            ref={(el: Element | null) => {
              if (el) cardRefs.current[item.proveedor] = el as unknown as HTMLDivElement;
            }}
            className={`border-none shadow-sm hover:shadow-xl transition-all duration-300 group ${
              isSelected 
                ? "ring-2 ring-primary bg-primary/5" 
                : "bg-content1"
            }`}
          >
            <CardHeader className="flex justify-between items-start px-6 pt-6 pb-2">
              <div className="flex flex-col gap-1">
                <span className="text-small text-default-500 font-medium uppercase tracking-wider">Estado de Cuenta</span>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.proveedor}
                </h3>
              </div>
              <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-primary/20 text-primary' : 'bg-default-100 text-default-500 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                <BanknotesIcon className="size-6" />
              </div>
            </CardHeader>
            <CardBody className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-tiny text-default-400 font-semibold uppercase">Deuda Acumulada</span>
                  <span className="text-3xl font-black tracking-tight text-foreground">
                    {item.total}
                  </span>
                </div>

                <Divider className="opacity-50" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CalendarDaysIcon className="size-3.5 text-primary" />
                      <span className="text-tiny text-default-500 font-bold uppercase">Próximo Pago</span>
                    </div>
                    <span className="text-small font-semibold text-foreground">
                      {item.fechaPago}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-tiny text-default-400 font-semibold uppercase">A liquidar</span>
                    <span className="text-lg font-bold text-primary">
                      {item.montoAPagar}
                    </span>
                  </div>
                </div>

                <div 
                  className="w-full py-2 rounded-xl bg-primary/10 text-primary flex items-center justify-center gap-2 mt-2 font-bold group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                >
                  <span className="text-sm">Ver Movimientos</span>
                  <ArrowRightIcon className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
