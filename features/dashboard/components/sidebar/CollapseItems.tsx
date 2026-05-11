"use client";

import { Accordion, AccordionItem } from "@heroui/react";
import Link from "next/link";

type CollapseItemsProps = {
  icon: React.ReactNode;
  title: string;
  items: { label: string; href: string }[];
};

export function CollapseItems({ icon, title, items }: CollapseItemsProps) {
  return (
    <Accordion
      selectionMode="multiple"
      className="px-0"
      itemClasses={{
        base: "px-0 border-none",
        title: "text-white font-semibold",
        trigger:
          "py-2.5 min-h-[48px] data-[hover=true]:bg-white/10 rounded-xl transition-colors px-3",
        content: "px-0 pb-3 pt-0",
      }}
    >
      <AccordionItem
        key={title}
        aria-label={title}
        startContent={
          <span className="flex shrink-0 items-center justify-center rounded-lg bg-white/5 p-1.5 text-white/90">
            {icon}
          </span>
        }
        title={title}
        classNames={{
          trigger: "text-white gap-3",
          content: "text-white/80",
          indicator: "text-white/70",
        }}
      >
        <div className="flex flex-col gap-0.5 border-l-2 border-white/20 pl-5 ml-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:pl-4 hover:text-white before:absolute before:left-0 before:top-1/2 before:h-1 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-white/50 before:content-['']"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </AccordionItem>
    </Accordion>
  );
}
