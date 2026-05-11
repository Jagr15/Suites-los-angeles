"use client";

import { Button, Input } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

type ProveedoresToolbarProps = {
  onAgregar?: () => void;
  onImportExcel?: (file: File) => void;
  agregarLabel?: string;
  buscarPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  hideAdd?: boolean;
};

export function ProveedoresToolbar({
  onAgregar,
  onImportExcel,
  agregarLabel = "Agregar proveedor",
  buscarPlaceholder = "Buscar proveedor...",
  searchValue,
  onSearchChange,
  hideAdd = false,
}: ProveedoresToolbarProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportExcel) {
      onImportExcel(file);
    }
    e.target.value = "";
  };

  return (
    <div className="flex w-full flex-nowrap items-center gap-3">
      {!hideAdd && (
        <Button
          color="primary"
          startContent={<PlusIcon className="size-5" />}
          className="shrink-0"
          onPress={onAgregar}
        >
          {agregarLabel}
        </Button>
      )}
      <div className="relative shrink-0">
        <Button
          variant="bordered"
          startContent={<ArrowUpTrayIcon className="size-5" />}
          onPress={() => document.getElementById("excel-import-proveedores")?.click()}
        >
          Importar Excel
        </Button>
        <input
          id="excel-import-proveedores"
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <Input
        aria-label="Buscar proveedor"
        classNames={{
          inputWrapper:
            "min-w-0 flex-1 bg-gray-200 border border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-600",
        }}
        placeholder={buscarPlaceholder}
        value={searchValue}
        onValueChange={onSearchChange}
        endContent={<MagnifyingGlassIcon className="size-5 shrink-0 text-default-400" />}
      />
      <Button variant="bordered" className="shrink-0">
        Filtrar
      </Button>
    </div>
  );
}
