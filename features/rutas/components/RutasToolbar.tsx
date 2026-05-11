"use client";

import { Button, Input } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

type RutasToolbarProps = {
  onAgregar?: () => void;
  showSearch?: boolean;
};

export function RutasToolbar({ onAgregar, showSearch = true }: RutasToolbarProps) {
  return (
    <div className="flex w-full flex-nowrap items-center gap-3">
      <Button
        color="primary"
        startContent={<PlusIcon className="size-5" />}
        className="shrink-0 rounded-full font-bold px-6"
        onPress={onAgregar}
      >
        Agregar ruta
      </Button>
      <Button
        variant="bordered"
        startContent={<ArrowUpTrayIcon className="size-5" />}
        className="shrink-0 rounded-full font-bold border-default-200"
      >
        Importar Excel
      </Button>
      {showSearch && (
        <Input
          aria-label="Buscar ruta"
          classNames={{
            inputWrapper:
              "min-w-0 flex-1 bg-white border border-default-200 shadow-sm rounded-full px-6",
            input: "text-sm font-semibold"
          }}
          placeholder="Buscar ruta o destino..."
          endContent={<MagnifyingGlassIcon className="size-5 shrink-0 text-default-400" />}
        />
      )}
      <Button variant="bordered" className="shrink-0 rounded-full font-bold border-default-200">
        Filtrar
      </Button>
    </div>
  );
}
