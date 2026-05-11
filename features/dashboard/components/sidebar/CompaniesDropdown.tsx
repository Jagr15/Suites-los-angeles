"use client";

import Link from "next/link";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Button,
} from "@heroui/react";
import { Activity, ChevronDown } from "@heroui/shared-icons";

const companies = [
  { name: "Los Ángelos POS", href: "/dashboard" },
  { name: "Sucursal Centro", href: "/dashboard" },
  { name: "Sucursal Norte", href: "/dashboard" },
];

type CompaniesDropdownProps = { collapsed?: boolean };

export function CompaniesDropdown({ collapsed }: CompaniesDropdownProps) {
  const trigger = collapsed ? (
    <Link
      href="/dashboard"
      className="flex h-11 w-11 min-w-11 items-center justify-center rounded-xl bg-white/5 text-white shadow-sm transition-all hover:bg-white/15 hover:shadow"
    >
      <Activity className="size-5" />
    </Link>
  ) : (
    <Link
      href="/dashboard"
      className="flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 font-bold text-white shadow-sm transition-all hover:border-white/20 hover:bg-white/10"
    >
      <span className="flex items-center gap-2 truncate">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <Activity className="size-4" />
        </span>
        Los Ángelos POS
      </span>
      <ChevronDown className="size-4 shrink-0 opacity-80" />
    </Link>
  );

  return (
    <Dropdown
      classNames={{
        base: "bg-neutral-950 border border-white/20 shadow-xl",
        content: "bg-neutral-950 border border-white/20 py-2",
      }}
    >
      <DropdownTrigger>{trigger}</DropdownTrigger>
      <DropdownMenu
        aria-label="Seleccionar empresa"
        classNames={{
          base: "bg-transparent",
          list: "gap-0.5",
        }}
      >
        <DropdownSection
          title="Empresas"
          classNames={{
            heading: "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50",
            group: "p-1",
          }}
        >
          {companies.map((c) => (
            <DropdownItem
              key={c.name}
              as={Link}
              href={c.href}
              className="rounded-lg px-3 py-2.5 text-white data-[hover=true]:bg-white/10 data-[hover=true]:text-white"
            >
              {c.name}
            </DropdownItem>
          ))}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
