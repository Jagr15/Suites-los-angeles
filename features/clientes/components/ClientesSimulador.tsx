"use client";

import { Card, Input, Checkbox } from "@heroui/react";

export function ClientesSimulador() {
  return (
    <Card className="p-4 border-none shadow-sm bg-content1">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h3 className="text-[11px] font-black text-default-400 uppercase tracking-widest leading-none">
                CONSTRUCTOR DE EXPERIMENTOS (Simulación)
            </h3>
            <div className="flex items-center gap-2">
                <Checkbox defaultSelected size="sm">
                    <span className="text-[10px] font-bold text-default-500 uppercase">Real-time projected impact</span>
                </Checkbox>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-default-400 uppercase">Costo Gasolina Target</label>
            <Input 
              type="number" 
              defaultValue="250" 
              variant="flat"
              size="sm"
              className="max-w-full"
              endContent={<span className="text-[10px] text-default-400">lite</span>}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-default-400 uppercase">Margen Bruto Target%</label>
            <Input 
              type="number" 
              defaultValue="20" 
              variant="flat"
              size="sm"
              endContent={<span className="text-[10px] text-default-400">%</span>}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-default-400 uppercase">Apalancamiento Target%</label>
            <Input 
              type="number" 
              defaultValue="50" 
              variant="flat"
              size="sm"
              endContent={<span className="text-[10px] text-default-400">%</span>}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-default-400 uppercase">Tasa Interés Target%</label>
            <Input 
              type="number" 
              defaultValue="10" 
              variant="flat"
              size="sm"
              endContent={<span className="text-[10px] text-default-400">%</span>}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
