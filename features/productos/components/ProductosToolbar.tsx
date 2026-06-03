"use client";

import { Button, Input } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

type ProductosToolbarProps = {
  onAgregar?: () => void;
  onImportExcel?: (file: File) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export function ProductosToolbar({ onAgregar, onImportExcel, searchValue, onSearchChange }: ProductosToolbarProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportExcel) {
      onImportExcel(file);
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
      <Button color="primary" startContent={<PlusIcon className="size-5" />} className="w-full shrink-0 md:w-auto" onPress={onAgregar}>
        Agregar
      </Button>
      <div className="relative w-full shrink-0 md:w-auto">
        <Button 
          variant="bordered" 
          startContent={<ArrowUpTrayIcon className="size-5" />} 
          className="w-full md:w-auto"
          onPress={() => document.getElementById("excel-import")?.click()}
        >
          Importar Excel
        </Button>
        <input
          id="excel-import"
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <Input
        aria-label="Buscar producto"
        classNames={{
          base: "w-full min-w-0",
          inputWrapper: "min-w-0 flex-1 bg-gray-200 border border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-600",
        }}
        placeholder="Buscar producto..."
        value={searchValue}
        onValueChange={onSearchChange}
        endContent={<MagnifyingGlassIcon className="size-5 shrink-0 text-default-400" />}
      />
      <Button variant="bordered" className="w-full shrink-0 md:w-auto">
        Filtrar
      </Button>
    </div>
  );
}
