"use client";

import { Input, Avatar } from "@heroui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useRoles } from "@/shared/hooks";

export function DashboardHeader() {
  const { user, role } = useRoles();

  return (
    <header className="flex flex-nowrap items-center justify-between gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-md px-6 py-3 dark:border-gray-800 dark:bg-black/50 sticky top-0 z-10">
      <Input
        aria-label="Buscar"
        classNames={{
          base: "max-w-md",
          inputWrapper:
            "bg-default-100 border-none shadow-none hover:bg-default-200 focus-within:!bg-default-100",
          input: "text-small",
        }}
        placeholder="Buscar en el sistema..."
        size="sm"
        startContent={<MagnifyingGlassIcon className="size-4 text-default-400" />}
      />
    
      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden md:flex flex-col items-end mr-1">
          <p className="text-tiny font-bold text-foreground leading-none">{user?.name || user?.email || "Usuario"}</p>
          <p className="text-[10px] text-default-400 font-medium tracking-tight uppercase">{role || "Sin Rol"}</p>
        </div>
        <Avatar
          src={user?.image || "https://i.pravatar.cc/150?u=a042581f4e29026704d"}
          size="sm"
          isBordered
          color="primary"
          className="cursor-pointer hover:scale-105 transition-transform"
        />
      </div>
    </header>
  );
}
