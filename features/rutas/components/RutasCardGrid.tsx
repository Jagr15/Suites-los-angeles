"use client";

import { Button, Tooltip } from "@heroui/react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { Route } from "@/features/configuracion/components/routes/types";

type RutasCardGridProps = {
  items: Route[];
  onEditar?: (item: Route) => void;
  onBorrar?: (item: Route) => void;
  onSelect?: (item: Route) => void;
};

/** Extrae código numérico de la ruta (ej. "Ruta 101" -> "101", "001" -> "001"). */
function getCodigo(ruta: string): string {
  const match = ruta.replace(/\s/g, "").match(/(\d+)$/);
  return match ? match[1].padStart(3, "0") : ruta;
}

export function RutasCardGrid({ items, onEditar, onBorrar, onSelect }: RutasCardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect?.(item)}
          className="flex flex-col cursor-pointer rounded-3xl border border-default-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50 relative group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary/70">
                {item.name}
              </p>
              <h3 className="mt-1 text-xl font-bold text-default-800">{item.destination}</h3>
              <p className="text-[10px] font-bold text-default-400 uppercase tracking-tighter">
                {item.deliveryType === "sucursal" ? "Servicio Local" : "Foráneo / Envío"}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip content="Editar">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditar?.(item);
                  }}
                  className="rounded-full h-8 w-8 min-w-0"
                >
                  <PencilSquareIcon className="size-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Borrar">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBorrar?.(item);
                  }}
                  className="rounded-full h-8 w-8 min-w-0"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </Tooltip>
            </div>
          </div>

          <p className="mt-4 text-sm font-medium text-default-400 italic">
            Responsable: <span className="text-default-600 font-bold not-italic">{item.assignedProfileName}</span>
          </p>

          <div className="mt-4 flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-success animate-pulse" : "bg-danger"}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-default-400">
               {item.isActive ? "Activa" : "Inactiva"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
