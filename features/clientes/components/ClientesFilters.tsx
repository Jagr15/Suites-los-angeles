"use client";

import { Select, SelectItem, DatePicker } from "@heroui/react";

export function ClientesFilters() {
    return (
        <div className="flex flex-col gap-4 py-2 px-6 bg-transparent">
            <div className="flex justify-between items-end border-b-2 border-foreground pb-2">
                <h1 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">
                    MONITOR DE GANANCIAS REALES DE CLIENTES
                </h1>
                <span className="text-[10px] font-black text-default-400 uppercase tracking-widest leading-none">
                    BARRA DE FILTROS GLOBALES
                </span>
            </div>
        </div>
    );
}
