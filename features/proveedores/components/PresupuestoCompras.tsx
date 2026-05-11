"use client";

import { Card, CardBody, Button, Tooltip } from "@heroui/react";
import { PrinterIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { PresupuestoCompraRow } from "@/shared/mocks";

type PresupuestoComprasProps = {
    items: PresupuestoCompraRow[];
    onSelect?: (item: PresupuestoCompraRow) => void;
};

export function PresupuestoCompras({ items, onSelect }: PresupuestoComprasProps) {
    return (
        <div className="space-y-4">
            <div className="grid gap-3">
                {items.map((item) => (
                    <Card 
                        key={item.id} 
                        onClick={() => onSelect?.(item)}
                        className="border-none shadow-sm shadow-black/5 rounded-full w-full text-left cursor-pointer hover:bg-default-50 transition-colors"
                    >
                        <CardBody className="px-6 py-3 flex flex-row items-center justify-between">
                            <div className="flex-1">
                                <span className="text-lg font-semibold text-foreground mr-2">
                                    {item.proveedor}
                                </span>
                                {item.fecha && (
                                    <span className="text-sm text-default-400 italic font-medium">
                                        — Compra programada para {item.fecha}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-default-500 mr-4">
                                <Tooltip content="Imprimir">
                                    <Button 
                                        isIconOnly 
                                        size="sm" 
                                        variant="light" 
                                        className="text-default-400 hover:text-primary"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <PrinterIcon className="size-5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Exportar">
                                    <Button 
                                        isIconOnly 
                                        size="sm" 
                                        variant="light" 
                                        className="text-default-400 hover:text-primary"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ArrowUpTrayIcon className="size-5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Descargar">
                                    <Button 
                                        isIconOnly 
                                        size="sm" 
                                        variant="light" 
                                        className="text-default-400 hover:text-primary"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ArrowDownTrayIcon className="size-5" />
                                    </Button>
                                </Tooltip>
                            </div>

                            <div className="text-xl font-bold text-foreground">
                                <span className="text-default-400 mr-2">$</span>
                                {item.monto.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>


        </div>
    );
}
