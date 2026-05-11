"use client";

import { Card, CardBody, CardFooter, Button, Divider } from "@heroui/react";
import type { NominaRow } from "@/shared/mocks";

type BodegaNominasProps = {
    items: NominaRow[];
    onSelect?: (item: NominaRow) => void;
};

export function BodegaNominas({ items, onSelect }: BodegaNominasProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
                <Card 
                    key={item.id} 
                    className="border-none shadow-sm shadow-black/10 transition-transform active:scale-95 cursor-pointer" 
                    radius="lg" 
                    isPressable
                    onPress={() => onSelect?.(item)}
                >
                    <CardBody className="p-4 flex flex-col items-center text-center gap-1">
                        <h3 className="text-lg font-bold text-foreground">
                            {item.empleado.split(" ")[0]}
                            <br />
                            {item.empleado.split(" ").slice(1).join(" ")}
                        </h3>
                        <p className="text-xs text-default-500 font-medium">{item.fecha}</p>
                        <p className="text-xl font-bold text-foreground mt-1">
                            ${item.monto.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                    </CardBody>
                    <Divider />
                    <CardFooter className="flex flex-col p-0 overflow-hidden">
                        <Button
                            as="div"
                            fullWidth
                            variant="light"
                            radius="none"
                            className={`h-10 text-xs font-semibold ${item.abonoStatus === "Abono Registrado"
                                    ? "text-success bg-success/5"
                                    : "text-default-600"
                                }`}
                        >
                            {item.abonoStatus}
                        </Button>
                        <Divider />
                        <div
                            className={`flex w-full items-center justify-center h-10 text-xs font-bold uppercase tracking-wider ${item.entregaStatus === "Entregado" ? "text-success bg-success/10" : "text-danger bg-danger/10"
                                }`}
                        >
                            {item.entregaStatus}
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
