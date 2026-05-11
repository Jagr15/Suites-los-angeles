"use client";

import Link from "next/link";
import { Button, Tooltip } from "@heroui/react";

type SidebarItemProps = {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href: string;
  collapsed?: boolean;
};

export function SidebarItem({ title, icon, isActive, href, collapsed }: SidebarItemProps) {
  const content = (
    <Button
      as={Link}
      href={href}
      variant="light"
      color={isActive ? "primary" : "default"}
      isIconOnly={collapsed}
      className={`
        relative overflow-hidden font-semibold transition-all duration-200
        ${collapsed ? "min-w-10 w-10 shrink-0" : "w-full justify-start gap-3 pl-3 pr-4"}
        ${!isActive ? "text-white/90 data-[hover=true]:bg-white/10 data-[hover=true]:text-white" : ""}
        ${isActive && !collapsed ? "bg-primary/20 text-primary shadow-inner" : ""}
        ${isActive && collapsed ? "bg-primary/25 text-primary" : ""}
      `}
      startContent={
        collapsed ? null : (
          <span
            className={`flex shrink-0 items-center justify-center rounded-lg transition-colors ${
              isActive ? "bg-primary/30 text-primary" : "bg-white/5 text-white/90"
            }`}
          >
            <span className="p-1.5">{icon}</span>
          </span>
        )
      }
      fullWidth={!collapsed}
    >
      {collapsed ? (
        <span className={isActive ? "text-primary" : ""}>{icon}</span>
      ) : (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
          )}
          {title}
        </>
      )}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip content={title} placement="right" color="primary" showArrow>
        {content}
      </Tooltip>
    );
  }
  return content;
}
