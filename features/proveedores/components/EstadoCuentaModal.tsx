"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Tabs,
  Tab,
  Card,
  CardBody,
} from "@heroui/react";
import { ArrowLeftIcon, PrinterIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { EstadoCuentaRow } from "@/shared/mocks";
import { formatShortDate } from "@/shared/utils/date";

type EstadoCuentaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  estadoCuenta: EstadoCuentaRow | null;
  allEstados?: EstadoCuentaRow[];
};

export function EstadoCuentaModal({ isOpen, onClose, estadoCuenta }: EstadoCuentaModalProps) {
  // 1. Llamar a los datos reales de Convex
  const suppliers = useQuery(api.suppliers.queries.list);
  const movimientos = useQuery(api.supplierTransactions.queries.listBySupplier, 
    estadoCuenta?.id ? { supplierId: estadoCuenta.id as Id<"suppliers"> } : "skip"
  );

  if (!estadoCuenta) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="5xl" 
      scrollBehavior="inside"
      hideCloseButton
      classNames={{
        base: "bg-default-50 max-h-[90vh]",
        header: "p-0",
        body: "p-6 pt-2"
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col">
              {/* Top Navigation Bar */}
              <div className="flex items-center gap-4 p-4 bg-white border-b border-default-100">
                <Button isIconOnly variant="light" onPress={onClose} className="rounded-full">
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
                    selectedKey={String(estadoCuenta.id)}
                  >
                    {(suppliers || []).map((p) => (
                      <Tab key={String(p._id)} title={p.businessName || p.name} />
                    ))}
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
              <div className="grid grid-cols-3 gap-8 p-10 bg-white">
                <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-default-900 tracking-tight">Deuda Total</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-default-800">$</span>
                        <span className="text-4xl font-extrabold text-default-900 tracking-tighter">65,765.85</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-default-900 tracking-tight">A pagar 30 de Junio</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-default-800">$</span>
                        <span className="text-4xl font-extrabold text-default-900 tracking-tighter">13,736.60</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-default-500 tracking-tight">Deuda desp del pago</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-default-400">$</span>
                        <span className="text-4xl font-bold text-default-500 tracking-tighter">52,029.25</span>
                    </div>
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-3 pb-8">
                {movimientos?.map((item) => (
                  <Card 
                    key={item._id} 
                    shadow="none" 
                    className="border border-default-200 rounded-full hover:bg-white transition-colors group"
                  >
                    <CardBody className="py-2 px-10 flex flex-row items-center justify-between min-h-[56px]">
                      <div className="flex items-center gap-8 flex-1">
                        <span className="w-20 text-xl font-bold text-default-800">
                          {item.type === "Cargo" ? "Compra" : "Pago"}
                        </span>
                        
                        <span className="text-xl font-bold text-default-800 min-w-[180px]">
                          {formatShortDate(item.date, { includeYear: true })}
                        </span>

                        <span className="text-xl font-bold italic text-default-800">
                          {item.category || "General"}
                        </span>

                        <span className="text-xl font-bold text-default-800">
                          {item.status}
                        </span>
                      </div>

                      <div className={`text-2xl font-bold flex items-center gap-1 ${item.type === 'Cargo' ? 'text-danger' : 'text-success'}`}>
                        {item.type === 'Cargo' ? "-" : ""}
                        <span className="mr-0.5">$</span>
                        {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </CardBody>
                  </Card>
                ))}

                {/* Placeholder empty rows for aesthetic as in drawing */}
                {[...Array(2)].map((_, i) => (
                   <Card key={`empty-${i}`} shadow="none" className="border border-default-200 rounded-full opacity-60">
                     <CardBody className="py-2 px-10 flex flex-row items-center justify-between min-h-[56px]">
                        <span className="text-xl font-bold text-default-300">Pago</span>
                     </CardBody>
                   </Card>
                ))}
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
