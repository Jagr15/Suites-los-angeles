"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button, Avatar, Tooltip } from "@heroui/react";
import {
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useSidebarContext } from "./layout/layout-context";
import {
  CompaniesDropdown,
  SidebarItem,
  SidebarMenu,
  CollapseItems,
} from "./sidebar";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRoles } from "@/shared/hooks";

const SIDEBAR_WIDTH = 272;
const SIDEBAR_WIDTH_COLLAPSED = 80;

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebarContext();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.queries.current);
  const { 
    isAdmin, 
    isBodega, 
    isVendedor,
    role,
  } = useRoles();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login"); // Redirigir al login después de salir
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 z-[19] bg-black/60 backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={setCollapsed}
        />
      )}

      <aside
        className="fixed left-0 top-0 z-[20] flex h-screen flex-col border-r border-white/20 bg-gradient-to-b from-black via-neutral-950 to-black shadow-2xl transition-[width] duration-300 ease-out"
        style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
      >
        {/* Header unificado: logo + colapsar + salir (todo junto al sidebar) */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-2">
          <div className={collapsed ? "flex min-w-0 flex-1 justify-center" : "min-w-0 flex-1"}>
            <CompaniesDropdown collapsed={collapsed} />
          </div>
          <Tooltip content={collapsed ? "Expandir" : "Colapsar"} placement="right" color="primary" showArrow>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="flex h-8 min-h-8 w-8 min-w-8 shrink-0 items-center justify-center bg-white/5 text-white hover:bg-white/15"
              onPress={setCollapsed}
            >
              {collapsed ? (
                <ChevronRightIcon className="size-4 shrink-0" aria-hidden />
              ) : (
                <ChevronLeftIcon className="size-4 shrink-0" aria-hidden />
              )}
            </Button>
          </Tooltip>
        </div>

        {/* Zona central: scroll independiente y fluido */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-5 scroll-smooth ${collapsed ? "flex flex-col items-center gap-2 px-2" : "px-3"}`}
            style={{ scrollbarGutter: "stable" }}
          >
            <SidebarItem
              title="Inicio"
              icon={<HomeIcon className="size-5" />}
              isActive={pathname === "/dashboard"}
              href="/dashboard"
              collapsed={collapsed}
            />

            <SidebarMenu title="Menú principal" collapsed={collapsed}>
              {(isAdmin || isBodega) && (
                <SidebarItem
                  title="Productos"
                  icon={<CubeIcon className="size-5" />}
                  isActive={pathname === "/dashboard/productos"}
                  href="/dashboard/productos"
                  collapsed={collapsed}
                />
              )}
              {(isAdmin || isBodega) && (
                <SidebarItem
                  title="Proveedores"
                  icon={<UserGroupIcon className="size-5" />}
                  isActive={pathname === "/dashboard/proveedores"}
                  href="/dashboard/proveedores"
                  collapsed={collapsed}
                />
              )}
              {(isAdmin || isBodega) && (
                <SidebarItem
                  title="Bodega"
                  icon={<BuildingStorefrontIcon className="size-5" />}
                  isActive={pathname === "/dashboard/bodega"}
                  href="/dashboard/bodega"
                  collapsed={collapsed}
                />
              )}
              {(isAdmin || isVendedor) && (
                <SidebarItem
                  title="Rutas"
                  icon={<MapPinIcon className="size-5" />}
                  isActive={pathname === "/dashboard/rutas"}
                  href="/dashboard/rutas"
                  collapsed={collapsed}
                />
              )}
              {isAdmin && (
                <SidebarItem
                  title="Finanzas"
                  icon={<ChartBarIcon className="size-5" />}
                  isActive={pathname === "/dashboard/finanzas"}
                  href="/dashboard/finanzas"
                  collapsed={collapsed}
                />
              )}
              {(isAdmin || isVendedor) && (
                <SidebarItem
                  title="Clientes"
                  icon={<UserGroupIcon className="size-5" />}
                  isActive={pathname === "/dashboard/clientes"}
                  href="/dashboard/clientes"
                  collapsed={collapsed}
                />
              )}
            </SidebarMenu>

            <SidebarMenu title="General" collapsed={collapsed}>
              {isAdmin && (
                <SidebarItem
                  title="Administración"
                  icon={<Cog6ToothIcon className="size-5" />}
                  isActive={pathname === "/dashboard/configuracion"}
                  href="/dashboard/configuracion"
                  collapsed={collapsed}
                />
              )}
              <SidebarItem
                title="Mi Cuenta"
                icon={<UserCircleIcon className="size-5" />}
                isActive={pathname === "/dashboard/cuenta"}
                href="/dashboard/cuenta"
                collapsed={collapsed}
              />
            </SidebarMenu>
          </div>

          {/* Footer: usuario + cerrar sesión */}
          <div className="shrink-0 border-t border-white/10 bg-white/[0.02] px-3 py-4">
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <Tooltip content={`${user?.name || "Usuario"} (${role || "Sin Rol"})`} color="primary" placement="right" showArrow>
                  <Avatar src={user?.image || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} size="sm" className="ring-2 ring-white/10" />
                </Tooltip>
                <Tooltip content="Cerrar sesión" color="danger" placement="right" showArrow>
                  <Button isIconOnly size="sm" variant="light" className="text-white/70 hover:bg-white/10 hover:text-white" onPress={handleLogout} aria-label="Cerrar sesión">
                    <ArrowRightOnRectangleIcon className="size-5" />
                  </Button>
                </Tooltip>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <Avatar src={user?.image || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} size="sm" className="shrink-0 ring-2 ring-white/10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user?.name || "Usuario"}</p>
                  <p className="truncate text-[10px] font-medium text-white/50 uppercase tracking-wider">{role || "Sin Rol"}</p>
                </div>
                <Tooltip content="Cerrar sesión" color="danger" showArrow>
                  <Button isIconOnly size="sm" variant="light" className="shrink-0 text-white/70 hover:bg-white/10 hover:text-white" onPress={handleLogout} aria-label="Cerrar sesión">
                    <ArrowRightOnRectangleIcon className="size-5" />
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
