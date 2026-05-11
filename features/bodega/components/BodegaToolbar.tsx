"use client";

import { Button, Input } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

type BodegaToolbarProps = {
  onAgregar?: () => void;
  agregarLabel?: string;
};

export function BodegaToolbar({ onAgregar, agregarLabel = "Agregar" }: BodegaToolbarProps) {
  return (
    <div className="flex w-full flex-nowrap items-center gap-3">
      <Button
        color="primary"
        radius="full"
        startContent={<PlusIcon className="size-5 stroke-[3]" />}
        className="h-10 px-6 shrink-0"
        onPress={onAgregar}
      >
        {agregarLabel}
      </Button>
      <Input
        placeholder="Buscar registro..."
        radius="full"
        classNames={{
          inputWrapper: "h-10 bg-white border border-default-200 shadow-sm transition-all hover:bg-default-50",
        }}
        startContent={<MagnifyingGlassIcon className="size-5 text-default-400" />}
        className="flex-1"
      />
      <Button isIconOnly variant="bordered" radius="full" className="min-w-10 h-10 border-default-200 shrink-0">
        <FunnelIcon className="size-5" />
      </Button>
    </div>
  );
}
